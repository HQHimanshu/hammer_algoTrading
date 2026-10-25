"""API tests for /health endpoint."""

import pytest
import httpx


@pytest.mark.asyncio
async def test_health_endpoint_healthy(app_client: httpx.AsyncClient):
    """Health check must return 200, app status, and verified exchange connectivity."""
    response = await app_client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "Delta Exchange Testnet" in data["environment"]
    assert data["trading_enabled"] is False  # Safe default
    assert data["emergency_stop_active"] is False
    assert data["exchange_connectivity"] is True
    assert data["exchange_latency_ms"] is not None
    assert data["database_backend"] in ["sqlite", "firestore"]
    assert data["database_connected"] is True
    assert "..." in data["masked_api_key"] or data["masked_api_key"] == "***"


@pytest.mark.asyncio
async def test_health_endpoint_decoupled_exchange_failure(app_client: httpx.AsyncClient):
    """When the exchange is unreachable, the app should remain healthy with exchange_connectivity=False."""
    # Force mock client to report ping failure
    app_client._transport.app.state.delta_client.ping_healthy = False

    response = await app_client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["exchange_connectivity"] is False
    assert data["exchange_latency_ms"] is None


@pytest.mark.asyncio
async def test_health_live_endpoint(app_client: httpx.AsyncClient):
    """Liveness probe must return 200 without making exchange network calls."""
    response = await app_client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "timestamp" in data
