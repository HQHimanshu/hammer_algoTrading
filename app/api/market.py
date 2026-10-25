"""Market data API endpoints."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.schemas.trading import Candle, Instrument, Ticker
from app.services.market_service import MarketService

router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])


@router.get("/instruments", response_model=List[Instrument])
@router.get("/products", response_model=List[Instrument])
async def get_instruments(
    request: Request,
    refresh: bool = Query(default=False, description="Force refresh cache from exchange"),
) -> List[Instrument]:
    """Fetch catalog of supported instruments from Delta Exchange Testnet."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_instruments(refresh=refresh)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch instruments: {str(exc)}")


@router.get("/ticker/{symbol}", response_model=Ticker)
async def get_ticker(symbol: str, request: Request) -> Ticker:
    """Fetch real-time ticker data (mark price, spot price, best bid/ask) for symbol."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_ticker(symbol)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Ticker for '{symbol}' not found or exchange error: {str(exc)}")


@router.get("/orderbook/{symbol}")
async def get_orderbook(symbol: str, request: Request) -> Dict[str, Any]:
    """Fetch Level 2 Orderbook for symbol."""
    delta_client = request.app.state.delta_client
    try:
        return await delta_client.get_orderbook(symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch orderbook: {str(exc)}")


@router.get("/candles/{symbol}", response_model=List[Candle])
async def get_candles(
    symbol: str,
    request: Request,
    resolution: str = Query(default="1m", description="Candle resolution: 1m, 5m, 1h, 1d"),
    limit: int = Query(default=60, ge=10, le=500, description="Number of candles"),
) -> List[Candle]:
    """Fetch historical OHLC candles sorted chronologically (oldest to newest)."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_candles(symbol=symbol, resolution=resolution, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch candles: {str(exc)}")
