"""Market Data Streamer and WebSocket Dispatcher for Delta Exchange Demo.

Connects to Delta Exchange Demo / Testnet public WebSocket feeds,
normalizes incoming candle and ticker ticks, handles automatic reconnects
with exponential backoff, falls back to REST polling if needed, and
broadcasts normalized frames to connected frontend browser clients.
"""

import asyncio
import json
import logging
import random
import time
from typing import Any, Dict, List, Optional, Set
from fastapi import WebSocket, WebSocketDisconnect
from app.config import Settings
from app.services.market_service import MarketService

logger = logging.getLogger("algopilot.market_streamer")


class MarketStreamer:
    """Coordinates upstream Delta demo market data streaming and frontend client dispatch."""

    def __init__(self, settings: Settings, market_service: MarketService):
        self.settings = settings
        self.market_service = market_service
        self.symbol = settings.DEFAULT_TRADING_SYMBOL
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._rest_fallback_task: Optional[asyncio.Task] = None

        # Connected frontend browser WebSocket clients
        self._connected_clients: Set[WebSocket] = set()
        self._client_lock = asyncio.Lock()

        # Connection telemetry
        self.status: str = "INITIALIZING"
        self.last_update_time: Optional[float] = None
        self.last_update_iso: Optional[str] = None
        self.data_source: str = "uninitialized"
        self.last_error: Optional[str] = None
        self.update_count: int = 0

        # Latest cached frames
        self.latest_candle: Optional[Dict[str, Any]] = None
        self.latest_ticker: Optional[Dict[str, Any]] = None

    @property
    def is_connected(self) -> bool:
        return self.status in ("CONNECTED", "LIVE_STREAMING")

    def get_status_summary(self) -> Dict[str, Any]:
        """Return structured telemetry for /api/market/status."""
        return {
            "exchange_environment": "Delta Exchange Demo / Testnet",
            "base_url": self.settings.DELTA_BASE_URL,
            "ws_url": self._resolve_ws_url(),
            "selected_contract": self.symbol,
            "connection_status": self.status,
            "data_source": self.data_source,
            "last_successful_update": self.last_update_iso,
            "updates_received_count": self.update_count,
            "active_frontend_clients": len(self._connected_clients),
            "last_error": self.last_error,
            "latest_price": self.latest_ticker.get("mark_price") if self.latest_ticker else (
                self.latest_candle.get("close") if self.latest_candle else None
            ),
        }

    def _resolve_ws_url(self) -> str:
        """Resolve public WebSocket URL based on configured base URL."""
        custom_ws = getattr(self.settings, "DELTA_WS_URL", None)
        if custom_ws:
            return custom_ws

        base = self.settings.DELTA_BASE_URL.lower()
        if "deltaex.org" in base:
            return "wss://socket-ind-pub.testnet.deltaex.org"
        elif "testnet-api.delta.exchange" in base or "testnet" in base:
            # Both endpoints are valid testnet feeds; testnet-socket serves Global Testnet
            return "wss://testnet-socket.delta.exchange"
        return "wss://socket-ind-pub.testnet.deltaex.org"

    async def register_client(self, websocket: WebSocket) -> None:
        """Register a new frontend browser WebSocket client."""
        await websocket.accept()
        async with self._client_lock:
            self._connected_clients.add(websocket)
            logger.info("Frontend WebSocket client connected. Total clients: %d", len(self._connected_clients))

        # Immediately send snapshot of current status, latest ticker and candle
        snapshot = {
            "type": "snapshot",
            "status": self.status,
            "symbol": self.symbol,
            "data_source": self.data_source,
            "ticker": self.latest_ticker,
            "candle": self.latest_candle,
            "timestamp": int(time.time()),
        }
        try:
            await websocket.send_text(json.dumps(snapshot))
        except Exception:
            pass

    async def unregister_client(self, websocket: WebSocket) -> None:
        """Unregister a disconnected frontend browser WebSocket client."""
        async with self._client_lock:
            self._connected_clients.discard(websocket)
            logger.info("Frontend WebSocket client disconnected. Remaining clients: %d", len(self._connected_clients))

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        """Broadcast normalized market frame to all connected frontend clients."""
        if not self._connected_clients:
            return

        message = json.dumps(payload)
        stale_clients = []
        async with self._client_lock:
            for client in list(self._connected_clients):
                try:
                    await client.send_text(message)
                except (WebSocketDisconnect, RuntimeError):
                    stale_clients.append(client)
                except Exception as exc:
                    logger.debug("Error broadcasting to client: %s", exc)
                    stale_clients.append(client)

            for stale in stale_clients:
                self._connected_clients.discard(stale)

    async def start(self) -> None:
        """Start upstream streaming loop in background."""
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._run_streamer_loop())
        logger.info("Market streamer started for symbol %s", self.symbol)

    async def stop(self) -> None:
        """Stop streamer loop and disconnect all clients."""
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        if self._rest_fallback_task and not self._rest_fallback_task.done():
            self._rest_fallback_task.cancel()

        async with self._client_lock:
            for client in list(self._connected_clients):
                try:
                    await client.close()
                except Exception:
                    pass
            self._connected_clients.clear()

        self.status = "STOPPED"
        logger.info("Market streamer stopped cleanly.")

    async def _run_streamer_loop(self) -> None:
        """Main resilient upstream loop with exponential backoff and REST fallback."""
        import websockets

        backoff = 1.0
        max_backoff = 30.0

        while self._running:
            ws_url = self._resolve_ws_url()
            symbols_to_subscribe = [self.symbol]
            # If symbol is BTCUSDT, also check if BTCUSD is needed or vice versa
            alt_sym = "BTCUSD" if "USDT" in self.symbol else "BTCUSDT"
            if alt_sym not in symbols_to_subscribe:
                symbols_to_subscribe.append(alt_sym)

            try:
                self.status = "CONNECTING"
                logger.info("Connecting upstream to Delta demo WebSocket: %s", ws_url)
                
                async with websockets.connect(
                    ws_url,
                    ping_interval=25,
                    ping_timeout=15,
                    close_timeout=5,
                ) as ws:
                    self.status = "CONNECTED"
                    self.data_source = "delta_demo_websocket"
                    self.last_error = None
                    backoff = 1.0  # Reset backoff on successful handshake
                    logger.info("Connected upstream to %s. Subscribing to %s...", ws_url, symbols_to_subscribe)

                    # Stop REST fallback if running
                    self._stop_rest_fallback()

                    # Subscribe to ticker and candlestick channels
                    ticker_channel = "ticker" if "deltaex.org" in ws_url else "v2/ticker"
                    sub_payload = {
                        "type": "subscribe",
                        "payload": {
                            "channels": [
                                {"name": ticker_channel, "symbols": symbols_to_subscribe},
                                {"name": "candlestick_1m", "symbols": symbols_to_subscribe},
                            ]
                        },
                    }
                    await ws.send(json.dumps(sub_payload))

                    while self._running:
                        try:
                            msg = await asyncio.wait_for(ws.recv(), timeout=5.0)
                            await self._handle_upstream_message(msg)
                        except asyncio.TimeoutError:
                            # Periodic heartbeat refresh: poll live ticker so frontend stays fresh
                            try:
                                t = await self.market_service.get_ticker(self.symbol)
                                now_ts = int(time.time())
                                now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts))
                                norm_t = {
                                    "type": "ticker_update",
                                    "symbol": t.symbol,
                                    "mark_price": t.mark_price,
                                    "spot_price": t.spot_price,
                                    "best_bid": t.best_bid,
                                    "best_ask": t.best_ask,
                                    "bid_size": t.bid_size,
                                    "ask_size": t.ask_size,
                                    "timestamp": now_ts,
                                    "source": "delta_demo_websocket_heartbeat",
                                }
                                self.latest_ticker = norm_t
                                self.last_update_time = now_ts
                                self.last_update_iso = now_iso
                                self.update_count += 1
                                await self.broadcast(norm_t)

                                # Send WS ping to keep connection healthy
                                pong_waiter = await ws.ping()
                                await asyncio.wait_for(pong_waiter, timeout=5.0)
                            except Exception as ping_exc:
                                logger.debug("Periodic heartbeat tick note: %s", ping_exc)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                self.last_error = str(exc)
                logger.warning("Upstream WebSocket error (%s): %s. Reconnecting in %.1fs...", ws_url, exc, backoff)
                self.status = "RECONNECTING"
                
                # Start REST fallback so frontend continues receiving live data
                self._ensure_rest_fallback()

                await asyncio.sleep(backoff + random.uniform(0.1, 0.5))
                backoff = min(backoff * 1.5, max_backoff)

    def _ensure_rest_fallback(self) -> None:
        """Start background REST polling fallback when WebSocket is down."""
        if self._rest_fallback_task is None or self._rest_fallback_task.done():
            self._rest_fallback_task = asyncio.create_task(self._run_rest_fallback_loop())

    def _stop_rest_fallback(self) -> None:
        """Stop background REST polling fallback when WebSocket is healthy."""
        if self._rest_fallback_task and not self._rest_fallback_task.done():
            self._rest_fallback_task.cancel()
            self._rest_fallback_task = None

    async def _run_rest_fallback_loop(self) -> None:
        """Polls REST endpoints every 3 seconds to keep chart and ticker active during WS outages."""
        logger.info("Starting REST market data fallback polling loop (3s interval)...")
        while self._running and self.status != "CONNECTED":
            try:
                # 1. Fetch latest ticker
                ticker = await self.market_service.get_ticker(self.symbol)
                now_ts = int(time.time())
                now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts))

                norm_ticker = {
                    "type": "ticker_update",
                    "symbol": ticker.symbol,
                    "mark_price": ticker.mark_price,
                    "spot_price": ticker.spot_price,
                    "best_bid": ticker.best_bid,
                    "best_ask": ticker.best_ask,
                    "bid_size": ticker.bid_size,
                    "ask_size": ticker.ask_size,
                    "timestamp": now_ts,
                    "source": "delta_demo_rest_fallback",
                }
                self.latest_ticker = norm_ticker
                self.last_update_time = now_ts
                self.last_update_iso = now_iso
                self.data_source = "delta_demo_rest_fallback"
                self.update_count += 1
                await self.broadcast(norm_ticker)

                # 2. Fetch latest candle
                candles = await self.market_service.get_candles(self.symbol, resolution="1m", limit=3)
                if candles:
                    last = candles[-1]
                    norm_candle = {
                        "type": "candle_update",
                        "symbol": self.symbol,
                        "timestamp": int(last.time),
                        "open": float(last.open),
                        "high": float(last.high),
                        "low": float(last.low),
                        "close": float(last.close),
                        "volume": float(last.volume),
                        "source": "delta_demo_rest_fallback",
                        "is_closed": False,
                    }
                    self.latest_candle = norm_candle
                    await self.broadcast(norm_candle)

            except Exception as exc:
                logger.debug("REST fallback poll error: %s", exc)

            await asyncio.sleep(3.0)

    async def _handle_upstream_message(self, raw_msg: str) -> None:
        """Parse, validate, and normalize upstream Delta message."""
        try:
            data = json.loads(raw_msg)
        except Exception:
            return

        msg_type = data.get("type", "")
        if msg_type == "subscriptions":
            logger.info("Upstream subscription confirmed: %s", data.get("channels"))
            return
        if msg_type == "error":
            logger.warning("Upstream Delta WebSocket warning: %s", data.get("message"))
            return

        now_ts = int(time.time())
        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now_ts))

        # Case 1: Candlestick Frame
        if "candlestick" in msg_type or data.get("channel", "").startswith("candlestick"):
            candle = self._normalize_candle(data)
            if candle:
                self.latest_candle = candle
                self.last_update_time = now_ts
                self.last_update_iso = now_iso
                self.data_source = "delta_demo_websocket"
                self.update_count += 1
                await self.broadcast(candle)
            return

        # Case 2: Ticker Frame
        if msg_type == "ticker" or "ticker" in data.get("channel", ""):
            ticker = self._normalize_ticker(data)
            if ticker:
                self.latest_ticker = ticker
                self.last_update_time = now_ts
                self.last_update_iso = now_iso
                self.data_source = "delta_demo_websocket"
                self.update_count += 1
                await self.broadcast(ticker)
            return

    def _normalize_candle(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize candle into standard Phase C3 schema."""
        try:
            # Handle India Demo format: {"c":80238.0,"cst":1792925820000000,"h":80242.0,"l":80217.5,"o":80222.0,"res":"1m","sy":"BTCUSD","ts":1792925840424933,"v":978.0}
            if "c" in data and "o" in data:
                open_val = float(data["o"])
                high_val = float(data["h"])
                low_val = float(data["l"])
                close_val = float(data["c"])
                vol_val = float(data.get("v", 0.0))
                sym = data.get("sy", self.symbol)
                raw_ts = data.get("cst") or data.get("ts") or time.time()
            # Handle Global Testnet format: {"close":81569.0,"high":81569.0,"low":81569.0,"open":81569.0,"timestamp":1792925760001275,"symbol":"BTCUSDT","volume":0.0}
            elif "close" in data and "open" in data:
                open_val = float(data["open"])
                high_val = float(data["high"])
                low_val = float(data["low"])
                close_val = float(data["close"])
                vol_val = float(data.get("volume", 0.0))
                sym = data.get("symbol", self.symbol)
                raw_ts = data.get("timestamp") or time.time()
            else:
                return None

            # Timestamp normalization (microseconds -> seconds)
            raw_ts = float(raw_ts)
            if raw_ts > 1e14:
                ts_sec = int(raw_ts / 1_000_000)
            elif raw_ts > 1e11:
                ts_sec = int(raw_ts / 1_000)
            else:
                ts_sec = int(raw_ts)

            # Sanity validation
            high_val = max(high_val, open_val, close_val)
            low_val = min(low_val, open_val, close_val)

            return {
                "type": "candle_update",
                "symbol": sym,
                "timestamp": ts_sec,
                "open": open_val,
                "high": high_val,
                "low": low_val,
                "close": close_val,
                "volume": vol_val,
                "source": "delta_demo",
                "is_closed": False,
            }
        except Exception as exc:
            logger.debug("Failed to normalize candle frame %s: %s", data, exc)
            return None

    def _normalize_ticker(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Normalize ticker frame into standard schema."""
        try:
            # India Demo format: {"d":[{"i":84,"m":"80234.42","m24hc":"-0.5","ohlc":[...],"q":["80230.5","1811","80226.5","3790"],"s":"BTCUSD"}],"sp":"80256.9","sy":"BTCUSD","ts":1792925835358732}
            if "d" in data and isinstance(data["d"], list) and len(data["d"]) > 0:
                first_d = data["d"][0]
                mark_price = float(first_d["m"]) if first_d.get("m") else None
                spot_price = float(data["sp"]) if data.get("sp") else mark_price
                sym = first_d.get("s") or data.get("sy", self.symbol)
                
                quotes = first_d.get("q", [])
                best_ask = float(quotes[0]) if len(quotes) > 0 and quotes[0] else None
                ask_size = float(quotes[1]) if len(quotes) > 1 and quotes[1] else None
                best_bid = float(quotes[2]) if len(quotes) > 2 and quotes[2] else None
                bid_size = float(quotes[3]) if len(quotes) > 3 and quotes[3] else None
                
                ohlc = first_d.get("ohlc", [])
                vol_24h = None
                if "to" in first_d and isinstance(first_d["to"], list) and len(first_d["to"]) > 0:
                    vol_24h = float(first_d["to"][0])

                raw_ts = float(data.get("ts", time.time()))
            elif "mark_price" in data:
                mark_price = float(data["mark_price"])
                spot_price = float(data.get("spot_price") or mark_price)
                sym = data.get("symbol", self.symbol)
                quotes = data.get("quotes") or {}
                best_bid = float(quotes["best_bid"]) if quotes.get("best_bid") else (float(data["best_bid"]) if data.get("best_bid") else None)
                best_ask = float(quotes["best_ask"]) if quotes.get("best_ask") else (float(data["best_ask"]) if data.get("best_ask") else None)
                bid_size = float(quotes["bid_size"]) if quotes.get("bid_size") else (float(data["bid_size"]) if data.get("bid_size") else None)
                ask_size = float(quotes["ask_size"]) if quotes.get("ask_size") else (float(data["ask_size"]) if data.get("ask_size") else None)
                vol_24h = float(data["volume_24h"]) if data.get("volume_24h") else None
                raw_ts = float(data.get("timestamp", time.time()))
            else:
                return None

            if raw_ts > 1e14:
                ts_sec = int(raw_ts / 1_000_000)
            elif raw_ts > 1e11:
                ts_sec = int(raw_ts / 1_000)
            else:
                ts_sec = int(raw_ts)

            return {
                "type": "ticker_update",
                "symbol": sym,
                "mark_price": mark_price,
                "spot_price": spot_price,
                "best_bid": best_bid,
                "best_ask": best_ask,
                "bid_size": bid_size,
                "ask_size": ask_size,
                "volume_24h": vol_24h,
                "timestamp": ts_sec,
                "source": "delta_demo",
            }
        except Exception as exc:
            logger.debug("Failed to normalize ticker frame %s: %s", data, exc)
            return None
