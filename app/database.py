"""Async SQLite database manager for AlgoPilot trading state and audit logs."""

import datetime
import json
import logging
from typing import Any, Dict, List, Optional
import aiosqlite

logger = logging.getLogger("algopilot.database")


class Database:
    """Lightweight asynchronous SQLite manager."""

    def __init__(self, db_path: str = "algopilot.db"):
        self.db_path = db_path

    async def init_db(self) -> None:
        """Create tables and indexes if they do not exist."""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    signal TEXT NOT NULL,
                    price REAL NOT NULL,
                    fast_ma REAL,
                    slow_ma REAL,
                    rsi REAL,
                    reason TEXT NOT NULL
                )
                """
            )
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT,
                    client_order_id TEXT UNIQUE,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    order_type TEXT NOT NULL,
                    size REAL NOT NULL,
                    price REAL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    response_payload TEXT
                )
                """
            )
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS trades (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trade_id TEXT,
                    order_id TEXT,
                    symbol TEXT NOT NULL,
                    side TEXT NOT NULL,
                    size REAL NOT NULL,
                    price REAL NOT NULL,
                    realized_pnl REAL,
                    exit_reason TEXT,
                    executed_at TEXT NOT NULL
                )
                """
            )
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS risk_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    action TEXT NOT NULL,
                    symbol TEXT NOT NULL,
                    approved INTEGER NOT NULL,
                    reason TEXT NOT NULL,
                    checks_passed TEXT,
                    checks_failed TEXT,
                    client_order_id TEXT
                )
                """
            )
            # Safe schema migrations for existing databases
            for col_def in [
                "ALTER TABLE trades ADD COLUMN realized_pnl REAL",
                "ALTER TABLE trades ADD COLUMN exit_reason TEXT",
                "ALTER TABLE risk_events ADD COLUMN checks_passed TEXT",
                "ALTER TABLE risk_events ADD COLUMN checks_failed TEXT",
                "ALTER TABLE risk_events ADD COLUMN client_order_id TEXT",
            ]:
                try:
                    await db.execute(col_def)
                except Exception:
                    pass
            await db.execute(
                """
                CREATE TABLE IF NOT EXISTS system_status (
                    key TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            await db.commit()
            logger.info("Database initialized with verified schema at %s", self.db_path)

    async def ping_health(self) -> bool:
        """Probe database connectivity."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT 1")
            row = await cursor.fetchone()
            return bool(row and row[0] == 1)

    async def update_engine_status(self, status_data: Dict[str, Any]) -> None:
        """Update engine status state."""
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        payload = json.dumps(status_data)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO system_status (key, data, updated_at)
                VALUES ('engine_status', ?, ?)
                ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
                """,
                (payload, now),
            )
            await db.commit()

    async def get_engine_status(self) -> Optional[Dict[str, Any]]:
        """Retrieve latest engine status state."""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute("SELECT data FROM system_status WHERE key = 'engine_status'")
            row = await cursor.fetchone()
            if row:
                return json.loads(row[0])
            return None

    async def record_signal(
        self,
        symbol: str,
        signal: str,
        price: float,
        fast_ma: Optional[float],
        slow_ma: Optional[float],
        rsi: Optional[float],
        reason: str,
    ) -> int:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO signals (timestamp, symbol, signal, price, fast_ma, slow_ma, rsi, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (now, symbol, signal, price, fast_ma, slow_ma, rsi, reason),
            )
            await db.commit()
            return cursor.lastrowid or 0

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
    ) -> int:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        payload_str = json.dumps(response_payload) if response_payload else None
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO orders (
                    order_id, client_order_id, symbol, side, order_type,
                    size, price, status, created_at, updated_at, response_payload
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order_id,
                    client_order_id,
                    symbol,
                    side,
                    order_type,
                    size,
                    price,
                    status,
                    now,
                    now,
                    payload_str,
                ),
            )
            await db.commit()
            return cursor.lastrowid or 0

    async def update_order_status(
        self,
        client_order_id: str,
        status: str,
        order_id: Optional[str] = None,
        response_payload: Optional[Dict[str, Any]] = None,
    ) -> None:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        payload_str = json.dumps(response_payload) if response_payload else None
        async with aiosqlite.connect(self.db_path) as db:
            if order_id and payload_str:
                await db.execute(
                    """
                    UPDATE orders
                    SET status = ?, order_id = ?, updated_at = ?, response_payload = ?
                    WHERE client_order_id = ?
                    """,
                    (status, order_id, now, payload_str, client_order_id),
                )
            elif order_id:
                await db.execute(
                    """
                    UPDATE orders
                    SET status = ?, order_id = ?, updated_at = ?
                    WHERE client_order_id = ?
                    """,
                    (status, order_id, now, client_order_id),
                )
            else:
                await db.execute(
                    """
                    UPDATE orders
                    SET status = ?, updated_at = ?
                    WHERE client_order_id = ?
                    """,
                    (status, now, client_order_id),
                )
            await db.commit()

    async def record_trade(
        self,
        symbol: str,
        side: str,
        size: float,
        price: float,
        order_id: Optional[str] = None,
        trade_id: Optional[str] = None,
        realized_pnl: Optional[float] = None,
        exit_reason: Optional[str] = None,
    ) -> int:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO trades (trade_id, order_id, symbol, side, size, price, realized_pnl, exit_reason, executed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (trade_id, order_id, symbol, side, size, price, realized_pnl, exit_reason, now),
            )
            await db.commit()
            return cursor.lastrowid or 0

    async def record_risk_event(
        self,
        action: str,
        symbol: str,
        approved: bool,
        reason: str,
        checks_passed: Optional[List[str]] = None,
        checks_failed: Optional[List[str]] = None,
        client_order_id: Optional[str] = None,
    ) -> int:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        passed_json = json.dumps(checks_passed) if checks_passed else None
        failed_json = json.dumps(checks_failed) if checks_failed else None
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO risk_events (
                    timestamp, action, symbol, approved, reason,
                    checks_passed, checks_failed, client_order_id
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (now, action, symbol.upper() if symbol else "", 1 if approved else 0, reason, passed_json, failed_json, client_order_id),
            )
            await db.commit()
            return cursor.lastrowid or 0

    async def get_recent_signals(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM signals ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_recent_orders(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM orders ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_recent_trades(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM trades ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_recent_risk_events(self, limit: int = 50) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM risk_events ORDER BY id DESC LIMIT ?", (limit,)
            )
            rows = await cursor.fetchall()
            results = []
            for r in rows:
                d = dict(r)
                if d.get("checks_passed") and isinstance(d["checks_passed"], str):
                    try:
                        d["checks_passed"] = json.loads(d["checks_passed"])
                    except Exception:
                        pass
                if d.get("checks_failed") and isinstance(d["checks_failed"], str):
                    try:
                        d["checks_failed"] = json.loads(d["checks_failed"])
                    except Exception:
                        pass
                results.append(d)
            return results

    # Structured lookup methods for TradeMind AI Copilot
    async def get_order_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up order by exchange order_id or client_order_id."""
        clean_id = str(identifier).strip()
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM orders WHERE order_id = ? OR client_order_id = ? ORDER BY id DESC LIMIT 1",
                (clean_id, clean_id),
            )
            row = await cursor.fetchone()
            if row:
                res = dict(row)
                if res.get("response_payload"):
                    try:
                        res["response_payload"] = json.loads(res["response_payload"])
                    except Exception:
                        pass
                return res
            return None

    async def get_trade_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up trade by trade_id or associated order_id (with or without TRD-/FILL- prefix)."""
        clean_id = str(identifier).strip()
        stripped_id = clean_id.replace("TRD-", "").replace("FILL-", "")
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """
                SELECT * FROM trades
                WHERE trade_id = ? OR trade_id = ? OR order_id = ? OR order_id = ? OR id = ?
                ORDER BY id DESC LIMIT 1
                """,
                (clean_id, stripped_id, clean_id, stripped_id, stripped_id),
            )
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_signal_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up signal by integer ID."""
        clean_id = str(identifier).strip()
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute("SELECT * FROM signals WHERE id = ? LIMIT 1", (clean_id,))
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_orders_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent orders for a specific symbol."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM orders WHERE symbol = ? ORDER BY id DESC LIMIT ?",
                (symbol.upper(), limit),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_trades_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent trades for a specific symbol."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM trades WHERE symbol = ? ORDER BY id DESC LIMIT ?",
                (symbol.upper(), limit),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_signals_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent signals for a specific symbol."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM signals WHERE symbol = ? ORDER BY id DESC LIMIT ?",
                (symbol.upper(), limit),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_risk_events_by_symbol(self, symbol: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent risk decisions for a specific symbol."""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                "SELECT * FROM risk_events WHERE symbol = ? ORDER BY id DESC LIMIT ?",
                (symbol.upper(), limit),
            )
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_risk_event_by_id(self, identifier: str) -> Optional[Dict[str, Any]]:
        """Look up risk event by integer ID or client_order_id."""
        clean_id = str(identifier).strip()
        stripped_id = clean_id.replace("RISK-", "")
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            cursor = await db.execute(
                """
                SELECT * FROM risk_events
                WHERE id = ? OR id = ? OR client_order_id = ? OR client_order_id = ?
                ORDER BY id DESC LIMIT 1
                """,
                (clean_id, stripped_id, clean_id, stripped_id),
            )
            row = await cursor.fetchone()
            if row:
                res = dict(row)
                if res.get("checks_passed") and isinstance(res["checks_passed"], str):
                    try:
                        res["checks_passed"] = json.loads(res["checks_passed"])
                    except Exception:
                        pass
                if res.get("checks_failed") and isinstance(res["checks_failed"], str):
                    try:
                        res["checks_failed"] = json.loads(res["checks_failed"])
                    except Exception:
                        pass
                return res
            return None
