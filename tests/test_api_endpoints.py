"""Tests for Trades, Risk, Analytics, Strategy Explain, and Conversation API endpoints."""

import httpx
import pytest
from app.database import Database


@pytest.mark.asyncio
async def test_trades_endpoints(app_client: httpx.AsyncClient, memory_db: Database):
    """Test GET /api/v1/trades and GET /api/v1/trades/{trade_id}."""
    # Seed trade
    await memory_db.record_trade(
        symbol="BTCUSDT",
        side="buy",
        size=0.1,
        price=50000.0,
        order_id="ORD-101",
        trade_id="TRD-101",
        realized_pnl=50.0,
    )

    # 1. List trades
    resp = await app_client.get("/api/v1/trades?limit=10")
    assert resp.status_code == 200
    trades = resp.json()
    assert len(trades) >= 1
    assert trades[0]["symbol"] == "BTCUSDT"

    # 2. Filter by symbol
    resp_filtered = await app_client.get("/api/v1/trades?symbol=BTCUSDT")
    assert resp_filtered.status_code == 200
    assert len(resp_filtered.json()) >= 1

    # 3. Get single trade
    resp_single = await app_client.get("/api/v1/trades/TRD-101")
    assert resp_single.status_code == 200
    data = resp_single.json()
    assert data["trade_id"] == "TRD-101"
    assert data["symbol"] == "BTCUSDT"
    assert data["realized_pnl"] == 50.0

    # 4. Get non-existent trade returns 404
    resp_404 = await app_client.get("/api/v1/trades/NON_EXISTENT_999")
    assert resp_404.status_code == 404


@pytest.mark.asyncio
async def test_risk_events_endpoints(app_client: httpx.AsyncClient, memory_db: Database):
    """Test GET /api/v1/risk/events and GET /api/v1/risk/events/{event_id}."""
    # Seed risk event
    event_id = await memory_db.record_risk_event(
        action="BUY",
        symbol="BTCUSDT",
        approved=False,
        reason="Daily loss limit exceeded",
        checks_passed=["trading_enabled"],
        checks_failed=["daily_loss_limit"],
        client_order_id="client-ord-99",
    )

    # 1. List risk events
    resp = await app_client.get("/api/v1/risk/events?limit=10")
    assert resp.status_code == 200
    events = resp.json()
    assert len(events) >= 1

    # 2. Filter by symbol
    resp_sym = await app_client.get("/api/v1/risk/events?symbol=BTCUSDT")
    assert resp_sym.status_code == 200
    assert len(resp_sym.json()) >= 1

    # 3. Get single risk event
    resp_single = await app_client.get(f"/api/v1/risk/events/{event_id}")
    assert resp_single.status_code == 200
    single_data = resp_single.json()
    assert single_data["approved"] is False
    assert "daily_loss_limit" in str(single_data)

    # 4. Non-existent returns 404
    resp_404 = await app_client.get("/api/v1/risk/events/999999")
    assert resp_404.status_code == 404


@pytest.mark.asyncio
async def test_strategy_explain_endpoint(app_client: httpx.AsyncClient):
    """Test GET /api/v1/strategy/{strategy_id}/explain."""
    resp = await app_client.get("/api/v1/strategy/EMA_RSI_Cross/explain")
    assert resp.status_code == 200
    data = resp.json()

    assert data["strategy_id"] == "EMA_RSI_Cross"
    assert "parameters" in data
    assert "indicators" in data
    assert "entry_rules" in data
    assert "risk_controls" in data
    assert data["entry_rules"]["BUY"]
    assert len(data["risk_controls"]) > 0


@pytest.mark.asyncio
async def test_analytics_summary_endpoint(app_client: httpx.AsyncClient, memory_db: Database):
    """Test GET /api/v1/analytics/summary."""
    # Seed orders and trades
    await memory_db.record_order(
        symbol="BTCUSDT",
        side="buy",
        order_type="market",
        size=0.1,
        price=50000.0,
        status="filled",
        client_order_id="ord-fill-1",
    )
    await memory_db.record_trade(
        symbol="BTCUSDT",
        side="sell",
        size=0.1,
        price=51000.0,
        order_id="ord-fill-1",
        trade_id="trd-1",
        realized_pnl=100.0,
    )

    resp = await app_client.get("/api/v1/analytics/summary")
    assert resp.status_code == 200
    data = resp.json()

    assert data["total_orders"] >= 1
    assert data["filled_orders"] >= 1
    assert data["total_trades"] >= 1
    assert data["total_realized_pnl_usd"] == 100.0
    assert data["profitable_trades"] == 1
    assert data["win_rate_percent"] == 100.0
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_ai_conversations_endpoint(app_client: httpx.AsyncClient):
    """Test GET /api/v1/ai/conversations/{conversation_id} with stored history."""
    # Enable AI on test instance
    app_client._transport.app.state.settings.AI_ENABLED = True
    try:
        chat_resp = await app_client.post(
            "/api/v1/ai/chat",
            json={
                "question": "How does the strategy work?",
                "session_id": "test-session-123",
            },
        )
        assert chat_resp.status_code == 200

        # Retrieve conversation history
        conv_resp = await app_client.get("/api/v1/ai/conversations/test-session-123")
        assert conv_resp.status_code == 200
        conv_data = conv_resp.json()
        assert conv_data["conversation_id"] == "test-session-123"
        assert conv_data["total_messages"] >= 2
        assert conv_data["messages"][0]["role"] == "user"
        assert conv_data["messages"][1]["role"] == "assistant"
    finally:
        app_client._transport.app.state.settings.AI_ENABLED = False

    # Non-existent conversation returns 404
    resp_404 = await app_client.get("/api/v1/ai/conversations/non-existent-session-xyz")
    assert resp_404.status_code == 404
