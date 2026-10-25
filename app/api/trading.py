"""Strategy and trading execution API endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
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

router = APIRouter(prefix="/api/v1", tags=["Trading & Strategy"])


# Strategy Endpoints
@router.get("/strategy/status", response_model=StrategyStatus)
@router.get("/strategy/config", response_model=StrategyStatus)
async def get_strategy_status(request: Request) -> StrategyStatus:
    """Return strategy configuration parameters and execution state."""
    engine: TradingEngine = request.app.state.trading_engine
    return await engine.get_strategy_status()


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
        }
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
