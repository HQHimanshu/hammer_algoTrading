"""Cloud Firestore repository for AlgoPilot trading state, audit logs, and engine status."""

import asyncio
import datetime
import logging
import time
from typing import Any, Dict, List, Optional
from google.cloud.firestore import Query

logger = logging.getLogger("algopilot.firestore_repo")


class DatabaseError(Exception):
    """Raised when a database operation fails."""


class FirestoreRepository:
    """Manages persistence in Google Cloud Firestore for project `hammer-algotrading`.

    Collections:
    - signals: Evaluated strategy signals and explanations.
    - orders: Submitted order requests, client IDs, and exchange statuses.
    - trades: Executed trade fills and prices.
    - risk_events: Pre-trade risk rule evaluations and rejections.
    - system_status: Document 'engine_status' tracking trading state.
    """

    COLLECTION_SIGNALS = "signals"
    COLLECTION_ORDERS = "orders"
    COLLECTION_TRADES = "trades"
    COLLECTION_RISK_EVENTS = "risk_events"
    COLLECTION_SYSTEM_STATUS = "system_status"

    def __init__(self, firestore_client):
        self.db = firestore_client

    async def init_db(self) -> None:
        """Validate Firestore connection and write startup heartbeat."""
        await self.ping_health()
        logger.info("Firestore repository initialized and connected to Cloud Firestore.")

    async def ping_health(self) -> bool:
        """Probe Firestore connectivity by checking system_status collection."""
        def _ping():
            try:
                doc_ref = self.db.collection(self.COLLECTION_SYSTEM_STATUS).document("health_check")
                now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
                doc_ref.set({"last_ping": now_iso, "status": "operational"}, merge=True)
                return True
            except Exception as exc:
                logger.error("Firestore health ping failed: %s", exc)
                raise DatabaseError(f"Cloud Firestore unreachable: {exc}") from exc

        return await asyncio.to_thread(_ping)

    async def record_signal(
        self,
        symbol: str,
        signal: str,
        price: float,
        fast_ma: Optional[float],
        slow_ma: Optional[float],
        rsi: Optional[float],
        reason: str,
    ) -> str:
        """Persist an evaluated strategy signal with structured indicators."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        doc_id = f"{symbol.upper()}_{int(time.time() * 1000)}"

        data = {
            "timestamp": now_iso,
            "symbol": symbol.upper(),
            "signal": signal,
            "price": float(price),
            "fast_ma": float(fast_ma) if fast_ma is not None else None,
            "slow_ma": float(slow_ma) if slow_ma is not None else None,
            "rsi": float(rsi) if rsi is not None else None,
            "reason": reason,
        }

        def _write():
            try:
                self.db.collection(self.COLLECTION_SIGNALS).document(doc_id).set(data)
                return doc_id
            except Exception as exc:
                logger.error("Failed to write signal to Firestore: %s", exc)
                raise DatabaseError(f"Firestore write error (signals): {exc}") from exc

        return await asyncio.to_thread(_write)

    async def record_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        size: float,
        price: Optional[float],
        status: str,
        client_order_id: Optional[str] = None,
        order_id: Optional[str] = None,
        response_payload: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Persist order submission and status.

        Uses client_order_id as document ID to guarantee idempotency and avoid duplicate records.
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        doc_id = client_order_id or f"algopilot-{int(time.time() * 1000)}"

        data = {
            "client_order_id": doc_id,
            "order_id": str(order_id) if order_id else None,
            "symbol": symbol.upper(),
            "side": side.lower(),
            "order_type": order_type.lower(),
            "size": float(size),
            "price": float(price) if price is not None else None,
            "status": status.lower(),
            "created_at": now_iso,
            "updated_at": now_iso,
            "response_payload": response_payload or {},
        }

        def _write():
            try:
                self.db.collection(self.COLLECTION_ORDERS).document(doc_id).set(data)
                return doc_id
            except Exception as exc:
                logger.error("Failed to write order %s to Firestore: %s", doc_id, exc)
                raise DatabaseError(f"Firestore write error (orders): {exc}") from exc

        return await asyncio.to_thread(_write)

    async def update_order_status(
        self,
        client_order_id: str,
        status: str,
        order_id: Optional[str] = None,
        response_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Update exchange order state and fill outcome."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        update_fields: Dict[str, Any] = {
            "status": status.lower(),
            "updated_at": now_iso,
        }
        if order_id:
            update_fields["order_id"] = str(order_id)
        if response_payload:
            update_fields["response_payload"] = response_payload

        def _update():
            try:
                doc_ref = self.db.collection(self.COLLECTION_ORDERS).document(client_order_id)
                doc_ref.set(update_fields, merge=True)
            except Exception as exc:
                logger.error("Failed to update order %s in Firestore: %s", client_order_id, exc)
                raise DatabaseError(f"Firestore update error (orders): {exc}") from exc

        await asyncio.to_thread(_update)

    async def record_trade(
        self,
        symbol: str,
        side: str,
        size: float,
        price: float,
        order_id: Optional[str] = None,
        trade_id: Optional[str] = None,
        realized_pnl: Optional[float] = None,
    ) -> str:
        """Persist a confirmed trade fill."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        doc_id = trade_id or f"trade_{order_id or int(time.time() * 1000)}"

        data = {
            "trade_id": doc_id,
            "order_id": str(order_id) if order_id else None,
            "symbol": symbol.upper(),
            "side": side.lower(),
            "size": float(size),
            "price": float(price),
            "realized_pnl": float(realized_pnl) if realized_pnl is not None else None,
            "executed_at": now_iso,
        }

        def _write():
            try:
                self.db.collection(self.COLLECTION_TRADES).document(doc_id).set(data)
                return doc_id
            except Exception as exc:
                logger.error("Failed to write trade to Firestore: %s", exc)
                raise DatabaseError(f"Firestore write error (trades): {exc}") from exc

        return await asyncio.to_thread(_write)

    async def record_risk_event(
        self,
        action: str,
        symbol: str,
        approved: bool,
        reason: str,
        checks_passed: Optional[List[str]] = None,
        checks_failed: Optional[List[str]] = None,
        client_order_id: Optional[str] = None,
    ) -> str:
        """Persist a pre-trade risk decision audit event."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        doc_id = f"risk_{int(time.time() * 1000)}"

        data = {
            "timestamp": now_iso,
            "action": action,
            "symbol": symbol.upper() if symbol else "",
            "approved": bool(approved),
            "reason": reason,
            "checks_passed": checks_passed or [],
            "checks_failed": checks_failed or [],
            "client_order_id": client_order_id,
        }

        def _write():
            try:
                self.db.collection(self.COLLECTION_RISK_EVENTS).document(doc_id).set(data)
                return doc_id
            except Exception as exc:
                logger.error("Failed to write risk event to Firestore: %s", exc)
                raise DatabaseError(f"Firestore write error (risk_events): {exc}") from exc

        return await asyncio.to_thread(_write)

    async def update_engine_status(self, status_data: Dict[str, Any]) -> None:
        """Update live trading engine state document."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        payload = dict(status_data)
        payload["updated_at"] = now_iso

        def _write():
            try:
                doc_ref = self.db.collection(self.COLLECTION_SYSTEM_STATUS).document("engine_status")
                doc_ref.set(payload, merge=True)
            except Exception as exc:
                logger.error("Failed to update engine status in Firestore: %s", exc)
                raise DatabaseError(f"Firestore write error (system_status): {exc}") from exc

        await asyncio.to_thread(_write)

    async def get_engine_status(self) -> Optional[Dict[str, Any]]:
        """Retrieve persisted engine status."""
        def _read():
            try:
                doc = self.db.collection(self.COLLECTION_SYSTEM_STATUS).document("engine_status").get()
                return doc.to_dict() if doc.exists else None
            except Exception as exc:
                logger.error("Failed to fetch engine status from Firestore: %s", exc)
                raise DatabaseError(f"Firestore read error (system_status): {exc}") from exc

        return await asyncio.to_thread(_read)

    async def get_recent_signals(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch bounded list of recent signals sorted descending by timestamp."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_SIGNALS)
                docs = coll.order_by("timestamp", direction=Query.DESCENDING).limit(bounded_limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query signals from Firestore: %s", exc)
                raise DatabaseError(f"Firestore query error (signals): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_recent_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch bounded list of recent orders sorted descending by created_at."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_ORDERS)
                docs = coll.order_by("created_at", direction=Query.DESCENDING).limit(bounded_limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query orders from Firestore: %s", exc)
                raise DatabaseError(f"Firestore query error (orders): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_recent_trades(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch bounded list of recent trades sorted descending by executed_at."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_TRADES)
                docs = coll.order_by("executed_at", direction=Query.DESCENDING).limit(bounded_limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query trades from Firestore: %s", exc)
                raise DatabaseError(f"Firestore query error (trades): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_recent_risk_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch bounded list of recent risk decisions sorted descending by timestamp."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_RISK_EVENTS)
                docs = coll.order_by("timestamp", direction=Query.DESCENDING).limit(bounded_limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query risk events from Firestore: %s", exc)
                raise DatabaseError(f"Firestore query error (risk_events): {exc}") from exc

        return await asyncio.to_thread(_query)

    # Structured lookup methods for TradeMind AI Copilot
    async def get_order_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up order by client_order_id (document key) or exchange order_id."""
        clean_id = str(identifier).strip()

        def _lookup():
            try:
                # 1. Direct document key lookup (client_order_id)
                doc = self.db.collection(self.COLLECTION_ORDERS).document(clean_id).get()
                if doc.exists:
                    return doc.to_dict()

                # 2. Query lookup by order_id field
                docs = self.db.collection(self.COLLECTION_ORDERS).where("order_id", "==", clean_id).limit(1).stream()
                for d in docs:
                    return d.to_dict()
                return None
            except Exception as exc:
                logger.error("Failed to lookup order %s in Firestore: %s", clean_id, exc)
                raise DatabaseError(f"Firestore lookup error (orders): {exc}") from exc

        return await asyncio.to_thread(_lookup)

    async def get_trade_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up trade by trade_id (document key) or associated order_id."""
        clean_id = str(identifier).strip()

        def _lookup():
            try:
                # 1. Direct key lookup
                doc = self.db.collection(self.COLLECTION_TRADES).document(clean_id).get()
                if doc.exists:
                    return doc.to_dict()

                # 2. Query lookup by order_id
                docs = self.db.collection(self.COLLECTION_TRADES).where("order_id", "==", clean_id).limit(1).stream()
                for d in docs:
                    return d.to_dict()
                return None
            except Exception as exc:
                logger.error("Failed to lookup trade %s in Firestore: %s", clean_id, exc)
                raise DatabaseError(f"Firestore lookup error (trades): {exc}") from exc

        return await asyncio.to_thread(_lookup)

    async def get_signal_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up signal by document ID."""
        clean_id = str(identifier).strip()

        def _lookup():
            try:
                doc = self.db.collection(self.COLLECTION_SIGNALS).document(clean_id).get()
                return doc.to_dict() if doc.exists else None
            except Exception as exc:
                logger.error("Failed to lookup signal %s in Firestore: %s", clean_id, exc)
                raise DatabaseError(f"Firestore lookup error (signals): {exc}") from exc

        return await asyncio.to_thread(_lookup)

    async def get_orders_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent orders for a specific symbol."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_ORDERS)
                docs = (
                    coll.where("symbol", "==", symbol.upper())
                    .order_by("created_at", direction=Query.DESCENDING)
                    .limit(bounded_limit)
                    .stream()
                )
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query orders for %s from Firestore: %s", symbol, exc)
                raise DatabaseError(f"Firestore query error (orders by symbol): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_trades_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent trades for a specific symbol."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_TRADES)
                docs = (
                    coll.where("symbol", "==", symbol.upper())
                    .order_by("executed_at", direction=Query.DESCENDING)
                    .limit(bounded_limit)
                    .stream()
                )
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query trades for %s from Firestore: %s", symbol, exc)
                raise DatabaseError(f"Firestore query error (trades by symbol): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_signals_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent signals for a specific symbol."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_SIGNALS)
                docs = (
                    coll.where("symbol", "==", symbol.upper())
                    .order_by("timestamp", direction=Query.DESCENDING)
                    .limit(bounded_limit)
                    .stream()
                )
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query signals for %s from Firestore: %s", symbol, exc)
                raise DatabaseError(f"Firestore query error (signals by symbol): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_risk_events_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent risk events for a specific symbol."""
        bounded_limit = min(max(1, limit), 100)

        def _query():
            try:
                coll = self.db.collection(self.COLLECTION_RISK_EVENTS)
                docs = (
                    coll.where("symbol", "==", symbol.upper())
                    .order_by("timestamp", direction=Query.DESCENDING)
                    .limit(bounded_limit)
                    .stream()
                )
                return [doc.to_dict() for doc in docs]
            except Exception as exc:
                logger.error("Failed to query risk events for %s from Firestore: %s", symbol, exc)
                raise DatabaseError(f"Firestore query error (risk events by symbol): {exc}") from exc

        return await asyncio.to_thread(_query)

    async def get_risk_event_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up risk event by document key or client_order_id."""
        clean_id = str(identifier).strip()

        def _lookup():
            try:
                doc = self.db.collection(self.COLLECTION_RISK_EVENTS).document(clean_id).get()
                if doc.exists:
                    return doc.to_dict()
                docs = (
                    self.db.collection(self.COLLECTION_RISK_EVENTS)
                    .where("client_order_id", "==", clean_id)
                    .limit(1)
                    .stream()
                )
                for d in docs:
                    return d.to_dict()
                return None
            except Exception as exc:
                logger.error("Failed to lookup risk event %s in Firestore: %s", clean_id, exc)
                raise DatabaseError(f"Firestore lookup error (risk_events): {exc}") from exc

        return await asyncio.to_thread(_lookup)
