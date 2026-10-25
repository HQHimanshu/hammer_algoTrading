"""Unit tests for pre-trade RiskService."""

import pytest
from app.config import Settings
from app.schemas.trading import OrderSide
from app.services.risk_service import RiskService


@pytest.fixture
def enabled_settings() -> Settings:
    return Settings(
        DELTA_API_KEY="test_key",
        DELTA_API_SECRET="test_secret",
        DELTA_BASE_URL="https://testnet-api.delta.exchange",
        TRADING_ENABLED=True,
        MAX_POSITION_SIZE=2.0,
        MAX_DAILY_LOSS=100.0,
        MAX_OPEN_POSITIONS=2,
    )


@pytest.mark.asyncio
async def test_risk_rejected_when_trading_disabled():
    """Trades must be rejected when TRADING_ENABLED is False."""
    settings = Settings(
        DELTA_API_KEY="test_key",
        DELTA_API_SECRET="test_secret",
        DELTA_BASE_URL="https://testnet-api.delta.exchange",
        TRADING_ENABLED=False,
    )
    risk_service = RiskService(settings=settings)

    decision = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)
    assert not decision.approved
    assert "TRADING_ENABLED=False" in decision.reason


@pytest.mark.asyncio
async def test_risk_emergency_stop_lifecycle(enabled_settings: Settings):
    """Emergency stop immediately rejects trades until deactivated."""
    risk_service = RiskService(settings=enabled_settings)

    # Normal evaluate -> Approved
    d1 = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)
    assert d1.approved

    # Activate emergency stop
    risk_service.activate_emergency_stop("Safety test")
    assert risk_service.is_emergency_stop_active

    d2 = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)
    assert not d2.approved
    assert "Emergency stop is currently active" in d2.reason

    # Deactivate
    risk_service.deactivate_emergency_stop()
    assert not risk_service.is_emergency_stop_active

    d3 = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)
    assert d3.approved


@pytest.mark.asyncio
async def test_risk_order_size_limits(enabled_settings: Settings):
    """Orders with non-positive size or exceeding MAX_POSITION_SIZE must be rejected."""
    risk_service = RiskService(settings=enabled_settings)

    # Size <= 0
    d_zero = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 0.0)
    assert not d_zero.approved
    assert "greater than zero" in d_zero.reason

    # Size > MAX_POSITION_SIZE (2.0)
    d_over = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 5.0)
    assert not d_over.approved
    assert "exceeds max position size limit" in d_over.reason


@pytest.mark.asyncio
async def test_risk_cumulative_position_limit(enabled_settings: Settings):
    """Adding to an existing position must not breach MAX_POSITION_SIZE."""
    risk_service = RiskService(settings=enabled_settings)

    # Current position is 1.5, proposed buy is 1.0 -> total 2.5 > max 2.0
    decision = await risk_service.evaluate_trade(
        symbol="BTCUSDT",
        side=OrderSide.BUY,
        size=1.0,
        current_position_size=1.5,
        open_positions_count=1,
    )
    assert not decision.approved
    assert "Cumulative position size" in decision.reason


@pytest.mark.asyncio
async def test_risk_max_open_positions_limit(enabled_settings: Settings):
    """Opening a new position when max concurrent positions are already reached must fail."""
    risk_service = RiskService(settings=enabled_settings)

    # Limit is 2; current open positions = 2, opening new position (current_position_size=0)
    decision = await risk_service.evaluate_trade(
        symbol="SOLUSDT",
        side=OrderSide.BUY,
        size=1.0,
        current_position_size=0.0,
        open_positions_count=2,
    )
    assert not decision.approved
    assert "Maximum simultaneous open positions reached" in decision.reason


@pytest.mark.asyncio
async def test_risk_daily_loss_limit(enabled_settings: Settings):
    """When daily loss reaches or exceeds MAX_DAILY_LOSS, all new orders must be blocked."""
    risk_service = RiskService(settings=enabled_settings)

    risk_service.record_loss(120.0)  # Exceeds max daily loss (100.0)
    decision = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)

    assert not decision.approved
    assert "Maximum daily loss limit reached" in decision.reason


@pytest.mark.asyncio
async def test_risk_order_cooldown(enabled_settings: Settings):
    """Submitting multiple orders on the same symbol in rapid succession must trigger cooldown."""
    risk_service = RiskService(settings=enabled_settings)

    risk_service.record_order_placed("BTCUSDT")

    decision = await risk_service.evaluate_trade("BTCUSDT", OrderSide.BUY, 1.0)
    assert not decision.approved
    assert "Cooldown active" in decision.reason
