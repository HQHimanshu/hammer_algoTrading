"""Strategy and trading execution API endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.config import get_settings
from app.database import Database
from app.schemas.trading import (
    OrderResult,
    PlaceOrderRequest,
    Position,
    StrategyEvaluationRequest,
    StrategySignal,
    StrategyStatus,
    TradingControlResponse,
    TradingStatusResponse,
)
from app.services.execution_service import ExecutionService
from app.services.trading_engine import TradingEngine

router = APIRouter(tags=["Trading & Strategy"])


# Strategy Endpoints
@router.get("/strategy/status", response_model=StrategyStatus)
@router.get("/strategy/config", response_model=StrategyStatus)
async def get_strategy_status(request: Request) -> StrategyStatus:
    """Return strategy configuration parameters and execution state."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.get_strategy_status()


@router.post("/strategy/config")
async def update_strategy_config(config_data: Dict[str, Any], request: Request) -> Dict[str, Any]:
    """Update strategy parameters in runtime."""
    engine: TradingEngine = request.app.state.trading_engine
    settings = request.app.state.settings
    if "symbol" in config_data:
        settings.DEFAULT_TRADING_SYMBOL = str(config_data["symbol"]).upper()
    if "fast_period" in config_data:
        settings.STRATEGY_FAST_PERIOD = int(config_data["fast_period"])
    if "slow_period" in config_data:
        settings.STRATEGY_SLOW_PERIOD = int(config_data["slow_period"])
    if "rsi_period" in config_data:
        settings.STRATEGY_RSI_PERIOD = int(config_data["rsi_period"])
    if "rsi_overbought" in config_data:
        settings.STRATEGY_RSI_OVERBOUGHT = float(config_data["rsi_overbought"])
    if "rsi_oversold" in config_data:
        settings.STRATEGY_RSI_OVERSOLD = float(config_data["rsi_oversold"])
    return {"status": "updated", "config": await engine.get_strategy_status()}


@router.get("/strategy/signals")
async def get_strategy_signals(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """Return history of evaluated signals from SQLite."""
    database: Database = request.app.state.database
    return await database.get_recent_signals(limit=limit)


@router.get("/strategies")
async def list_strategies(request: Request) -> List[Dict[str, Any]]:
    """Return catalog of available quantitative strategies in Project Hammer."""
    engine: TradingEngine = request.app.state.trading_engine
    status = await engine.get_strategy_status()
    return [
        {
            "id": "strategy_1",
            "name": "Strategy 1 - Golden Cross + RSI Confirmation",
            "status": "active",
            "symbol": status.symbol,
            "fast_period": status.fast_period,
            "slow_period": status.slow_period,
            "rsi_period": status.rsi_period,
            "rsi_overbought": status.rsi_overbought,
            "rsi_oversold": status.rsi_oversold,
            "description": "Dual Moving Average Crossover (SMA) with RSI overbought/oversold confirmation filter.",
        },
        {
            "id": "strategy_heikin_ashi",
            "name": "Strategy 1 (Variant) - Heikin-Ashi Pullback Breakout",
            "status": "active",
            "symbol": status.symbol,
            "trend_bars": 3,
            "expiry_bars": 5,
            "stop_pct": 0.3,
            "target_pct": 1.5,
            "description": "Multi-bar directional trend identification using Heikin-Ashi candles, opposite-color pullback setup arming, and breakout confirmation on real closes.",
        },
    ]


@router.post("/strategy/evaluate", response_model=StrategySignal)
@router.post("/strategy/signal", response_model=StrategySignal)
async def evaluate_strategy(
    evaluation_req: StrategyEvaluationRequest,
    request: Request,
) -> StrategySignal:
    """Evaluate strategy using validated candles without placing an order.

    Useful for dry-runs, backtesting checks, and UI signal preview.
    """
    engine: TradingEngine = request.app.state.trading_engine
    try:
        return await engine.evaluate_strategy_dry_run(evaluation_req)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Strategy evaluation failed: {str(exc)}")


# Trading Control Endpoints
@router.post("/trading/start", response_model=TradingControlResponse)
async def start_trading(request: Request) -> TradingControlResponse:
    """Start the automated strategy background execution loop."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.start_loop()


@router.post("/trading/stop", response_model=TradingControlResponse)
async def stop_trading(request: Request) -> TradingControlResponse:
    """Stop the automated strategy background loop cleanly."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.stop_loop()


@router.post("/trading/emergency-stop", response_model=TradingControlResponse)
async def emergency_stop(request: Request) -> TradingControlResponse:
    """Activate emergency stop: immediately halt trading loop and reject all new orders."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.emergency_stop()


@router.post("/trading/enable")
async def enable_trading(request: Request) -> Dict[str, Any]:
    """Explicitly enable automated demo trading in runtime."""
    settings = getattr(request.app.state, "settings", None) or get_settings()
    settings.TRADING_ENABLED = True
    return {
        "status": "enabled",
        "trading_enabled": True,
        "message": "Automated demo trading execution has been explicitly enabled.",
    }


@router.post("/trading/disable")
async def disable_trading(request: Request) -> Dict[str, Any]:
    """Disable automated trading execution."""
    settings = getattr(request.app.state, "settings", None) or get_settings()
    settings.TRADING_ENABLED = False
    engine: Optional[TradingEngine] = getattr(request.app.state, "trading_engine", None)
    if engine and engine.is_running:
        await engine.stop_loop()
    return {
        "status": "disabled",
        "trading_enabled": False,
        "message": "Automated trading execution has been disabled.",
    }


@router.get("/trading/history")
async def get_trading_history(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> Dict[str, Any]:
    """Return consolidated trading history (orders, trades, risk events)."""
    database: Optional[Database] = getattr(request.app.state, "database", None)
    orders = await database.get_recent_orders(limit=limit) if database else []
    trades = await database.get_recent_trades(limit=limit) if database else []
    return {
        "orders": orders,
        "trades": trades,
        "total_orders": len(orders),
        "total_trades": len(trades),
    }


@router.get("/trading/status", response_model=TradingStatusResponse)
async def get_trading_status(request: Request) -> TradingStatusResponse:
    """Return current trading status, risk limits, and engine statistics."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.get_status()


# Positions & Orders
@router.get("/trading/positions", response_model=List[Position])
async def get_positions(request: Request) -> List[Position]:
    """Return reconciled margined positions from Delta Exchange Testnet."""
    execution: ExecutionService = request.app.state.execution_service
    return await execution.get_positions()


@router.get("/trading/balances")
@router.get("/trading/wallet")
async def get_wallet_balances(request: Request) -> Dict[str, Any]:
    """Fetch real-time authenticated wallet balances from Delta Exchange Testnet."""
    delta_client = getattr(request.app.state, "delta_client", None)
    if not delta_client:
        raise HTTPException(status_code=503, detail="Delta client not initialized")
    try:
        raw_balances = await delta_client.get_balances()
        return {
            "success": True,
            "environment": "delta_demo",
            "balances": raw_balances,
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch exchange balances: {str(exc)}")


@router.get("/trading/orders")
async def get_orders(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """Return persisted order history from SQLite."""
    database: Database = request.app.state.database
    return await database.get_recent_orders(limit=limit)


@router.post("/trading/orders", response_model=OrderResult)
async def place_order(
    order_req: PlaceOrderRequest,
    request: Request,
) -> OrderResult:
    """Submit an order to Delta Testnet with mandatory pre-trade risk evaluation."""
    execution: ExecutionService = request.app.state.execution_service
    return await execution.execute_order(
        symbol=order_req.symbol,
        side=order_req.side,
        order_type=order_req.order_type,
        size=order_req.size,
        price=order_req.price,
    )


@router.get("/trading/trades")
async def get_trades(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """Return persisted execution and fill history from SQLite."""
    database: Database = request.app.state.database
    return await database.get_recent_trades(limit=limit)


@router.get("/trading/signals")
async def get_signals(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """Return history of evaluated signals and explanations from SQLite."""
    database: Database = request.app.state.database
    return await database.get_recent_signals(limit=limit)


@router.get("/trading/risk-events")
async def get_risk_events(
    request: Request,
    limit: int = Query(default=50, ge=1, le=100),
) -> List[Dict[str, Any]]:
    """Return audit log of pre-trade risk checks and rejection reasons."""
    database: Database = request.app.state.database
    return await database.get_recent_risk_events(limit=limit)


@router.get("/strategy/{strategy_id}/explain")
async def explain_strategy(
    strategy_id: str,
    request: Request,
) -> Dict[str, Any]:
    """Return comprehensive mathematical rules, parameters, indicators, and risk constraints for a strategy."""
    engine: TradingEngine = request.app.state.trading_engine
    status = await engine.get_strategy_status()

    if strategy_id in ["strategy_1", "heikin_ashi", "strategy_heikin_ashi"]:
        return {
            "strategy_id": "strategy_1",
            "name": "Strategy 1 - Heikin-Ashi Pullback Breakout",
            "version": "1.0.0",
            "description": "Multi-bar directional trend identification using Heikin-Ashi candles, opposite-color pullback setup arming, and breakout confirmation on real closes.",
            "parameters": {
                "symbol": status.symbol,
                "timeframe": "1m",
                "trend_bars": 3,
                "expiry_bars": 5,
                "stop_pct": 0.3,
                "target_pct": 1.5,
                "order_size": getattr(request.app.state.settings, "ORDER_SIZE", 1.0),
            },
            "indicators": [
                {
                    "name": "Heikin-Ashi Candlesticks",
                    "period": 3,
                    "role": "Filters noise: ha_close = (O+H+L+C)/4; ha_open = (prev_ha_open + prev_ha_close)/2.",
                },
                {
                    "name": "Pullback Level Trigger",
                    "period": 5,
                    "role": "Arms long setup at previous high when opposite bearish HA appears during bull trend, or short at low.",
                },
            ],
            "entry_rules": {
                "BUY": "Triggered when 3 consecutive bullish HA bars occur, a bearish HA bar arms the high level, and subsequent real candle closes above that level within 5 bars.",
                "SELL": "Triggered when 3 consecutive bearish HA bars occur, a bullish HA bar arms the low level, and subsequent real candle closes below that level within 5 bars.",
                "HOLD": "No setup armed, setup expired after 5 bars, or breakout condition not yet satisfied.",
            },
            "risk_controls": [
                "Stop loss placed at entry * (1 - 0.3%) for long, or entry * (1 + 0.3%) for short",
                "Take profit placed at entry * (1 + 1.5%) for long, or entry * (1 - 1.5%) for short",
                "Pre-trade max position size limit",
                "Trading enabled check",
                "Daily loss circuit breaker",
            ],
        }

    return {
        "strategy_id": strategy_id,
        "name": "Dual Moving Average Crossover with RSI Filter",
        "version": "1.0.0",
        "description": "Dual Exponential Moving Average crossover strategy with optional Relative Strength Index (RSI) momentum filter.",
        "parameters": {
            "symbol": status.symbol,
            "timeframe": "1m",
            "fast_period": status.fast_period,
            "slow_period": status.slow_period,
            "rsi_period": status.rsi_period,
            "rsi_overbought": status.rsi_overbought,
            "rsi_oversold": status.rsi_oversold,
            "order_size": getattr(request.app.state.settings, "ORDER_SIZE", 1.0),
        },
        "indicators": [
            {
                "name": "Fast EMA",
                "period": status.fast_period,
                "role": "Tracks short-term price momentum.",
            },
            {
                "name": "Slow EMA",
                "period": status.slow_period,
                "role": "Tracks medium-term price baseline trend.",
            },
            {
                "name": "RSI",
                "period": status.rsi_period,
                "role": "Momentum oscillator bounded [0, 100]. Prevents entering long when overbought or short when oversold.",
            },
        ],
        "entry_rules": {
            "BUY": (
                f"Triggered when Fast EMA crosses strictly above Slow EMA on a completed candle, "
                f"provided RSI < {status.rsi_overbought}."
            ),
            "SELL": (
                f"Triggered when Fast EMA crosses strictly below Slow EMA on a completed candle, "
                f"provided RSI > {status.rsi_oversold}."
            ),
            "HOLD": "No crossover detected or momentum filter actively suppresses signal.",
        },
        "risk_controls": [
            "Trading enabled flag check",
            "Emergency stop flag check",
            "Delta Exchange Testnet connectivity check",
            "Market data freshness threshold",
            "Max position size limit",
            "Max open orders limit",
            "Daily loss circuit breaker",
            "Duplicate client order ID prevention",
        ],
    }
