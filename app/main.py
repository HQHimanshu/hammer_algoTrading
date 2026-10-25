"""AlgoPilot FastAPI Main Application Entrypoint.

Coordinates application lifecycle, dependency initialization,
structured logging, database migrations, and clean shutdowns.
"""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from app.api.health import router as health_router
from app.api.market import router as market_router
from app.api.trading import router as trading_router
from app.api.ai import router as ai_router
from app.api.trades import router as trades_router
from app.api.risk import router as risk_router
from app.api.analytics import router as analytics_router
from app.config import Settings, get_settings
from app.database import Database
from app.exchange.delta_client import DeltaClient
from app.firebase_config import init_firestore
from app.repositories import FirestoreRepository
from app.services.ai import TradeMindCopilot
from app.services.event_service import EventService
from app.services.execution_service import ExecutionService
from app.services.market_service import MarketService
from app.services.market_streamer import MarketStreamer
from app.services.risk_service import RiskService
from app.services.trading_engine import TradingEngine
from app.api.websocket import router as websocket_router


def configure_logging(level_name: str = "INFO") -> None:
    """Configure structured console logging."""
    numeric_level = getattr(logging, level_name.upper(), logging.INFO)
    logging.basicConfig(
        level=numeric_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for dependency startup and clean shutdown."""
    settings = get_settings()
    configure_logging(settings.LOG_LEVEL)
    logger = logging.getLogger("algopilot.main")

    logger.info("Starting %s v%s...", settings.PROJECT_NAME, settings.VERSION)
    logger.info("Target Exchange: Delta Exchange Testnet (%s)", settings.DELTA_BASE_URL)
    logger.info("Trading Enabled Switch: %s", settings.TRADING_ENABLED)
    logger.info("Configured API Key: %s", settings.masked_api_key())
    logger.info("Configured Persistence Backend: %s", settings.DATABASE_BACKEND)

    # 1. Initialize Persistence (Cloud Firestore or SQLite)
    backend = settings.DATABASE_BACKEND.lower()
    if backend == "firestore":
        logger.info(
            "Connecting to Firebase Cloud Firestore for project: %s",
            settings.FIREBASE_PROJECT_ID,
        )
        firestore_client = init_firestore(
            project_id=settings.FIREBASE_PROJECT_ID,
            service_account_path=settings.FIREBASE_SERVICE_ACCOUNT_PATH,
        )
        database = FirestoreRepository(firestore_client=firestore_client)
        await database.init_db()
    elif backend == "sqlite":
        logger.info("Initializing SQLite persistence at: %s", settings.DATABASE_PATH)
        database = Database(db_path=settings.DATABASE_PATH)
        await database.init_db()
    else:
        raise ValueError(f"CRITICAL: Unsupported DATABASE_BACKEND '{settings.DATABASE_BACKEND}'. Must be 'sqlite' or 'firestore'.")

    # 2. Initialize Delta Exchange Client
    delta_client = DeltaClient(
        base_url=settings.DELTA_BASE_URL,
        api_key=settings.DELTA_API_KEY,
        api_secret=settings.DELTA_API_SECRET,
        timeout=settings.REQUEST_TIMEOUT_SECONDS,
    )

    # 3. Initialize Services
    market_service = MarketService(delta_client=delta_client)
    market_streamer = MarketStreamer(settings=settings, market_service=market_service)
    await market_streamer.start()

    risk_service = RiskService(settings=settings, delta_client=delta_client)
    execution_service = ExecutionService(
        settings=settings,
        delta_client=delta_client,
        market_service=market_service,
        risk_service=risk_service,
        database=database,
    )
    trading_engine = TradingEngine(
        settings=settings,
        market_service=market_service,
        risk_service=risk_service,
        execution_service=execution_service,
        database=database,
    )
    copilot_service = TradeMindCopilot(
        settings=settings,
        db=database,
    )
    event_service = EventService(
        storage=database,
    )

    # Attach instances to application state for dependency injection in routes
    app.state.settings = settings
    app.state.database = database
    app.state.delta_client = delta_client
    app.state.market_service = market_service
    app.state.market_streamer = market_streamer
    app.state.risk_service = risk_service
    app.state.execution_service = execution_service
    app.state.trading_engine = trading_engine
    app.state.copilot_service = copilot_service
    app.state.event_service = event_service

    logger.info("%s backend successfully initialized and ready.", settings.PROJECT_NAME)

    yield

    # Clean Shutdown
    logger.info("Shutting down %s...", settings.PROJECT_NAME)
    if trading_engine.is_running:
        logger.info("Stopping active background trading loop...")
        await trading_engine.stop_loop()

    await market_streamer.stop()
    await delta_client.close()
    logger.info("Delta Exchange client and market streamer closed. Shutdown complete.")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()
    app = FastAPI(
        title=f"{settings.PROJECT_NAME} API",
        version=settings.VERSION,
        description="Algorithmic Trading Backend for Delta Exchange Testnet",
        lifespan=lifespan,
    )

    # Enable CORS for future React / Next.js dashboards
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global Exception Handler (Never leak stack traces or secret credentials to clients)
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logging.getLogger("algopilot.exception").error(
            "Unhandled exception on %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": "An unexpected error occurred. Check system logs for details.",
            },
        )

    # Mount Routers
    app.include_router(health_router)
    app.include_router(market_router)
    app.include_router(websocket_router)
    app.include_router(trading_router)
    app.include_router(trading_router, prefix="/api")  # alias so /api/trading and /api/strategy work
    app.include_router(trades_router)
    app.include_router(risk_router)
    app.include_router(analytics_router)
    app.include_router(ai_router)

    return app


app = create_app()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
