"""Root compatibility wrapper for DeltaClient."""
from app.exchange.delta_client import (
    DeltaClient,
    ExchangeError,
    ExchangeAuthError,
    ExchangeRateLimitError,
    ExchangeAPIError,
    ExchangeNetworkError,
)

__all__ = [
    "DeltaClient",
    "ExchangeError",
    "ExchangeAuthError",
    "ExchangeRateLimitError",
    "ExchangeAPIError",
    "ExchangeNetworkError",
]
