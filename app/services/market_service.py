"""Market Data Service for Delta Exchange Testnet."""

import logging
import time
from typing import Any, Dict, List, Optional
from app.exchange.delta_client import DeltaClient
from app.schemas.trading import Candle, Instrument, Ticker

logger = logging.getLogger("algopilot.market_service")


class MarketService:
    """Coordinates market data fetching, instrument caching, and candle formatting."""

    def __init__(self, delta_client: DeltaClient):
        self.delta_client = delta_client
        self._product_cache: Dict[str, Dict[str, Any]] = {}
        self._id_cache: Dict[int, Dict[str, Any]] = {}
        self._cache_timestamp: float = 0.0
        self._cache_ttl_seconds: float = 300.0  # 5 minutes

    async def get_instruments(self, refresh: bool = False) -> List[Instrument]:
        """Retrieve list of supported perpetual futures and spot instruments."""
        await self._ensure_product_cache(force_refresh=refresh)
        instruments = []
        for p in self._product_cache.values():
            instruments.append(
                Instrument(
                    id=p["id"],
                    symbol=p["symbol"],
                    contract_type=p.get("contract_type", "unknown"),
                    tick_size=p.get("tick_size"),
                    contract_value=p.get("contract_value"),
                    state=p.get("state"),
                )
            )
        return instruments

    async def get_product_info(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Look up product details by symbol with caching."""
        await self._ensure_product_cache()
        return self._product_cache.get(symbol.upper())

    async def get_product_id(self, symbol: str) -> int:
        """Resolve instrument ID for symbol."""
        info = await self.get_product_info(symbol)
        if not info or "id" not in info:
            raise ValueError(f"Instrument symbol '{symbol}' is not recognized on Delta Testnet.")
        return int(info["id"])

    async def get_ticker(self, symbol: str) -> Ticker:
        """Fetch current live ticker information for symbol."""
        raw = await self.delta_client.get_ticker(symbol)
        quotes = raw.get("quotes") or {}

        mark_price = float(raw["mark_price"]) if raw.get("mark_price") else None
        spot_price = float(raw["spot_price"]) if raw.get("spot_price") else None
        best_bid = float(quotes["best_bid"]) if quotes.get("best_bid") else None
        best_ask = float(quotes["best_ask"]) if quotes.get("best_ask") else None
        bid_size = float(quotes["bid_size"]) if quotes.get("bid_size") else None
        ask_size = float(quotes["ask_size"]) if quotes.get("ask_size") else None

        return Ticker(
            symbol=raw.get("symbol", symbol),
            product_id=raw.get("product_id"),
            mark_price=mark_price,
            spot_price=spot_price,
            best_bid=best_bid,
            best_ask=best_ask,
            bid_size=bid_size,
            ask_size=ask_size,
            timestamp=raw.get("timestamp"),
        )

    async def get_candles(
        self,
        symbol: str,
        resolution: str = "1m",
        limit: int = 60,
    ) -> List[Candle]:
        """Fetch historical candles formatted in chronological order (oldest -> newest).

        Delta Exchange API returns reverse chronological data; this method normalizes it.
        """
        now = int(time.time())
        # Convert resolution string to seconds
        res_seconds = 60
        if resolution.endswith("m"):
            res_seconds = int(resolution[:-1]) * 60
        elif resolution.endswith("h"):
            res_seconds = int(resolution[:-1]) * 3600
        elif resolution.endswith("d"):
            res_seconds = int(resolution[:-1]) * 86400

        start_time = now - (res_seconds * limit)
        raw_candles = await self.delta_client.get_candles(
            symbol=symbol,
            resolution=resolution,
            start=start_time,
            end=now,
        )

        candles: List[Candle] = []
        for item in raw_candles:
            try:
                candles.append(
                    Candle(
                        time=int(item["time"]),
                        open=float(item["open"]),
                        high=float(item["high"]),
                        low=float(item["low"]),
                        close=float(item["close"]),
                        volume=float(item.get("volume", 0.0)),
                    )
                )
            except (KeyError, ValueError, TypeError) as exc:
                logger.debug("Skipping malformed candle: %s, error: %s", item, exc)

        # Delta returns newest first; sort ascending chronologically (oldest -> newest)
        candles.sort(key=lambda c: c.time)
        return candles

    async def _ensure_product_cache(self, force_refresh: bool = False) -> None:
        """Fetch and populate product metadata cache."""
        now = time.time()
        if not force_refresh and self._product_cache and (now - self._cache_timestamp < self._cache_ttl_seconds):
            return

        try:
            products = await self.delta_client.get_products()
            new_cache: Dict[str, Dict[str, Any]] = {}
            id_cache: Dict[int, Dict[str, Any]] = {}
            for p in products:
                sym = p.get("symbol")
                pid = p.get("id")
                if sym and pid:
                    new_cache[sym.upper()] = p
                    id_cache[int(pid)] = p
            self._product_cache = new_cache
            self._id_cache = id_cache
            self._cache_timestamp = now
            logger.info("Loaded and cached %d products from Delta Testnet", len(new_cache))
        except Exception as exc:
            logger.error("Failed to load products from exchange: %s", exc)
            if not self._product_cache:
                # Do not re-raise if we already have a stale cache; only if empty
                raise
