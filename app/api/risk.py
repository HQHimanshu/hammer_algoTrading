"""Risk API router for pre-trade risk evaluation audit events."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.services.event_service import EventService

router = APIRouter(prefix="/api/v1", tags=["Risk"])


@router.get("/risk/events")
async def list_risk_events(
    request: Request,
    symbol: Optional[str] = Query(default=None, description="Optional instrument filter (e.g. BTCUSDT)"),
    limit: int = Query(default=50, ge=1, le=100, description="Page limit"),
) -> List[Dict[str, Any]]:
    """Retrieve audit history of pre-trade risk checks and rejection reasons."""
    event_service: EventService = getattr(
        request.app.state, "event_service", None
    )
    if event_service:
        return await event_service.list_risk_events(symbol=symbol, limit=limit)

    storage = getattr(request.app.state, "database", None) or getattr(request.app.state, "firestore_repo", None)
    if not storage:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    if symbol:
        return await storage.get_risk_events_by_symbol(symbol.upper(), limit=limit)
    return await storage.get_recent_risk_events(limit=limit)


@router.get("/risk/events/{event_id}")
async def get_risk_event_by_id(
    event_id: str,
    request: Request,
) -> Dict[str, Any]:
    """Retrieve a single risk decision event by event ID or client_order_id."""
    event_service: EventService = getattr(
        request.app.state, "event_service", None
    )
    if event_service:
        record = await event_service.get_risk_event(event_id)
        if record:
            return record.model_dump()

    storage = getattr(request.app.state, "database", None) or getattr(request.app.state, "firestore_repo", None)
    if not storage:
        raise HTTPException(status_code=503, detail="Database service unavailable")

    event = await storage.get_risk_event_by_id(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Risk event '{event_id}' not found")
    return event
