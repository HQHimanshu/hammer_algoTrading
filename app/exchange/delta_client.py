"""Delta Exchange REST API Client for Testnet.

Supports:
- Public market data queries (products, tickers, orderbook, candles)
- Authenticated account, position, and order management using HMAC-SHA256
- Strict rate-limit, timeout, and structured error handling
- Zero secret leakage in logs or exceptions
"""

import hashlib
import hmac
import json
import logging
import time
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("algopilot.exchange")


class ExchangeError(Exception):
    """Base exception for exchange communication errors."""


class ExchangeAuthError(ExchangeError):
    """Raised when API credentials or signatures are invalid."""


class ExchangeRateLimitError(ExchangeError):
    """Raised when rate limits are exceeded (HTTP 429)."""


class ExchangeAPIError(ExchangeError):
    """Raised when exchange returns an operational failure or bad schema."""

    def __init__(self, message: str, status_code: int, error_code: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.error_code = error_code


class ExchangeNetworkError(ExchangeError):
    """Raised when HTTP request times out or network connection fails."""


class DeltaClient:
    """Async client for Delta Exchange Testnet."""

    def __init__(
        self,
        base_url: str = "https://testnet-api.delta.exchange",
        api_key: str = "",
        api_secret: str = "",
        timeout: float = 10.0,
        client: Optional[httpx.AsyncClient] = None,
    ):
        clean_url = base_url.rstrip("/")
        if "testnet" not in clean_url.lower() and "demo" not in clean_url.lower():
            raise ValueError(
                f"SAFETY VIOLATION: '{clean_url}' does not appear to be a testnet or demo URL. "
                "DeltaClient only connects to Delta Exchange Testnet or Demo."
            )
        self.base_url = clean_url
        self.api_key = api_key.strip()
        self.api_secret = api_secret.strip()
        self.timeout = timeout
        self._client = client or httpx.AsyncClient(timeout=timeout)
        self._owns_client = client is None

    async def close(self) -> None:
        """Close underlying HTTP client if owned."""
        if self._owns_client and not self._client.is_closed:
            await self._client.aclose()

    def generate_signature(
        self,
        method: str,
        path: str,
        query_string: str = "",
        body: str = "",
        timestamp: Optional[str] = None,
    ) -> tuple[str, str]:
        """Generate HMAC-SHA256 signature for private endpoints.

        Returns (timestamp, signature).
        Prehash string: HTTP_METHOD + TIMESTAMP + REQUEST_PATH + QUERY_STRING + BODY
        """
        if not self.api_secret:
            raise ExchangeAuthError("Delta Exchange API Secret is not configured.")

        ts = timestamp or str(int(time.time()))
        # Ensure query string has leading '?' if not empty
        if query_string and not query_string.startswith("?"):
            query_string = f"?{query_string}"

        prehash = f"{method.upper()}{ts}{path}{query_string}{body}"
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            prehash.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return ts, signature

    def _build_auth_headers(
        self,
        method: str,
        path: str,
        query_string: str = "",
        body: str = "",
    ) -> Dict[str, str]:
        """Build headers required for authenticated endpoints."""
        if not self.api_key or not self.api_secret:
            raise ExchangeAuthError(
                "Authenticated request rejected: Delta API credentials are not configured."
            )

        ts, signature = self.generate_signature(method, path, query_string, body)
        return {
            "api-key": self.api_key,
            "timestamp": ts,
            "signature": signature,
            "User-Agent": "AlgoPilot-Testnet-Client",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        authenticated: bool = False,
    ) -> Dict[str, Any]:
        """Internal dispatch for HTTP requests."""
        url = f"{self.base_url}{path}"
        headers = {
            "User-Agent": "AlgoPilot-Testnet-Client",
            "Accept": "application/json",
        }

        # Format query string for signature verification if authenticated
        query_string = ""
        if params:
            # Sort params for deterministic signing if authenticated
            from urllib.parse import urlencode

            query_string = f"?{urlencode(sorted(params.items()))}"

        body_str = ""
        if data is not None:
            # Delta expects compact JSON with no extra whitespace
            body_str = json.dumps(data, separators=(",", ":"))
            headers["Content-Type"] = "application/json"

        if authenticated:
            auth_headers = self._build_auth_headers(method, path, query_string, body_str)
            headers.update(auth_headers)

        full_url = f"{url}{query_string}" if (authenticated and query_string) else url

        try:
            logger.debug("Dispatching %s to %s (authenticated=%s)", method, path, authenticated)
            response = await self._client.request(
                method=method,
                url=full_url if authenticated else url,
                params=None if authenticated else params,
                content=body_str.encode("utf-8") if data is not None else None,
                headers=headers,
            )
        except httpx.TimeoutException as exc:
            logger.error("Request timeout connecting to %s", path)
            raise ExchangeNetworkError(f"Exchange request timed out: {path}") from exc
        except httpx.RequestError as exc:
            logger.error("Network error communicating with exchange: %s", str(exc))
            raise ExchangeNetworkError(f"Network error: {str(exc)}") from exc

        return self._handle_response(response, path)

    def _handle_response(self, response: httpx.Response, path: str) -> Dict[str, Any]:
        """Validate response status and parse JSON safely."""
        status = response.status_code

        # Attempt to parse JSON payload
        try:
            payload = response.json()
        except Exception:
            payload = {"raw_text": response.text}

        if status == 200:
            return payload

        if status in (401, 403):
            err_msg = payload.get("error", "Unauthorized access or invalid API signature")
            logger.warning("Exchange authentication failed on %s: %s", path, err_msg)
            raise ExchangeAuthError(f"Exchange authentication failed: {err_msg}")

        if status == 429:
            logger.warning("Exchange rate limit reached on %s", path)
            raise ExchangeRateLimitError("Exchange rate limit exceeded. Please back off.")

        error_detail = payload.get("error", payload.get("message", response.text))
        error_code = None
        if isinstance(error_detail, dict):
            error_code = error_detail.get("code")
            error_detail = error_detail.get("context", {}).get("schema_errors", [{}])[0].get("message", str(error_detail))

        logger.error("Exchange API error on %s [HTTP %d]: %s", path, status, error_detail)
        raise ExchangeAPIError(
            f"Exchange returned error [HTTP {status}]: {error_detail}",
            status_code=status,
            error_code=error_code,
        )

    # Public Market Endpoints
    async def ping_health(self) -> tuple[bool, float]:
        """Test public exchange connectivity and measure round-trip latency in milliseconds."""
        start = time.perf_counter()
        try:
            # Query lightweight products or tickers endpoint
            resp = await self._request("GET", "/v2/tickers", params={"contract_types": "perpetual_futures"})
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            is_healthy = bool(resp.get("success", True))
            return is_healthy, latency_ms
        except Exception as exc:
            logger.warning("Exchange health ping failed: %s", exc)
            return False, 0.0

    async def get_products(self, contract_types: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch available trading instruments catalog."""
        params = {}
        if contract_types:
            params["contract_types"] = contract_types
        resp = await self._request("GET", "/v2/products", params=params)
        return resp.get("result", [])

    async def get_product_by_id(self, product_id: int) -> Dict[str, Any]:
        """Fetch details for a specific instrument ID."""
        resp = await self._request("GET", f"/v2/products/{product_id}")
        return resp.get("result", {})

    async def get_all_tickers(self, contract_types: Optional[str] = "perpetual_futures") -> List[Dict[str, Any]]:
        """Fetch all tickers or filtered by contract type."""
        params = {}
        if contract_types:
            params["contract_types"] = contract_types
        resp = await self._request("GET", "/v2/tickers", params=params)
        return resp.get("result", [])

    async def get_ticker(self, symbol: str) -> Dict[str, Any]:
        """Fetch real-time ticker quotes for a given symbol."""
        resp = await self._request("GET", f"/v2/tickers/{symbol}")
        result = resp.get("result")
        if not result:
            # Fallback search in all tickers if symbol endpoint is empty
            tickers = await self.get_all_tickers(contract_types=None)
            for t in tickers:
                if t.get("symbol") == symbol:
                    return t
            raise ExchangeAPIError(f"Ticker for symbol '{symbol}' not found", status_code=404)
        return result

    async def get_orderbook(self, symbol: str) -> Dict[str, Any]:
        """Fetch Level 2 Orderbook for a given symbol."""
        resp = await self._request("GET", f"/v2/l2orderbook/{symbol}")
        return resp.get("result", {})

    async def get_candles(
        self,
        symbol: str,
        resolution: str = "1m",
        start: Optional[int] = None,
        end: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch historical OHLC candles.

        Primary endpoint is Delta's /v2/chart/history with TradingView resolution mapping.
        Falls back to /v2/history/candles if needed.
        Returns a list of dicts: [{'time': int, 'open': float, 'high': float, 'low': float, 'close': float, 'volume': float}, ...]
        """
        now = int(time.time())
        end_time = end or now
        if start is not None:
            start_time = start
        elif limit is not None:
            res_seconds = 60
            r_str = str(resolution).lower()
            if r_str.endswith("m"):
                res_seconds = int(r_str[:-1]) * 60
            elif r_str.endswith("h"):
                res_seconds = int(r_str[:-1]) * 3600
            elif r_str.endswith("d"):
                res_seconds = int(r_str[:-1]) * 86400
            start_time = end_time - (res_seconds * limit)
        else:
            start_time = end_time - 7200

        # Map resolution to Delta Chart TradingView format (e.g., 1m -> '1', 5m -> '5', 1h -> '60', 1d -> 'D')
        chart_res = str(resolution).lower()
        if chart_res.endswith("m"):
            chart_res = chart_res[:-1]
        elif chart_res.endswith("h"):
            chart_res = str(int(chart_res[:-1]) * 60)
        elif chart_res.endswith("d"):
            chart_res = "D"

        try:
            chart_params = {
                "symbol": symbol,
                "resolution": chart_res,
                "from": start_time,
                "to": end_time,
            }
            resp = await self._request("GET", "/v2/chart/history", params=chart_params)
            res = resp.get("result", {})
            if isinstance(res, dict) and "t" in res and res["t"]:
                t_list = res.get("t", [])
                o_list = res.get("o", [])
                h_list = res.get("h", [])
                l_list = res.get("l", [])
                c_list = res.get("c", [])
                v_list = res.get("v", [])
                candles = []
                for i in range(len(t_list)):
                    candles.append({
                        "time": int(t_list[i]),
                        "open": float(o_list[i]) if i < len(o_list) else 0.0,
                        "high": float(h_list[i]) if i < len(h_list) else 0.0,
                        "low": float(l_list[i]) if i < len(l_list) else 0.0,
                        "close": float(c_list[i]) if i < len(c_list) else 0.0,
                        "volume": float(v_list[i]) if i < len(v_list) else 0.0,
                    })
                return candles
        except Exception as exc:
            logger.debug("Failed to fetch candles via /v2/chart/history: %s, falling back to /v2/history/candles", exc)

        # Fallback to /v2/history/candles
        params = {
            "symbol": symbol,
            "resolution": resolution,
            "start": start_time,
            "end": end_time,
        }
        resp = await self._request("GET", "/v2/history/candles", params=params)
        return resp.get("result", [])

    # Authenticated Endpoints
    async def get_balances(self) -> List[Dict[str, Any]]:
        """Fetch wallet balances for authenticated account."""
        resp = await self._request("GET", "/v2/wallet/balances", authenticated=True)
        return resp.get("result", [])

    async def get_positions(self) -> List[Dict[str, Any]]:
        """Fetch open margined positions."""
        resp = await self._request("GET", "/v2/positions/margined", authenticated=True)
        return resp.get("result", [])

    async def get_orders(
        self,
        states: Optional[str] = "pending,open",
        product_ids: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Fetch orders by state and product."""
        params: Dict[str, Any] = {}
        if states:
            params["states"] = states
        if product_ids:
            params["product_ids"] = product_ids
        resp = await self._request("GET", "/v2/orders", params=params, authenticated=True)
        return resp.get("result", [])

    async def place_order(
        self,
        product_id: int,
        size: float,
        side: str,
        order_type: str = "market",
        price: Optional[float] = None,
        client_order_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Submit an order to Delta Exchange Testnet.

        Order parameters:
        - product_id: Delta instrument ID
        - size: contracts/quantity
        - side: 'buy' or 'sell'
        - order_type: 'market' or 'limit'
        - price: required if order_type is limit
        - client_order_id: idempotency identifier
        """
        ot = order_type.lower()
        if ot == "limit":
            ot = "limit_order"
        elif ot == "market":
            ot = "market_order"

        payload: Dict[str, Any] = {
            "product_id": int(product_id),
            "size": int(size) if float(size).is_integer() else size,
            "side": side.lower(),
            "order_type": ot,
        }
        if "limit" in ot:
            if price is None:
                raise ValueError("Limit orders require a valid price.")
            payload["limit_price"] = str(price)

        if client_order_id:
            payload["client_order_id"] = client_order_id

        logger.info(
            "Placing %s %s order on product %d (size=%s, client_order_id=%s)",
            order_type,
            side,
            product_id,
            size,
            client_order_id,
        )
        resp = await self._request("POST", "/v2/orders", data=payload, authenticated=True)
        return resp.get("result", resp)

    async def cancel_order(
        self,
        product_id: int,
        order_id: Optional[str] = None,
        client_order_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Cancel an open or pending order."""
        payload: Dict[str, Any] = {"product_id": int(product_id)}
        if order_id:
            payload["id"] = int(order_id) if str(order_id).isdigit() else order_id
        if client_order_id:
            payload["client_order_id"] = client_order_id

        resp = await self._request("DELETE", "/v2/orders", data=payload, authenticated=True)
        return resp.get("result", resp)
