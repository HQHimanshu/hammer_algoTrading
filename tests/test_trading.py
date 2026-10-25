"""API tests for trading, market data, and strategy endpoints."""

import pytest
import httpx
from app.schemas.trading import OrderSide, OrderType


@pytest.mark.asyncio
async def test_market_instruments_and_ticker(app_client: httpx.AsyncClient):
    """Verify market data endpoints."""
    # Instruments
    resp = await app_client.get("/api/v1/market/instruments")
    assert resp.status_code == 200
    instruments = resp.json()
    assert len(instruments) >= 1
    assert any(inst["symbol"] == "BTCUSDT" for inst in instruments)

    # Ticker
    t_resp = await app_client.get("/api/v1/market/ticker/BTCUSDT")
    assert t_resp.status_code == 200
    ticker = t_resp.json()
    assert ticker["symbol"] == "BTCUSDT"
    assert ticker["mark_price"] == 80000.0


@pytest.mark.asyncio
async def test_strategy_endpoints(app_client: httpx.AsyncClient):
    """Verify strategy status and dry-run evaluation endpoints."""
    # Status
    s_resp = await app_client.get("/api/v1/strategy/status")
    assert s_resp.status_code == 200
    status = s_resp.json()
    assert status["symbol"] == "BTCUSDT"
    assert status["fast_period"] == 3
    assert status["slow_period"] == 6

    # Dry-run evaluation with custom candles (Golden Cross confirmed by RSI < 70.0)
    candles = [
        {"time": 1000 + i * 60, "open": p, "high": p + 1, "low": p - 1, "close": p, "volume": 10}
        for i, p in enumerate([100.0, 99.0, 98.0, 97.0, 98.0, 97.5, 99.5])
    ]
    eval_resp = await app_client.post(
        "/api/v1/strategy/evaluate",
        json={"symbol": "BTCUSDT", "candles": candles},
    )
    assert eval_resp.status_code == 200
    signal = eval_resp.json()
    assert signal["action"] == "BUY"
    assert "Golden Cross" in signal["reason"]


@pytest.mark.asyncio
async def test_trading_lifecycle_controls(app_client: httpx.AsyncClient):
    """Test start, status, stop, and emergency stop."""
    # Start loop
    start_resp = await app_client.post("/api/v1/trading/start")
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "started"
    assert start_resp.json()["loop_running"] is True

    # Check status
    status_resp = await app_client.get("/api/v1/trading/status")
    assert status_resp.status_code == 200
    assert status_resp.json()["loop_running"] is True

    # Stop loop
    stop_resp = await app_client.post("/api/v1/trading/stop")
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"
    assert stop_resp.json()["loop_running"] is False

    # Emergency stop
    em_resp = await app_client.post("/api/v1/trading/emergency-stop")
    assert em_resp.status_code == 200
    assert em_resp.json()["emergency_stop_active"] is True


@pytest.mark.asyncio
async def test_order_placement_rejected_when_trading_disabled(app_client: httpx.AsyncClient):
    """Order placement must be evaluated by risk controls and rejected when TRADING_ENABLED=False."""
    order_payload = {
        "symbol": "BTCUSDT",
        "side": OrderSide.BUY.value,
        "order_type": OrderType.MARKET.value,
        "size": 1.0,
    }
    resp = await app_client.post("/api/v1/trading/orders", json=order_payload)
    assert resp.status_code == 200
    result = resp.json()

    assert result["status"] == "rejected"
    assert "TRADING_ENABLED=False" in result["message"]

    # Check audit endpoints
    orders_resp = await app_client.get("/api/v1/trading/orders")
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    assert len(orders) >= 1
    assert orders[0]["status"] == "rejected"

    risk_resp = await app_client.get("/api/v1/trading/risk-events")
    assert risk_resp.status_code == 200
    events = risk_resp.json()
    assert len(events) >= 1
    assert events[0]["approved"] == 0
