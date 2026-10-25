"""Unit tests for DeltaClient authentication, signing, and response handling."""

import hashlib
import hmac
import pytest
import httpx
from app.exchange.delta_client import (
    DeltaClient,
    ExchangeAuthError,
    ExchangeRateLimitError,
    ExchangeAPIError,
    ExchangeNetworkError,
)


def test_signature_generation():
    """Verify HMAC-SHA256 signature computation matches expected cryptographic hash."""
    api_key = "test_key_abc"
    api_secret = "secret_xyz"
    client = DeltaClient(
        base_url="https://testnet-api.delta.exchange",
        api_key=api_key,
        api_secret=api_secret,
    )

    method = "GET"
    path = "/v2/orders"
    query_string = "?states=pending"
    body = ""
    timestamp = "1700000000"

    ts, signature = client.generate_signature(
        method=method,
        path=path,
        query_string=query_string,
        body=body,
        timestamp=timestamp,
    )

    assert ts == "1700000000"

    # Manually compute expected signature
    prehash = f"{method}{timestamp}{path}{query_string}{body}"
    expected_sig = hmac.new(
        api_secret.encode("utf-8"),
        prehash.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    assert signature == expected_sig


def test_missing_credentials_raises_auth_error():
    """Missing secret must raise ExchangeAuthError before attempting signature."""
    client = DeltaClient(
        base_url="https://testnet-api.delta.exchange",
        api_key="only_key",
        api_secret="",
    )

    with pytest.raises(ExchangeAuthError):
        client.generate_signature("GET", "/v2/wallet/balances")


def test_response_handling_success():
    """HTTP 200 parses payload correctly."""
    client = DeltaClient()
    mock_resp = httpx.Response(
        status_code=200,
        json={"success": True, "result": [{"id": 1, "symbol": "BTCUSDT"}]},
        request=httpx.Request("GET", "http://test"),
    )
    result = client._handle_response(mock_resp, "/v2/products")
    assert result["success"] is True
    assert len(result["result"]) == 1


def test_response_handling_unauthorized():
    """HTTP 401 raises ExchangeAuthError."""
    client = DeltaClient()
    mock_resp = httpx.Response(
        status_code=401,
        json={"error": "invalid_api_key", "success": False},
        request=httpx.Request("GET", "http://test"),
    )
    with pytest.raises(ExchangeAuthError) as exc_info:
        client._handle_response(mock_resp, "/v2/orders")
    assert "Exchange authentication failed" in str(exc_info.value)


def test_response_handling_rate_limit():
    """HTTP 429 raises ExchangeRateLimitError."""
    client = DeltaClient()
    mock_resp = httpx.Response(
        status_code=429,
        json={"error": "rate_limit_exceeded", "success": False},
        request=httpx.Request("GET", "http://test"),
    )
    with pytest.raises(ExchangeRateLimitError):
        client._handle_response(mock_resp, "/v2/orders")


def test_response_handling_api_error():
    """HTTP 400 or 500 raises ExchangeAPIError with structured status."""
    client = DeltaClient()
    mock_resp = httpx.Response(
        status_code=400,
        json={"error": {"code": "bad_schema", "context": {"schema_errors": [{"message": "invalid size"}]}}, "success": False},
        request=httpx.Request("POST", "http://test"),
    )
    with pytest.raises(ExchangeAPIError) as exc_info:
        client._handle_response(mock_resp, "/v2/orders")
    assert exc_info.value.status_code == 400
    assert "invalid size" in str(exc_info.value)
