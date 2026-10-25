"""Automated Trading Engine and Background Evaluation Loop."""

import asyncio
import datetime
import logging
from typing import Any, Optional
from app.config import Settings
from app.schemas.trading import (
    Candle,
    OrderResult,
    SignalAction,
    StrategyEvaluationRequest,
    StrategySignal,
    StrategyStatus,
    TradingControlResponse,
    TradingStatusResponse,
)
from app.services.execution_service import ExecutionService
from app.services.market_service import MarketService
from app.services.risk_service import RiskService
from app.strategies.moving_average import MovingAverageRsiStrategy
from app.strategies.heikin_ashi import HeikinAshiStrategy

logger = logging.getLogger("algopilot.trading_engine")


class TradingEngine:
    """Coordinates strategy evaluation and automated execution loop."""

    def __init__(
        self,
        settings: Settings,
        market_service: MarketService,
        risk_service: RiskService,
        execution_service: ExecutionService,
        database: Any,
    ):
        self.settings = settings
        self.market_service = market_service
        self.risk_service = risk_service
        self.execution_service = execution_service
        self.database = database

        # Initialize strategies
        self.strategy = MovingAverageRsiStrategy(
            fast_period=settings.STRATEGY_FAST_PERIOD,
            slow_period=settings.STRATEGY_SLOW_PERIOD,
            rsi_period=settings.STRATEGY_RSI_PERIOD,
            rsi_overbought=settings.STRATEGY_RSI_OVERBOUGHT,
            rsi_oversold=settings.STRATEGY_RSI_OVERSOLD,
        )
        self.heikin_ashi_strategy = HeikinAshiStrategy(
            trend_bars=3,
            expiry_bars=5,
            stop_pct=0.3,
            target_pct=1.5,
        )

        # Background loop state
        self._loop_task: Optional[asyncio.Task] = None
        self._is_running: bool = False
        self._lock = asyncio.Lock()
        self._last_run_time: Optional[str] = None
        self._last_signal: Optional[StrategySignal] = None

    @property
    def is_running(self) -> bool:
        return self._is_running

    async def evaluate_strategy_dry_run(
        self, request: StrategyEvaluationRequest
    ) -> StrategySignal:
        """Evaluate strategy without placing orders (for validation & API evaluation)."""
        symbol = request.symbol.upper()
        candles = request.candles
        strat_id = (request.strategy_id or "strategy_1").lower()

        if strat_id in ["heikin_ashi", "strategy_heikin_ashi", "ha_breakout", "strategy_1_ha"]:
            if not candles:
                candles = await self.market_service.get_candles(
                    symbol=symbol,
                    resolution="1m",
                    limit=self.heikin_ashi_strategy.min_required_candles + 10,
                )
            signal = self.heikin_ashi_strategy.evaluate(symbol=symbol, candles=candles)
        else:
            if not candles:
                candles = await self.market_service.get_candles(
                    symbol=symbol,
                    resolution="1m",
                    limit=self.strategy.min_required_candles + 10,
                )
            signal = self.strategy.evaluate(symbol=symbol, candles=candles)

        self._last_signal = signal
        return signal

    async def start_loop(self) -> TradingControlResponse:
        """Start the automated trading loop in the background."""
        async with self._lock:
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            if self._is_running:
                return TradingControlResponse(
                    status="already_running",
                    trading_enabled=self.settings.TRADING_ENABLED,
                    emergency_stop_active=self.risk_service.is_emergency_stop_active,
                    loop_running=True,
                    message="Trading loop is already running.",
                    timestamp=now_iso,
                )

            self._is_running = True
            self._loop_task = asyncio.create_task(self._run_loop())
            logger.info("Automated trading loop STARTED for %s", self.settings.DEFAULT_TRADING_SYMBOL)

            return TradingControlResponse(
                status="started",
                trading_enabled=self.settings.TRADING_ENABLED,
                emergency_stop_active=self.risk_service.is_emergency_stop_active,
                loop_running=True,
                message=f"Trading loop started successfully on interval {self.settings.EXECUTION_LOOP_INTERVAL_SECONDS}s.",
                timestamp=now_iso,
            )

    async def stop_loop(self) -> TradingControlResponse:
        """Stop the background automated trading loop cleanly."""
        async with self._lock:
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            if not self._is_running:
                return TradingControlResponse(
                    status="not_running",
                    trading_enabled=self.settings.TRADING_ENABLED,
                    emergency_stop_active=self.risk_service.is_emergency_stop_active,
                    loop_running=False,
                    message="Trading loop is not currently running.",
                    timestamp=now_iso,
                )

            self._is_running = False
            if self._loop_task and not self._loop_task.done():
                self._loop_task.cancel()
                try:
                    await self._loop_task
                except asyncio.CancelledError:
                    pass

            logger.info("Automated trading loop STOPPED.")
            return TradingControlResponse(
                status="stopped",
                trading_enabled=self.settings.TRADING_ENABLED,
                emergency_stop_active=self.risk_service.is_emergency_stop_active,
                loop_running=False,
                message="Trading loop stopped successfully.",
                timestamp=now_iso,
            )

    async def emergency_stop(self) -> TradingControlResponse:
        """Activate emergency stop: immediately halt loop and block new entries."""
        self.risk_service.activate_emergency_stop("API / Operator Emergency Stop Request")
        await self.stop_loop()
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return TradingControlResponse(
            status="emergency_stopped",
            trading_enabled=self.settings.TRADING_ENABLED,
            emergency_stop_active=True,
            loop_running=False,
            message="EMERGENCY STOP ACTIVATED: Trading loop halted and all new orders are blocked.",
            timestamp=now_iso,
        )

    async def get_status(self) -> TradingStatusResponse:
        """Get current trading status and risk statistics."""
        positions = await self.execution_service.get_positions()
        return TradingStatusResponse(
            trading_enabled=self.settings.TRADING_ENABLED,
            emergency_stop_active=self.risk_service.is_emergency_stop_active,
            loop_running=self._is_running,
            symbol=self.settings.DEFAULT_TRADING_SYMBOL,
            loop_interval_seconds=self.settings.EXECUTION_LOOP_INTERVAL_SECONDS,
            open_positions_count=len(positions),
            daily_realized_loss=self.risk_service._daily_realized_loss,
            max_daily_loss=self.settings.MAX_DAILY_LOSS,
            max_position_size=self.settings.MAX_POSITION_SIZE,
            last_loop_run_time=self._last_run_time,
            last_signal=self._last_signal,
        )

    async def get_strategy_status(self) -> StrategyStatus:
        """Get strategy configuration and last evaluation state."""
        return StrategyStatus(
            symbol=self.settings.DEFAULT_TRADING_SYMBOL,
            fast_period=self.strategy.fast_period,
            slow_period=self.strategy.slow_period,
            rsi_period=self.strategy.rsi_period,
            rsi_overbought=self.strategy.rsi_overbought,
            rsi_oversold=self.strategy.rsi_oversold,
            last_signal=self._last_signal,
            last_evaluated_candle_time=self.strategy.last_evaluated_candle_time,
        )

    async def _run_loop(self) -> None:
        """Internal execution loop running periodically."""
        symbol = self.settings.DEFAULT_TRADING_SYMBOL
        interval = self.settings.EXECUTION_LOOP_INTERVAL_SECONDS

        while self._is_running:
            try:
                self._last_run_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
                logger.debug("Running trading loop iteration for %s...", symbol)

                # 1. Fetch fresh candles
                candles = await self.market_service.get_candles(
                    symbol=symbol,
                    resolution="1m",
                    limit=self.strategy.min_required_candles + 5,
                )

                # 2. Evaluate Strategy
                signal = self.strategy.evaluate(symbol=symbol, candles=candles)
                self._last_signal = signal

                # 3. Process execution if non-HOLD signal
                if signal.action != SignalAction.HOLD:
                    logger.info("Strategy generated %s signal for %s", signal.action.value, symbol)
                    order_result = await self.execution_service.execute_signal(signal)
                    if order_result:
                        logger.info("Order outcome: %s - %s", order_result.status.value, order_result.message)
                else:
                    logger.debug("Strategy returned HOLD for %s: %s", symbol, signal.reason)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.error("Exception in automated trading loop: %s", exc, exc_info=True)

            # Wait for next interval
            try:
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
