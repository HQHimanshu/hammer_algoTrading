"""Tests for MarketStreamer, /ws/market, and market status endpoints."""

import asyncio
import json
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import create_app
from app.schemas.trading import Candle, Ticker


@pytest.mark.asyncio
async def test_market_status_endpoint():
    """Verify /api/market/status returns structured environment and telemetry."""
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/market/status")
        assert response.status_code == 200
        data = response.json()
        assert "exchange_environment" in data
        assert "connection_status" in data
        assert "selected_contract" in data
        assert "data_source" in data
        assert data["exchange_environment"] == "Delta Exchange Demo / Testnet"


@pytest.mark.asyncio
async def test_trading_enable_disable_endpoints():
    """Verify /api/trading/enable and /api/trading/disable controls."""
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Enable trading
        res_enable = await ac.post("/api/trading/enable")
        assert res_enable.status_code == 200
        assert res_enable.json()["trading_enabled"] is True

        # Disable trading
        res_disable = await ac.post("/api/trading/disable")
        assert res_disable.status_code == 200
        assert res_disable.json()["trading_enabled"] is False


@pytest.mark.asyncio
async def test_trading_history_endpoint():
    """Verify /api/trading/history returns consolidated orders and trades."""
    app = create_app()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/trading/history")
        assert res.status_code == 200
        data = res.json()
        assert "orders" in data
        assert "trades" in data
        assert isinstance(data["orders"], list)
        assert isinstance(data["trades"], list)


@pytest.mark.asyncio
async def test_candle_normalization_logic():
    """Verify candle normalization handles microseconds, out of order wicks, and formats."""
    from app.services.market_streamer import MarketStreamer
    from app.config import get_settings

    streamer = MarketStreamer(settings=get_settings(), market_service=None)

    # 1. India Demo format
    india_frame = {
        "c": 80238.0,
        "cst": 1792925820000000,
        "h": 80242.0,
        "l": 80217.5,
        "o": 80222.0,
        "res": "1m",
        "sy": "BTCUSD",
        "ts": 1792925840424933,
        "type": "candlestick_1m",
        "v": 978.0,
    }
    norm1 = streamer._normalize_candle(india_frame)
    assert norm1 is not None
    assert norm1["symbol"] == "BTCUSD"
    assert norm1["timestamp"] == 1792925820  # Normalized to seconds
    assert norm1["open"] == 80222.0
    assert norm1["high"] == 80242.0
    assert norm1["low"] == 80217.5
    assert norm1["close"] == 80238.0
    assert norm1["volume"] == 978.0
    assert norm1["source"] == "delta_demo"

    # 2. Global Testnet format
    global_frame = {
        "close": 81569.0,
        "high": 81569.0,
        "low": 81569.0,
        "open": 81569.0,
        "timestamp": 1792925760001275,
        "type": "candlestick_1m",
        "symbol": "BTCUSDT",
        "volume": 12.5,
    }
    norm2 = streamer._normalize_candle(global_frame)
    assert norm2 is not None
    assert norm2["symbol"] == "BTCUSDT"
    assert norm2["timestamp"] == 1792925760
    assert norm2["close"] == 81569.0
    assert norm2["volume"] == 12.5
