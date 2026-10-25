"""Retrieval service for TradeMind AI Copilot.

Coordinates structured trade record retrieval, deterministic financial calculations,
and semantic strategy/risk knowledge search.
"""

import json
import logging
from typing import Any, Dict, List, Optional
from app.schemas.ai import QuestionCategory, SourceReference
from app.services.ai.document_ingestion import DocumentIngestionService, KnowledgeDoc

logger = logging.getLogger("algopilot.ai.retrieval_service")


class RetrievalService:
    """Read-only retrieval coordinator across database and knowledge base."""

    def __init__(self, db, doc_service: Optional[DocumentIngestionService] = None):
        """Initialize with database abstraction (SQLite or Firestore repo) and doc service."""
        self.db = db
        self.doc_service = doc_service or DocumentIngestionService()

    async def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        """Look up order by exchange or client order ID."""
        if hasattr(self.db, "get_order_by_id"):
            return await self.db.get_order_by_id(order_id)
        return None

    async def get_trade(self, trade_id: str) -> Optional[Dict[str, Any]]:
        """Look up trade by trade ID."""
        if hasattr(self.db, "get_trade_by_id"):
            return await self.db.get_trade_by_id(trade_id)
        return None

    async def get_signal(self, signal_id: str) -> Optional[Dict[str, Any]]:
        """Look up signal by ID."""
        if hasattr(self.db, "get_signal_by_id"):
            return await self.db.get_signal_by_id(signal_id)
        return None

    async def get_recent_signals(self, symbol: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent signals, optionally filtered by symbol."""
        if symbol and hasattr(self.db, "get_signals_by_symbol"):
            return await self.db.get_signals_by_symbol(symbol, limit)
        if hasattr(self.db, "get_recent_signals"):
            return await self.db.get_recent_signals(limit)
        return []

    async def get_recent_orders(self, symbol: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent orders, optionally filtered by symbol."""
        if symbol and hasattr(self.db, "get_orders_by_symbol"):
            return await self.db.get_orders_by_symbol(symbol, limit)
        if hasattr(self.db, "get_recent_orders"):
            return await self.db.get_recent_orders(limit)
        return []

    async def get_recent_trades(self, symbol: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch recent trades, optionally filtered by symbol."""
        if symbol and hasattr(self.db, "get_trades_by_symbol"):
            return await self.db.get_trades_by_symbol(symbol, limit)
        if hasattr(self.db, "get_recent_trades"):
            return await self.db.get_recent_trades(limit)
        return []

    async def get_recent_risk_events(self, symbol: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Fetch recent risk events, optionally filtered by symbol."""
        if symbol and hasattr(self.db, "get_risk_events_by_symbol"):
            return await self.db.get_risk_events_by_symbol(symbol, limit)
        if hasattr(self.db, "get_recent_risk_events"):
            return await self.db.get_recent_risk_events(limit)
        return []

    def search_knowledge(self, query: str, limit: int = 3) -> List[KnowledgeDoc]:
        """Search approved documentation for relevant strategy and risk rules."""
        return self.doc_service.search_documents(query, limit=limit)

    async def calculate_historical_performance(
        self, symbol: Optional[str] = None, limit: int = 100
    ) -> Dict[str, Any]:
        """Deterministically calculate trading performance metrics in Python.

        CRITICAL: Never allow LLMs to estimate financial arithmetic from loose text.
        """
        orders = await self.get_recent_orders(symbol=symbol, limit=limit)
        trades = await self.get_recent_trades(symbol=symbol, limit=limit)

        total_orders = len(orders)
        status_counts: Dict[str, int] = {}
        for ord_doc in orders:
            status = str(ord_doc.get("status", "unknown")).lower()
            status_counts[status] = status_counts.get(status, 0) + 1

        filled_orders = status_counts.get("filled", 0)
        rejected_orders = status_counts.get("rejected", 0)
        cancelled_orders = status_counts.get("cancelled", 0)
        open_orders = status_counts.get("open", 0)

        total_trades = len(trades)
        total_realized_pnl = 0.0
        pnl_recorded_trades = 0
        profitable_trades = 0
        losing_trades = 0

        for tr in trades:
            pnl = tr.get("realized_pnl")
            if pnl is not None:
                try:
                    pnl_float = float(pnl)
                    total_realized_pnl += pnl_float
                    pnl_recorded_trades += 1
                    if pnl_float > 0:
                        profitable_trades += 1
                    elif pnl_float < 0:
                        losing_trades += 1
                except (ValueError, TypeError):
                    pass

        win_rate = (
            round((profitable_trades / pnl_recorded_trades) * 100.0, 2)
            if pnl_recorded_trades > 0
            else None
        )

        return {
            "data_scope": f"Bounded sample of most recent {limit} records (Symbol: {symbol or 'ALL'})",
            "sample_limit": limit,
            "symbol_filter": symbol or "ALL",
            "total_orders": total_orders,
            "filled_orders": filled_orders,
            "rejected_orders": rejected_orders,
            "cancelled_orders": cancelled_orders,
            "open_orders": open_orders,
            "status_breakdown": status_counts,
            "total_trades": total_trades,
            "pnl_recorded_trades": pnl_recorded_trades,
            "total_realized_pnl_usd": round(total_realized_pnl, 4),
            "profitable_trades": profitable_trades,
            "losing_trades": losing_trades,
            "win_rate_percent": win_rate,
            "sample_orders": orders[:5],
            "sample_trades": trades[:5],
        }
