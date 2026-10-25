"""Health and diagnostics endpoints."""

import datetime
from fastapi import APIRouter, Depends, Request
from app.config import Settings, get_settings
from app.exchange.delta_client import DeltaClient
from app.schemas.trading import HealthResponse
from app.services.risk_service import RiskService

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def get_health(request: Request) -> HealthResponse:
    """System health check endpoint.

    Separates internal FastAPI application status from external Delta Exchange
    Testnet connectivity and reports round-trip latency.
    """
    settings: Settings = request.app.state.settings
    delta_client: DeltaClient = request.app.state.delta_client
    risk_service: RiskService = request.app.state.risk_service
    database = getattr(request.app.state, "database", None)

    # Ping exchange
    exchange_ok, latency_ms = await delta_client.ping_health()

    # Ping database (Firestore or SQLite)
    db_ok = False
    if database:
        try:
            db_ok = await database.ping_health()
        except Exception:
            db_ok = False

    return HealthResponse(
        status="ok",
        app_version=settings.VERSION,
        environment=f"Delta Exchange Testnet ({settings.DELTA_BASE_URL})",
        trading_enabled=settings.TRADING_ENABLED,
        emergency_stop_active=risk_service.is_emergency_stop_active,
        exchange_connectivity=exchange_ok,
        exchange_latency_ms=latency_ms if exchange_ok else None,
        database_backend=settings.DATABASE_BACKEND.lower(),
        database_connected=db_ok,
        masked_api_key=settings.masked_api_key(),
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )


@router.get("/health/live")
async def get_process_liveness(request: Request):
    """Lightweight process liveness probe.

    Does not trigger external exchange network calls.
    """
    settings: Settings = request.app.state.settings
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }
