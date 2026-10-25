"""Market data API endpoints supporting both /api/v1/market and /api/market prefixes."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from app.config import get_settings
from app.schemas.trading import Candle, Instrument, Ticker
from app.services.market_service import MarketService
from app.services.market_streamer import MarketStreamer

router = APIRouter(tags=["Market Data"])


# 1. Market Status
@router.get("/api/market/status")
@router.get("/api/v1/market/status")
async def get_market_status(request: Request) -> Dict[str, Any]:
    """Return exchange environment, WebSocket connectivity, selected contract, and latest telemetry."""
    streamer: Optional[MarketStreamer] = getattr(request.app.state, "market_streamer", None)
    if streamer:
        return streamer.get_status_summary()

    settings = getattr(request.app.state, "settings", None) or get_settings()
    return {
        "exchange_environment": "Delta Exchange Demo / Testnet",
        "base_url": settings.DELTA_BASE_URL,
        "selected_contract": settings.DEFAULT_TRADING_SYMBOL,
        "connection_status": "REST_ONLY",
        "data_source": "delta_demo_rest",
        "last_successful_update": None,
        "updates_received_count": 0,
        "active_frontend_clients": 0,
        "last_error": None,
    }


# 2. Instruments & Products
@router.get("/api/market/products", response_model=List[Instrument])
@router.get("/api/v1/market/products", response_model=List[Instrument])
@router.get("/api/market/instruments", response_model=List[Instrument])
@router.get("/api/v1/market/instruments", response_model=List[Instrument])
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


# 3. Ticker (Query Parameter & Path Parameter)
@router.get("/api/market/ticker", response_model=Ticker)
@router.get("/api/v1/market/ticker", response_model=Ticker)
async def get_ticker_by_query(
    request: Request,
    symbol: str = Query(default="BTCUSDT", description="Contract symbol, e.g. BTCUSDT or BTCUSD"),
) -> Ticker:
    """Fetch real-time ticker data by query parameter."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_ticker(symbol)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Ticker for '{symbol}' not found: {str(exc)}")


@router.get("/api/market/ticker/{symbol}", response_model=Ticker)
@router.get("/api/v1/market/ticker/{symbol}", response_model=Ticker)
async def get_ticker_by_path(symbol: str, request: Request) -> Ticker:
    """Fetch real-time ticker data (mark price, spot price, best bid/ask) by path parameter."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_ticker(symbol)
    except Exception as exc:
        raise HTTPException(status_code=404, detail=f"Ticker for '{symbol}' not found: {str(exc)}")


# 4. Level 2 Orderbook
@router.get("/api/market/orderbook/{symbol}")
@router.get("/api/v1/market/orderbook/{symbol}")
async def get_orderbook(symbol: str, request: Request) -> Dict[str, Any]:
    """Fetch Level 2 Orderbook for symbol."""
    delta_client = request.app.state.delta_client
    try:
        return await delta_client.get_orderbook(symbol)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch orderbook: {str(exc)}")


# 5. Historical Candles (Query Parameter & Path Parameter)
@router.get("/api/market/candles", response_model=List[Candle])
@router.get("/api/v1/market/candles", response_model=List[Candle])
async def get_candles_by_query(
    request: Request,
    symbol: str = Query(default="BTCUSDT", description="Contract symbol"),
    resolution: str = Query(default="1m", description="Candle resolution: 1m, 5m, 1h, 1d"),
    limit: int = Query(default=60, ge=10, le=500, description="Number of candles"),
) -> List[Candle]:
    """Fetch historical OHLC candles sorted chronologically (oldest to newest) by query parameter."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_candles(symbol=symbol, resolution=resolution, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch candles: {str(exc)}")


@router.get("/api/market/candles/{symbol}", response_model=List[Candle])
@router.get("/api/v1/market/candles/{symbol}", response_model=List[Candle])
async def get_candles_by_path(
    symbol: str,
    request: Request,
    resolution: str = Query(default="1m", description="Candle resolution: 1m, 5m, 1h, 1d"),
    limit: int = Query(default=60, ge=10, le=500, description="Number of candles"),
) -> List[Candle]:
    """Fetch historical OHLC candles sorted chronologically (oldest to newest) by path parameter."""
    market_service: MarketService = request.app.state.market_service
    try:
        return await market_service.get_candles(symbol=symbol, resolution=resolution, limit=limit)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Failed to fetch candles: {str(exc)}")
