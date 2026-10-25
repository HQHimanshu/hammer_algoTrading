"""Trades API router for trade lifecycle and execution records."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.services.event_service import EventService

router = APIRouter(prefix="/api/v1", tags=["Trades"])


@router.get("/trades")
async def list_trades(
    request: Request,
    symbol: Optional[str] = Query(default=None, description="Optional instrument filter (e.g. BTCUSDT)"),
    limit: int = Query(default=50, ge=1, le=100, description="Page limit"),
) -> List[Dict[str, Any]]:
    """Retrieve persisted trade execution records."""
    event_service: EventService = getattr(
        request.app.state, "event_service", None
    )
    if event_service:
        return await event_service.list_trades(symbol=symbol, limit=limit)

    storage = getattr(request.app.state, "database", None) or getattr(request.app.state, "firestore_repo", None)
    if not storage:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    if symbol:
        return await storage.get_trades_by_symbol(symbol.upper(), limit=limit)
    return await storage.get_recent_trades(limit=limit)


@router.get("/trades/{trade_id}")
async def get_trade_by_id(
    trade_id: str,
    request: Request,
) -> Dict[str, Any]:
    """Retrieve a single trade record by trade_id or associated order_id."""
    event_service: EventService = getattr(
        request.app.state, "event_service", None
    )
    if event_service:
        trade_event = await event_service.get_trade_event(trade_id)
        if trade_event:
            return trade_event.model_dump()

    storage = getattr(request.app.state, "database", None) or getattr(request.app.state, "firestore_repo", None)
    if not storage:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    trade = await storage.get_trade_by_id(trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail=f"Trade '{trade_id}' not found")
    return trade
