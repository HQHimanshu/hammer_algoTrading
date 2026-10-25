"""Execution Service for automated and manual order management on Delta Exchange Testnet."""

import datetime
import logging
import time
from typing import Any, Dict, List, Optional
from app.config import Settings
from app.database import Database
from app.exchange.delta_client import DeltaClient
from app.schemas.trading import (
    OrderResult,
    OrderSide,
    OrderStatus,
    OrderType,
    Position,
    SignalAction,
    StrategySignal,
)
from app.services.market_service import MarketService
from app.services.risk_service import RiskService

logger = logging.getLogger("algopilot.execution_service")


class ExecutionService:
    """Manages order submission, reconciliation, and database auditing."""

    def __init__(
        self,
        settings: Settings,
        delta_client: DeltaClient,
        market_service: MarketService,
        risk_service: RiskService,
        database: Any,
    ):
        self.settings = settings
        self.delta_client = delta_client
        self.market_service = market_service
        self.risk_service = risk_service
        self.database = database

    async def get_positions(self) -> List[Position]:
        """Fetch and reconcile active margined positions from Delta Testnet."""
        if not self.settings.has_credentials:
            return []

        try:
            raw_positions = await self.delta_client.get_positions()
            positions: List[Position] = []
            for p in raw_positions:
                size = float(p.get("size", 0.0))
                if abs(size) > 0:
                    positions.append(
                        Position(
                            product_id=int(p.get("product_id", 0)),
                            symbol=p.get("product_symbol", ""),
                            size=size,
                            entry_price=float(p.get("entry_price")) if p.get("entry_price") else None,
                            mark_price=float(p.get("mark_price")) if p.get("mark_price") else None,
                            unrealized_pnl=float(p.get("unrealized_pnl")) if p.get("unrealized_pnl") else None,
                            liquidation_price=float(p.get("liquidation_price")) if p.get("liquidation_price") else None,
                        )
                    )
            return positions
        except Exception as exc:
            logger.error("Failed to reconcile positions from exchange: %s", exc)
            return []

    async def get_position_for_symbol(self, symbol: str) -> Optional[Position]:
        """Find active position for a specific symbol."""
        positions = await self.get_positions()
        for pos in positions:
            if pos.symbol.upper() == symbol.upper():
                return pos
        return None

    async def execute_signal(self, signal: StrategySignal) -> Optional[OrderResult]:
        """Process a deterministic StrategySignal through risk checks and execution.

        Returns OrderResult if an order was proposed/submitted, or None if signal was HOLD.
        """
        # Always record signal in audit database
        await self.database.record_signal(
            symbol=signal.symbol,
            signal=signal.action.value,
            price=signal.price,
            fast_ma=signal.fast_ma,
            slow_ma=signal.slow_ma,
            rsi=signal.rsi,
            reason=signal.reason,
        )

        if signal.action == SignalAction.HOLD:
            logger.info("Signal is HOLD for %s. No order execution required.", signal.symbol)
            return None

        # Reconcile current position
        current_pos = await self.get_position_for_symbol(signal.symbol)
        curr_size = current_pos.size if current_pos else 0.0
        all_positions = await self.get_positions()
        open_pos_count = len(all_positions)

        intended_side: OrderSide
        intended_size: float
        is_closing: bool = False

        if signal.action == SignalAction.BUY:
            if curr_size > 0:
                logger.info("Already in long position (size=%s) for %s. Ignoring BUY signal.", curr_size, signal.symbol)
                return None
            intended_side = OrderSide.BUY
            intended_size = self.settings.MAX_POSITION_SIZE
            is_closing = False

        elif signal.action == SignalAction.SELL:
            if curr_size <= 0:
                logger.info("No open long position for %s to close. Ignoring SELL signal.", signal.symbol)
                return None
            intended_side = OrderSide.SELL
            intended_size = abs(curr_size)
            is_closing = True

        else:
            return None

        # Dispatch through execute_order to apply all pre-trade risk checks
        return await self.execute_order(
            symbol=signal.symbol,
            side=intended_side,
            order_type=OrderType.MARKET,
            size=intended_size,
            price=None,
            is_closing_position=is_closing,
        )

    async def execute_order(
        self,
        symbol: str,
        side: OrderSide,
        order_type: OrderType = OrderType.MARKET,
        size: float = 1.0,
        price: Optional[float] = None,
        is_closing_position: bool = False,
    ) -> OrderResult:
        """Submit an order with mandatory pre-trade risk evaluation."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        client_order_id = f"algopilot-{int(time.time() * 1000)}"

        # 1. Reconcile positions for risk assessment
        current_pos = await self.get_position_for_symbol(symbol)
        curr_size = current_pos.size if current_pos else 0.0
        all_positions = await self.get_positions()

        # 2. Pre-trade Risk Check (MANDATORY)
        decision = await self.risk_service.evaluate_trade(
            symbol=symbol,
            side=side,
            size=size,
            price=price,
            current_position_size=curr_size,
            open_positions_count=len(all_positions),
            is_closing_position=is_closing_position,
        )

        # Record risk decision with complete check details
        await self.database.record_risk_event(
            action=f"{side.value}_{order_type.value}",
            symbol=symbol,
            approved=decision.approved,
            reason=decision.reason,
            checks_passed=decision.checks_passed,
            checks_failed=decision.checks_failed,
            client_order_id=client_order_id,
        )

        if not decision.approved:
            logger.warning("Order execution REJECTED by risk service: %s", decision.reason)
            # Record rejected order attempt in DB
            await self.database.record_order(
                symbol=symbol,
                side=side.value,
                order_type=order_type.value,
                size=size,
                price=price,
                status=OrderStatus.REJECTED.value,
                client_order_id=client_order_id,
                response_payload={"rejection_reason": decision.reason},
            )
            return OrderResult(
                order_id=None,
                client_order_id=client_order_id,
                symbol=symbol,
                side=side,
                order_type=order_type,
                size=size,
                price=price,
                status=OrderStatus.REJECTED,
                message=decision.reason,
                timestamp=now_iso,
            )

        # 3. Resolve Delta instrument ID
        try:
            product_id = await self.market_service.get_product_id(symbol)
        except Exception as exc:
            err_msg = f"Failed to resolve product ID for symbol '{symbol}': {exc}"
            logger.error(err_msg)
            return OrderResult(
                order_id=None,
                client_order_id=client_order_id,
                symbol=symbol,
                side=side,
                order_type=order_type,
                size=size,
                price=price,
                status=OrderStatus.REJECTED,
                message=err_msg,
                timestamp=now_iso,
            )

        # 4. Submit Order to Delta Exchange Testnet
        try:
            resp = await self.delta_client.place_order(
                product_id=product_id,
                size=size,
                side=side.value,
                order_type=order_type.value,
                price=price,
                client_order_id=client_order_id,
            )
            self.risk_service.record_order_placed(symbol)

            exchange_order_id = str(resp.get("id", ""))
            raw_state = resp.get("state", "open").lower()

            status_map = {
                "open": OrderStatus.OPEN,
                "pending": OrderStatus.PENDING,
                "filled": OrderStatus.FILLED,
                "partially_filled": OrderStatus.PARTIALLY_FILLED,
                "cancelled": OrderStatus.CANCELLED,
                "rejected": OrderStatus.REJECTED,
            }
            order_status = status_map.get(raw_state, OrderStatus.OPEN)

            # Persist order record in database
            await self.database.record_order(
                symbol=symbol,
                side=side.value,
                order_type=order_type.value,
                size=size,
                price=price,
                status=order_status.value,
                client_order_id=client_order_id,
                order_id=exchange_order_id,
                response_payload=resp,
            )

            # If filled or partially filled, record trade execution
            if order_status in (OrderStatus.FILLED, OrderStatus.PARTIALLY_FILLED):
                fill_price = float(resp.get("average_fill_price") or price or 0.0)
                await self.database.record_trade(
                    symbol=symbol,
                    side=side.value,
                    size=float(resp.get("size", size)),
                    price=fill_price,
                    order_id=exchange_order_id,
                )

            logger.info(
                "Order submitted successfully: ID=%s, status=%s, symbol=%s",
                exchange_order_id,
                order_status.value,
                symbol,
            )

            return OrderResult(
                order_id=exchange_order_id,
                client_order_id=client_order_id,
                symbol=symbol,
                side=side,
                order_type=order_type,
                size=size,
                price=price,
                status=order_status,
                message=f"Order submitted to Delta Testnet. Status: {order_status.value}",
                exchange_response=resp,
                timestamp=now_iso,
            )

        except Exception as exc:
            err_msg = f"Order submission error: {str(exc)}"
            logger.error(err_msg)
            await self.database.record_order(
                symbol=symbol,
                side=side.value,
                order_type=order_type.value,
                size=size,
                price=price,
                status=OrderStatus.REJECTED.value,
                client_order_id=client_order_id,
                response_payload={"error": str(exc)},
            )
            return OrderResult(
                order_id=None,
                client_order_id=client_order_id,
                symbol=symbol,
                side=side,
                order_type=order_type,
                size=size,
                price=price,
                status=OrderStatus.REJECTED,
                message=err_msg,
                timestamp=now_iso,
            )
