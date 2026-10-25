"""Analytics API router for verified historical trading performance."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.schemas.trading import AnalyticsSummaryResponse
from app.services.event_service import EventService

router = APIRouter(prefix="/api/v1", tags=["Analytics"])


@router.get("/analytics/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    request: Request,
    symbol: Optional[str] = Query(default=None, description="Optional instrument filter (e.g. BTCUSDT)"),
) -> AnalyticsSummaryResponse:
    """Calculate and return deterministic analytics over verified trading events.

    Calculations are performed strictly in Python over verified database records,
    without relying on LLM estimation.
    """
    event_service: EventService = getattr(
        request.app.state, "event_service", None
    )
    if not event_service:
        # Fallback to creating a transient EventService from available storage
        storage = getattr(request.app.state, "database", None) or getattr(request.app.state, "firestore_repo", None)
        if not storage:
            raise HTTPException(status_code=503, detail="Storage backend unavailable for analytics")
        event_service = EventService(storage)

    try:
        return await event_service.compute_analytics_summary(symbol=symbol)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to compute analytics: {str(exc)}")
