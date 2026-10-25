"""Trading Event Ledger Service.

Provides structured recording, tracking, and deterministic analytics across:
- Strategy events (signals)
- Risk audit events
- Order submission and lifecycle events
- Execution fills
- Exit and performance events

Adheres to fail-closed audit requirements and stable identifier schemes.
"""

from __future__ import annotations

import datetime
import logging
from typing import Any, Dict, List, Optional, Union

from app.database import Database
from app.repositories.firestore_repo import FirestoreRepository
from app.schemas.trading import (
    AnalyticsSummaryResponse,
    ExecutionFillEvent,
    OrderEventRecord,
    OrderSide,
    OrderStatus,
    OrderType,
    RiskEventRecord,
    SignalAction,
    StrategyEvent,
    TradeLifecycleEvent,
)

logger = logging.getLogger("algopilot.event_service")


class EventService:
    """Trading Event Ledger coordinator for recording and querying structured trading events."""

    def __init__(self, storage: Union[Database, FirestoreRepository]) -> None:
        self.storage = storage

    # -------------------------------------------------------------------------
    # Recording Events
    # -------------------------------------------------------------------------

    async def record_strategy_event(
        self,
        symbol: str,
        signal: Union[SignalAction, str],
        price: float,
        fast_ma: Optional[float] = None,
        slow_ma: Optional[float] = None,
        rsi: Optional[float] = None,
        reason: str = "",
        parameters: Optional[Dict[str, Any]] = None,
        strategy_name: str = "EMA_RSI_Cross",
        strategy_version: str = "1.0.0",
    ) -> StrategyEvent:
        """Persist a strategy evaluation signal to the ledger."""
        action_str = signal.value if isinstance(signal, SignalAction) else str(signal).upper()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        raw_id = await self.storage.record_signal(
            symbol=symbol.upper(),
            signal=action_str,
            price=float(price),
            fast_ma=fast_ma,
            slow_ma=slow_ma,
            rsi=rsi,
            reason=reason,
        )

        signal_id = f"SIG-{raw_id}"

        return StrategyEvent(
            signal_id=signal_id,
            timestamp=now_iso,
            strategy_name=strategy_name,
            strategy_version=strategy_version,
            symbol=symbol.upper(),
            price=float(price),
            fast_ma=fast_ma,
            slow_ma=slow_ma,
            rsi=rsi,
            action=SignalAction(action_str) if action_str in SignalAction.__members__ else SignalAction.HOLD,
            reason=reason,
            parameters=parameters or {},
        )

    async def record_risk_event(
        self,
        symbol: str,
        action: str,
        approved: bool,
        reason: str,
        checks_passed: Optional[List[str]] = None,
        checks_failed: Optional[List[str]] = None,
        client_order_id: Optional[str] = None,
        signal_id: Optional[str] = None,
        rules_evaluated: Optional[List[str]] = None,
    ) -> RiskEventRecord:
        """Persist a pre-trade risk evaluation audit event."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        passed = checks_passed or []
        failed = checks_failed or []
        evaluated = rules_evaluated or (passed + failed)

        raw_id = await self.storage.record_risk_event(
            action=action,
            symbol=symbol.upper() if symbol else "",
            approved=approved,
            reason=reason,
            checks_passed=passed,
            checks_failed=failed,
            client_order_id=client_order_id,
        )

        event_id = f"RISK-{raw_id}"

        return RiskEventRecord(
            event_id=event_id,
            signal_id=signal_id,
            client_order_id=client_order_id,
            symbol=symbol.upper() if symbol else "",
            action=action,
            rules_evaluated=evaluated,
            checks_passed=passed,
            checks_failed=failed,
            approved=approved,
            reason=reason,
            timestamp=now_iso,
        )

    async def record_order_event(
        self,
        symbol: str,
        side: Union[OrderSide, str],
        order_type: Union[OrderType, str],
        size: float,
        price: Optional[float],
        status: Union[OrderStatus, str],
        client_order_id: Optional[str] = None,
        order_id: Optional[str] = None,
        signal_id: Optional[str] = None,
        risk_event_id: Optional[str] = None,
        response_payload: Optional[Dict[str, Any]] = None,
    ) -> OrderEventRecord:
        """Persist an order submission or status transition."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        side_val = OrderSide(side.lower()) if isinstance(side, str) else side
        type_val = OrderType(order_type.lower()) if isinstance(order_type, str) else order_type
        status_val = OrderStatus(status.lower()) if isinstance(status, str) else status

        raw_id = await self.storage.record_order(
            symbol=symbol.upper(),
            side=side_val.value,
            order_type=type_val.value,
            size=float(size),
            price=float(price) if price is not None else None,
            status=status_val.value,
            client_order_id=client_order_id,
            order_id=order_id,
            response_payload=response_payload,
        )

        resolved_id = str(order_id or client_order_id or raw_id)
        formatted_order_id = resolved_id if resolved_id.startswith("ORD-") else f"ORD-{resolved_id}"

        return OrderEventRecord(
            order_id=formatted_order_id,
            client_order_id=client_order_id or resolved_id,
            signal_id=signal_id,
            risk_event_id=risk_event_id,
            symbol=symbol.upper(),
            side=side_val,
            order_type=type_val,
            size=float(size),
            price=float(price) if price is not None else None,
            status=status_val,
            exchange_order_id=str(order_id) if order_id else None,
            timestamp=now_iso,
        )

    async def record_fill_event(
        self,
        order_id: str,
        symbol: str,
        side: Union[OrderSide, str],
        price: float,
        size: float,
        exchange_order_id: Optional[str] = None,
        fee: float = 0.0,
    ) -> ExecutionFillEvent:
        """Persist a confirmed execution fill event and link to trade ledger."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        side_val = OrderSide(side.lower()) if isinstance(side, str) else side
        fill_id = f"FILL-{int(datetime.datetime.now().timestamp() * 1000)}"

        # Also persist to trades table for trade history
        await self.storage.record_trade(
            symbol=symbol.upper(),
            side=side_val.value,
            size=float(size),
            price=float(price),
            order_id=order_id,
            trade_id=fill_id,
            realized_pnl=None,
        )

        return ExecutionFillEvent(
            fill_id=fill_id,
            order_id=order_id,
            exchange_order_id=exchange_order_id,
            symbol=symbol.upper(),
            side=side_val,
            price=float(price),
            size=float(size),
            fee=float(fee),
            timestamp=now_iso,
        )

    async def record_exit_event(
        self,
        trade_id: str,
        symbol: str,
        side: str,
        size: float,
        price: float,
        order_id: Optional[str] = None,
        realized_pnl: Optional[float] = None,
        exit_reason: Optional[str] = None,
    ) -> TradeLifecycleEvent:
        """Persist an exit / position close event with verified realized P&L."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        await self.storage.record_trade(
            symbol=symbol.upper(),
            side=side.lower(),
            size=float(size),
            price=float(price),
            order_id=order_id,
            trade_id=trade_id,
            realized_pnl=realized_pnl,
            exit_reason=exit_reason,
        )

        return TradeLifecycleEvent(
            trade_id=trade_id,
            order_id=order_id,
            symbol=symbol.upper(),
            side=side.lower(),
            size=float(size),
            price=float(price),
            realized_pnl=realized_pnl,
            exit_reason=exit_reason,
            timestamp=now_iso,
        )

    # -------------------------------------------------------------------------
    # Lookups and Queries
    # -------------------------------------------------------------------------

    async def get_strategy_event(self, identifier: str) -> Optional[StrategyEvent]:
        """Look up a strategy event by signal ID (e.g. 'SIG-1042' or '1042')."""
        clean_id = identifier.replace("SIG-", "").strip()
        data = await self.storage.get_signal_by_id(clean_id)
        if not data:
            return None

        action_raw = str(data.get("signal", "HOLD")).upper()
        action = SignalAction(action_raw) if action_raw in SignalAction.__members__ else SignalAction.HOLD

        return StrategyEvent(
            signal_id=f"SIG-{data.get('id', clean_id)}",
            timestamp=data.get("timestamp", ""),
            strategy_name=data.get("strategy_name", "EMA_RSI_Cross"),
            strategy_version=data.get("strategy_version", "1.0.0"),
            symbol=data.get("symbol", ""),
            price=float(data.get("price", 0.0)),
            fast_ma=data.get("fast_ma"),
            slow_ma=data.get("slow_ma"),
            rsi=data.get("rsi"),
            action=action,
            reason=data.get("reason", ""),
            parameters=data.get("parameters", {}),
        )

    async def get_risk_event(self, identifier: str) -> Optional[RiskEventRecord]:
        """Look up a risk event by ID (e.g. 'RISK-1042' or '1042')."""
        clean_id = identifier.replace("RISK-", "").strip()
        data = await self.storage.get_risk_event_by_id(clean_id)
        if not data:
            return None

        passed = data.get("checks_passed") or []
        failed = data.get("checks_failed") or []
        rules = data.get("rules_evaluated") or (passed + failed)

        return RiskEventRecord(
            event_id=f"RISK-{data.get('id', clean_id)}",
            signal_id=data.get("signal_id"),
            client_order_id=data.get("client_order_id"),
            symbol=data.get("symbol", ""),
            action=data.get("action", ""),
            rules_evaluated=rules,
            checks_passed=passed,
            checks_failed=failed,
            approved=bool(data.get("approved")),
            reason=data.get("reason", ""),
            timestamp=data.get("timestamp", ""),
        )

    async def get_order_event(self, identifier: str) -> Optional[OrderEventRecord]:
        """Look up an order event by internal ID, client_order_id, or exchange order_id."""
        clean_id = identifier.replace("ORD-", "").strip()
        data = await self.storage.get_order_by_id(clean_id)
        if not data:
            return None

        side_str = str(data.get("side", "buy")).lower()
        type_str = str(data.get("order_type", "market")).lower()
        status_str = str(data.get("status", "pending")).lower()

        return OrderEventRecord(
            order_id=f"ORD-{data.get('order_id') or data.get('client_order_id') or data.get('id', clean_id)}",
            client_order_id=data.get("client_order_id", ""),
            signal_id=data.get("signal_id"),
            risk_event_id=data.get("risk_event_id"),
            symbol=data.get("symbol", ""),
            side=OrderSide(side_str) if side_str in OrderSide.__members__.values() else OrderSide.BUY,
            order_type=OrderType(type_str) if type_str in OrderType.__members__.values() else OrderType.MARKET,
            size=float(data.get("size", 0.0)),
            price=float(data.get("price")) if data.get("price") is not None else None,
            status=OrderStatus(status_str) if status_str in OrderStatus.__members__.values() else OrderStatus.PENDING,
            exchange_order_id=str(data.get("order_id")) if data.get("order_id") else None,
            timestamp=data.get("created_at") or data.get("timestamp", ""),
        )

    async def get_trade_event(self, identifier: str) -> Optional[TradeLifecycleEvent]:
        """Look up a trade event by trade_id (e.g. 'TRD-1042' or 'FILL-1042')."""
        data = await self.storage.get_trade_by_id(identifier)
        if not data:
            return None

        return TradeLifecycleEvent(
            trade_id=str(data.get("trade_id") or data.get("id", clean_id)),
            order_id=data.get("order_id"),
            symbol=data.get("symbol", ""),
            side=data.get("side", ""),
            size=float(data.get("size", 0.0)),
            price=float(data.get("price", 0.0)),
            realized_pnl=float(data.get("realized_pnl")) if data.get("realized_pnl") is not None else None,
            exit_reason=data.get("exit_reason"),
            timestamp=data.get("executed_at") or data.get("timestamp", ""),
        )

    async def list_trades(self, symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent trades bounded by limit, optionally filtered by symbol."""
        if symbol:
            return await self.storage.get_trades_by_symbol(symbol.upper(), limit=limit)
        return await self.storage.get_recent_trades(limit=limit)

    async def list_risk_events(self, symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent risk events bounded by limit, optionally filtered by symbol."""
        if symbol:
            return await self.storage.get_risk_events_by_symbol(symbol.upper(), limit=limit)
        return await self.storage.get_recent_risk_events(limit=limit)

    async def list_orders(self, symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent orders bounded by limit, optionally filtered by symbol."""
        if symbol:
            return await self.storage.get_orders_by_symbol(symbol.upper(), limit=limit)
        return await self.storage.get_recent_orders(limit=limit)

    async def list_signals(self, symbol: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """List recent signals bounded by limit, optionally filtered by symbol."""
        if symbol:
            return await self.storage.get_signals_by_symbol(symbol.upper(), limit=limit)
        return await self.storage.get_recent_signals(limit=limit)

    # -------------------------------------------------------------------------
    # Deterministic Analytics Computation
    # -------------------------------------------------------------------------

    async def compute_analytics_summary(self, symbol: Optional[str] = None) -> AnalyticsSummaryResponse:
        """Calculate deterministic analytics over recorded database events.

        Does not rely on LLM for calculations; uses verifiable database records.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Fetch records
        signals = await self.list_signals(symbol=symbol, limit=100)
        orders = await self.list_orders(symbol=symbol, limit=100)
        trades = await self.list_trades(symbol=symbol, limit=100)
        risk_events = await self.list_risk_events(symbol=symbol, limit=100)

        # Order breakdown
        filled_count = 0
        rejected_count = 0
        cancelled_count = 0
        open_count = 0

        for o in orders:
            status = str(o.get("status", "")).lower()
            if status in ("filled", "closed"):
                filled_count += 1
            elif status in ("rejected",):
                rejected_count += 1
            elif status in ("cancelled", "canceled"):
                cancelled_count += 1
            elif status in ("open", "pending", "partially_filled"):
                open_count += 1

        # Trades and PnL breakdown
        total_trades = len(trades)
        closed_with_pnl = 0
        total_realized_pnl = 0.0
        profitable_trades = 0
        losing_trades = 0
        exit_reasons: Dict[str, int] = {}

        for t in trades:
            pnl = t.get("realized_pnl")
            if pnl is not None:
                try:
                    pnl_float = float(pnl)
                    total_realized_pnl += pnl_float
                    closed_with_pnl += 1
                    if pnl_float > 0:
                        profitable_trades += 1
                    elif pnl_float < 0:
                        losing_trades += 1
                except (ValueError, TypeError):
                    pass

            reason = t.get("exit_reason") or "unspecified"
            exit_reasons[reason] = exit_reasons.get(reason, 0) + 1

        win_rate = (profitable_trades / closed_with_pnl * 100.0) if closed_with_pnl > 0 else None

        # Risk rejections breakdown
        risk_rejections: Dict[str, int] = {}
        for r in risk_events:
            if not r.get("approved"):
                failed_checks = r.get("checks_failed") or []
                if isinstance(failed_checks, str):
                    try:
                        import json
                        failed_checks = json.loads(failed_checks)
                    except Exception:
                        failed_checks = [failed_checks]
                if isinstance(failed_checks, list) and failed_checks:
                    for check in failed_checks:
                        risk_rejections[check] = risk_rejections.get(check, 0) + 1
                else:
                    reason = r.get("reason", "risk_rejection")
                    risk_rejections[reason] = risk_rejections.get(reason, 0) + 1

        scope_desc = f"symbol:{symbol.upper()}" if symbol else "all_symbols"

        return AnalyticsSummaryResponse(
            total_signals=len(signals),
            total_orders=len(orders),
            filled_orders=filled_count,
            rejected_orders=rejected_count,
            cancelled_orders=cancelled_count,
            open_orders=open_count,
            total_trades=total_trades,
            closed_trades_with_pnl=closed_with_pnl,
            total_realized_pnl_usd=round(total_realized_pnl, 4),
            profitable_trades=profitable_trades,
            losing_trades=losing_trades,
            win_rate_percent=round(win_rate, 2) if win_rate is not None else None,
            exit_reason_distribution=exit_reasons,
            risk_rule_rejection_counts=risk_rejections,
            data_scope=scope_desc,
            timestamp=now_iso,
        )
