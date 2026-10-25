"""Unit tests for Firebase Cloud Firestore initialization and FirestoreRepository.

All tests utilize controlled mocks or emulators and do NOT require live credentials
or internet connectivity.
"""

import os
from unittest.mock import MagicMock
import pytest
from app.firebase_config import FirebaseInitializationError, init_firestore
from app.repositories.firestore_repo import DatabaseError, FirestoreRepository


class MockDocRef:
    """Mock Firestore Document Reference."""

    def __init__(self, doc_id: str, collection_dict: dict):
        self.id = doc_id
        self._coll = collection_dict

    def set(self, data: dict, merge: bool = False):
        if merge and self.id in self._coll:
            self._coll[self.id].update(data)
        else:
            self._coll[self.id] = dict(data)

    def get(self):
        exists = self.id in self._coll
        data = self._coll.get(self.id, {})
        mock_snapshot = MagicMock()
        mock_snapshot.exists = exists
        mock_snapshot.to_dict.return_value = data
        return mock_snapshot


class MockQuery:
    """Mock Firestore Query builder."""

    def __init__(self, collection_dict: dict):
        self._coll = collection_dict
        self._order_field = None
        self._direction = None
        self._limit = 100

    def order_by(self, field: str, direction=None):
        self._order_field = field
        self._direction = direction
        return self

    def limit(self, count: int):
        self._limit = count
        return self

    def stream(self):
        docs = list(self._coll.values())
        if self._order_field:
            docs.sort(key=lambda d: d.get(self._order_field, ""), reverse=True)
        docs = docs[: self._limit]

        snapshots = []
        for d in docs:
            snap = MagicMock()
            snap.to_dict.return_value = d
            snapshots.append(snap)
        return snapshots


class MockCollection:
    """Mock Firestore Collection."""

    def __init__(self, name: str):
        self.name = name
        self.docs = {}

    def document(self, doc_id: str):
        return MockDocRef(doc_id, self.docs)

    def order_by(self, field: str, direction=None):
        q = MockQuery(self.docs)
        return q.order_by(field, direction)

    def limit(self, count: int):
        q = MockQuery(self.docs)
        return q.limit(count)

    def stream(self):
        q = MockQuery(self.docs)
        return q.stream()


class MockFirestoreClient:
    """Mock Firestore Client simulating Cloud Firestore collections."""

    def __init__(self):
        self.collections = {}

    def collection(self, name: str):
        if name not in self.collections:
            self.collections[name] = MockCollection(name)
        return self.collections[name]


@pytest.fixture
def mock_firestore():
    return MockFirestoreClient()


@pytest.fixture
def firestore_repo(mock_firestore):
    return FirestoreRepository(firestore_client=mock_firestore)


# Initialization Tests
def test_init_firestore_fails_on_missing_service_account_file():
    """Initializing with a nonexistent service account file must fail explicitly."""
    with pytest.raises(FirebaseInitializationError) as exc_info:
        init_firestore(
            project_id="hammer-algotrading",
            service_account_path="nonexistent_key_file_987654.json",
        )
    assert "service account file does not exist" in str(exc_info.value)


# Repository Operation Tests
@pytest.mark.asyncio
async def test_firestore_ping_health(firestore_repo: FirestoreRepository, mock_firestore: MockFirestoreClient):
    """ping_health writes and updates health_check document."""
    ok = await firestore_repo.ping_health()
    assert ok is True

    health_doc = mock_firestore.collection("system_status").docs.get("health_check")
    assert health_doc is not None
    assert health_doc["status"] == "operational"
    assert "last_ping" in health_doc


@pytest.mark.asyncio
async def test_firestore_record_and_get_signals(firestore_repo: FirestoreRepository):
    """Recording signals persists structured data and queries return descending list."""
    doc_id = await firestore_repo.record_signal(
        symbol="BTCUSDT",
        signal="BUY",
        price=80500.0,
        fast_ma=80450.0,
        slow_ma=80300.0,
        rsi=62.5,
        reason="Golden Cross detected",
    )
    assert doc_id.startswith("BTCUSDT_")

    signals = await firestore_repo.get_recent_signals(limit=10)
    assert len(signals) == 1
    s = signals[0]
    assert s["symbol"] == "BTCUSDT"
    assert s["signal"] == "BUY"
    assert s["price"] == 80500.0
    assert s["fast_ma"] == 80450.0
    assert s["slow_ma"] == 80300.0
    assert s["rsi"] == 62.5
    assert "Golden Cross" in s["reason"]


@pytest.mark.asyncio
async def test_firestore_order_lifecycle(firestore_repo: FirestoreRepository, mock_firestore: MockFirestoreClient):
    """Orders use client_order_id as doc ID to guarantee idempotency and support status updates."""
    client_order_id = "algopilot-1700000000123"

    # 1. Record Order
    res_id = await firestore_repo.record_order(
        symbol="BTCUSDT",
        side="buy",
        order_type="market",
        size=1.0,
        price=None,
        status="open",
        client_order_id=client_order_id,
        order_id="exchange-999",
        response_payload={"exchange": "testnet"},
    )
    assert res_id == client_order_id

    # 2. Update Order
    await firestore_repo.update_order_status(
        client_order_id=client_order_id,
        status="filled",
        order_id="exchange-999",
        response_payload={"exchange": "testnet", "filled": True},
    )

    orders = await firestore_repo.get_recent_orders(limit=5)
    assert len(orders) == 1
    assert orders[0]["client_order_id"] == client_order_id
    assert orders[0]["status"] == "filled"
    assert orders[0]["order_id"] == "exchange-999"


@pytest.mark.asyncio
async def test_firestore_record_trades(firestore_repo: FirestoreRepository):
    """Confirmed trade execution persistence."""
    trade_id = "trade_1001"
    res_id = await firestore_repo.record_trade(
        symbol="BTCUSDT",
        side="buy",
        size=1.0,
        price=80500.0,
        order_id="exchange-999",
        trade_id=trade_id,
    )
    assert res_id == trade_id

    trades = await firestore_repo.get_recent_trades(limit=5)
    assert len(trades) == 1
    assert trades[0]["trade_id"] == trade_id
    assert trades[0]["price"] == 80500.0


@pytest.mark.asyncio
async def test_firestore_record_risk_events(firestore_repo: FirestoreRepository):
    """Risk audit events are persisted and queried."""
    await firestore_repo.record_risk_event(
        action="buy_market",
        symbol="BTCUSDT",
        approved=False,
        reason="Rejected: Daily loss limit reached ($120 >= $100).",
    )

    events = await firestore_repo.get_recent_risk_events(limit=5)
    assert len(events) == 1
    assert events[0]["approved"] is False
    assert "Daily loss limit" in events[0]["reason"]


@pytest.mark.asyncio
async def test_firestore_engine_status(firestore_repo: FirestoreRepository):
    """Engine status update and retrieval."""
    status_data = {
        "trading_enabled": False,
        "emergency_stop_active": False,
        "loop_running": True,
        "symbol": "BTCUSDT",
        "daily_realized_loss": 0.0,
    }
    await firestore_repo.update_engine_status(status_data)

    retrieved = await firestore_repo.get_engine_status()
    assert retrieved is not None
    assert retrieved["loop_running"] is True
    assert retrieved["symbol"] == "BTCUSDT"
    assert "updated_at" in retrieved


# Failure Handling Tests
@pytest.mark.asyncio
async def test_firestore_failure_handling_raises_database_error():
    """When a Firestore write fails, DatabaseError is raised rather than silent failure."""
    failing_client = MagicMock()
    failing_client.collection.side_effect = RuntimeError("Firestore connection dropped")

    repo = FirestoreRepository(firestore_client=failing_client)

    with pytest.raises(DatabaseError) as exc_info:
        await repo.record_signal("BTCUSDT", "BUY", 100.0, None, None, None, "test")

    assert "Firestore write error (signals)" in str(exc_info.value)


# Live Firebase Integration Test (Opt-in only, clearly separated from unit tests)
@pytest.mark.integration
@pytest.mark.skipif(
    not os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH") and not os.environ.get("FIRESTORE_EMULATOR_HOST"),
    reason="Live Firebase credentials or FIRESTORE_EMULATOR_HOST not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or FIRESTORE_EMULATOR_HOST to run live integration tests.",
)
@pytest.mark.asyncio
async def test_live_firestore_integration():
    """Live integration test against Firebase project hammer-algotrading or local emulator."""
    client = init_firestore(project_id="hammer-algotrading")
    repo = FirestoreRepository(firestore_client=client)
    assert await repo.ping_health() is True
