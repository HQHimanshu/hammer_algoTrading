"""Trading schemas and data validation models."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SignalAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    LONG = "LONG"
    SHORT = "SHORT"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


class OrderType(str, Enum):
    MARKET = "market"
    LIMIT = "limit"


class OrderStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    FILLED = "filled"
    PARTIALLY_FILLED = "partially_filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


# Health
class HealthResponse(BaseModel):
    status: str = Field(description="Application status, e.g. 'ok'")
    app_version: str
    environment: str = Field(description="Configured exchange environment, e.g. 'Delta Exchange Testnet'")
    trading_enabled: bool
    emergency_stop_active: bool
    exchange_connectivity: bool
    exchange_latency_ms: Optional[float] = None
    database_backend: str = Field(default="sqlite", description="Database backend in use ('firestore' or 'sqlite')")
    database_connected: bool = Field(default=True, description="Database connectivity status")
    masked_api_key: str
    timestamp: str


# Market Data
class Candle(BaseModel):
    time: int
    open: float
    high: float
    low: float
    close: float
    volume: float = 0.0


class Instrument(BaseModel):
    id: int
    symbol: str
    contract_type: str
    tick_size: Optional[str] = None
    contract_value: Optional[str] = None
    state: Optional[str] = None


class Ticker(BaseModel):
    symbol: str
    product_id: Optional[int] = None
    mark_price: Optional[float] = None
    spot_price: Optional[float] = None
    best_bid: Optional[float] = None
    best_ask: Optional[float] = None
    bid_size: Optional[float] = None
    ask_size: Optional[float] = None
    timestamp: Optional[int] = None


# Strategy
class StrategyEvaluationRequest(BaseModel):
    symbol: str = "BTCUSDT"
    candles: Optional[List[Candle]] = Field(
        default=None,
        description="Optional list of completed candles. If omitted, fetched live from Delta Testnet.",
    )


class StrategySignal(BaseModel):
    symbol: str
    action: SignalAction
    price: float
    fast_ma: Optional[float] = None
    slow_ma: Optional[float] = None
    rsi: Optional[float] = None
    reason: str
    timestamp: str
    strategy_name: str = Field(default="Strategy 1 - Golden Cross + RSI Confirmation", description="Identifier of the executing strategy")
    timeframe: str = Field(default="1m", description="Candle interval timeframe")
    crossover: str = Field(default="NONE", description="Detected crossover event: 'GOLDEN_CROSS', 'DEATH_CROSS', or 'NONE'")
    rsi_confirmed: Optional[bool] = Field(default=None, description="Whether RSI confirmed the crossover")
    risk_eligible: Optional[bool] = Field(default=None, description="Whether risk management permits order entry")
    data_fresh: bool = Field(default=True, description="Whether candle market data satisfies freshness constraints")
    execution_eligible: Optional[bool] = Field(default=None, description="Whether the signal is approved for automated execution")


class StrategyStatus(BaseModel):
    symbol: str
    fast_period: int
    slow_period: int
    rsi_period: int
    rsi_overbought: float
    rsi_oversold: float
    last_signal: Optional[StrategySignal] = None
    last_evaluated_candle_time: Optional[int] = None


# Risk
class RiskCheckRequest(BaseModel):
    symbol: str
    side: OrderSide
    size: float
    price: Optional[float] = None


class RiskDecision(BaseModel):
    approved: bool
    reason: str
    checks_passed: List[str] = Field(default_factory=list)
    checks_failed: List[str] = Field(default_factory=list)
    timestamp: str


# Orders & Execution
class PlaceOrderRequest(BaseModel):
    symbol: str
    side: OrderSide
    order_type: OrderType = OrderType.MARKET
    size: float = Field(gt=0, description="Order quantity in units/contracts")
    price: Optional[float] = Field(default=None, description="Price required for limit orders")


class OrderResult(BaseModel):
    order_id: Optional[str] = None
    client_order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    size: float
    price: Optional[float] = None
    status: OrderStatus
    message: str
    exchange_response: Optional[Dict[str, Any]] = None
    timestamp: str


class Position(BaseModel):
    product_id: int
    symbol: str
    size: float
    entry_price: Optional[float] = None
    mark_price: Optional[float] = None
    unrealized_pnl: Optional[float] = None
    liquidation_price: Optional[float] = None


# Trading Control
class TradingControlResponse(BaseModel):
    status: str
    trading_enabled: bool
    emergency_stop_active: bool
    loop_running: bool
    message: str
    timestamp: str


class TradingStatusResponse(BaseModel):
    trading_enabled: bool
    emergency_stop_active: bool
    loop_running: bool
    symbol: str
    loop_interval_seconds: int
    open_positions_count: int
    daily_realized_loss: float
    max_daily_loss: float
    max_position_size: float
    last_loop_run_time: Optional[str] = None
    last_signal: Optional[StrategySignal] = None


# Trading Event Ledger Schemas
class StrategyEvent(BaseModel):
    signal_id: str
    symbol: str
    timestamp: str
    strategy_name: str = "MovingAverageRsiStrategy"
    strategy_version: str = "1.0.0"
    price: float
    fast_ma: Optional[float] = None
    slow_ma: Optional[float] = None
    rsi: Optional[float] = None
    action: SignalAction
    reason: str
    parameters: Dict[str, Any] = Field(default_factory=dict)


class RiskEventRecord(BaseModel):
    event_id: str
    signal_id: Optional[str] = None
    client_order_id: Optional[str] = None
    symbol: str
    action: str
    rules_evaluated: List[str] = Field(default_factory=list)
    checks_passed: List[str] = Field(default_factory=list)
    checks_failed: List[str] = Field(default_factory=list)
    approved: bool
    reason: str
    timestamp: str


class OrderEventRecord(BaseModel):
    order_id: str
    client_order_id: str
    signal_id: Optional[str] = None
    risk_event_id: Optional[str] = None
    symbol: str
    side: OrderSide
    order_type: OrderType
    size: float
    price: Optional[float] = None
    status: OrderStatus
    exchange_order_id: Optional[str] = None
    timestamp: str


class ExecutionFillEvent(BaseModel):
    fill_id: str
    order_id: str
    exchange_order_id: Optional[str] = None
    symbol: str
    side: OrderSide
    price: float
    size: float
    fee: float = 0.0
    timestamp: str


class TradeLifecycleEvent(BaseModel):
    trade_id: str
    order_id: Optional[str] = None
    symbol: str
    side: str
    size: float
    price: float
    realized_pnl: Optional[float] = None
    exit_reason: Optional[str] = None
    timestamp: str


# Analytics Summary Schema
class AnalyticsSummaryResponse(BaseModel):
    total_signals: int = 0
    total_orders: int = 0
    filled_orders: int = 0
    rejected_orders: int = 0
    cancelled_orders: int = 0
    open_orders: int = 0
    total_trades: int = 0
    closed_trades_with_pnl: int = 0
    total_realized_pnl_usd: float = 0.0
    profitable_trades: int = 0
    losing_trades: int = 0
    win_rate_percent: Optional[float] = None
    exit_reason_distribution: Dict[str, int] = Field(default_factory=dict)
    risk_rule_rejection_counts: Dict[str, int] = Field(default_factory=dict)
    data_scope: str
    timestamp: str
