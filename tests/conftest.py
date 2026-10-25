"""Pytest configuration and test fixtures."""

import os
from typing import AsyncGenerator
import httpx
import pytest
import pytest_asyncio
from app.config import Settings
from app.database import Database
from app.exchange.delta_client import DeltaClient
from app.main import create_app
from app.services.ai import TradeMindCopilot
from app.services.execution_service import ExecutionService
from app.services.market_service import MarketService
from app.services.risk_service import RiskService
from app.services.trading_engine import TradingEngine


@pytest.fixture
def test_settings() -> Settings:
    """Safe settings fixture for unit testing."""
    return Settings(
        PROJECT_NAME="AlgoPilotTest",
        DELTA_API_KEY="test_api_key_12345",
        DELTA_API_SECRET="test_api_secret_67890",
        DELTA_BASE_URL="https://testnet-api.delta.exchange",
        TRADING_ENABLED=False,  # Always safe default
        AI_ENABLED=False,
        AI_PROVIDER="mock",
        MAX_POSITION_SIZE=2.0,
        MAX_DAILY_LOSS=100.0,
        MAX_OPEN_POSITIONS=2,
        REQUEST_TIMEOUT_SECONDS=5.0,
        DATABASE_PATH=":memory:",
        DEFAULT_TRADING_SYMBOL="BTCUSDT",
        STRATEGY_FAST_PERIOD=3,
        STRATEGY_SLOW_PERIOD=6,
        STRATEGY_RSI_PERIOD=4,
    )


@pytest_asyncio.fixture
async def memory_db(tmp_path) -> AsyncGenerator[Database, None]:
    """Temporary SQLite database initialized with schema for test duration."""
    db_file = tmp_path / "test_algopilot.db"
    db = Database(db_path=str(db_file))
    await db.init_db()
    yield db


class MockDeltaClient(DeltaClient):
    """Mock Delta Exchange client returning controlled test fixtures."""

    def __init__(self, ping_healthy: bool = True):
        super().__init__(
            base_url="https://testnet-api.delta.exchange",
            api_key="mock_key",
            api_secret="mock_secret",
            timeout=5.0,
        )
        self.ping_healthy = ping_healthy
        self.placed_orders = []
        self.cancelled_orders = []

    async def ping_health(self) -> tuple[bool, float]:
        return self.ping_healthy, 12.5 if self.ping_healthy else 0.0

    async def get_products(self, contract_types=None):
        return [
            {"id": 84, "symbol": "BTCUSDT", "contract_type": "perpetual_futures", "tick_size": "0.1", "state": "live"},
            {"id": 85, "symbol": "ETHUSDT", "contract_type": "perpetual_futures", "tick_size": "0.01", "state": "live"},
        ]

    async def get_ticker(self, symbol: str):
        return {
            "symbol": symbol.upper(),
            "product_id": 84,
            "mark_price": "80000.0",
            "spot_price": "80010.0",
            "quotes": {
                "best_bid": "79995.0",
                "best_ask": "80005.0",
                "bid_size": "10",
                "ask_size": "10",
            },
            "timestamp": 1700000000,
        }

    async def get_positions(self):
        return []

    async def get_orders(self, states=None, product_ids=None):
        return []

    async def place_order(self, product_id, size, side, order_type="market", price=None, client_order_id=None):
        record = {
            "id": 999123,
            "product_id": product_id,
            "size": size,
            "side": side,
            "order_type": order_type,
            "price": price,
            "client_order_id": client_order_id,
            "state": "open",
        }
        self.placed_orders.append(record)
        return record

    async def cancel_order(self, product_id, order_id=None, client_order_id=None):
        record = {"product_id": product_id, "id": order_id, "client_order_id": client_order_id, "state": "cancelled"}
        self.cancelled_orders.append(record)
        return record


@pytest_asyncio.fixture
async def app_client(test_settings: Settings, memory_db: Database) -> AsyncGenerator[httpx.AsyncClient, None]:
    """Configured AsyncClient for testing FastAPI routes with mocked exchange."""
    app = create_app()
    mock_client = MockDeltaClient(ping_healthy=True)
    market_service = MarketService(delta_client=mock_client)
    risk_service = RiskService(settings=test_settings, delta_client=mock_client)
    execution_service = ExecutionService(
        settings=test_settings,
        delta_client=mock_client,
        market_service=market_service,
        risk_service=risk_service,
        database=memory_db,
    )
    trading_engine = TradingEngine(
        settings=test_settings,
        market_service=market_service,
        risk_service=risk_service,
        execution_service=execution_service,
        database=memory_db,
    )

    copilot_service = TradeMindCopilot(
        settings=test_settings,
        db=memory_db,
    )
    from app.services.event_service import EventService
    event_service = EventService(storage=memory_db)

    app.state.settings = test_settings
    app.state.database = memory_db
    app.state.delta_client = mock_client
    app.state.market_service = market_service
    app.state.risk_service = risk_service
    app.state.execution_service = execution_service
    app.state.trading_engine = trading_engine
    app.state.copilot_service = copilot_service
    app.state.event_service = event_service

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
