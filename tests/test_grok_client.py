"""Tests for official xAI Grok API client and LLM provider."""

import json
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from app.config import Settings
from app.services.ai.grok_client import GrokAPIError, GrokClient
from app.services.ai.llm_provider import GrokLLMProvider, get_llm_provider


@pytest.mark.asyncio
async def test_grok_client_success():
    """Verify Grok client parses chat completion responses correctly."""
    mock_response = httpx.Response(
        status_code=200,
        content=json.dumps({
            "id": "chatcmpl-test-123",
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": "The strategy generated a BUY signal after the EMA crossover.",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 50, "completion_tokens": 15, "total_tokens": 65},
        }).encode(),
        request=httpx.Request("POST", "https://api.x.ai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        client = GrokClient(api_key="xai-test-key-12345", model="grok-2-latest")
        result = await client.generate_chat_completion(
            prompt="Why did trade TRD-1042 enter?",
            system_instruction="You are TradeMind AI.",
        )

        assert "The strategy generated a BUY signal" in result
        mock_post.assert_called_once()
        # Verify Bearer token authorization header
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["headers"]["Authorization"] == "Bearer xai-test-key-12345"


@pytest.mark.asyncio
async def test_grok_client_missing_api_key():
    """Missing or empty API key raises ValueError immediately upon client initialization."""
    with pytest.raises(ValueError, match="xAI API key"):
        GrokClient(api_key="")


@pytest.mark.asyncio
async def test_grok_client_unauthorized_401():
    """401 responses raise GrokAPIError with credential check notification."""
    mock_response = httpx.Response(
        status_code=401,
        content=b'{"error": {"message": "Incorrect API key provided"}}',
        request=httpx.Request("POST", "https://api.x.ai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GrokClient(api_key="invalid-key")

        with pytest.raises(GrokAPIError, match="xAI Grok authentication failed"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_grok_client_rate_limit_429():
    """429 responses raise GrokAPIError with rate limit detail."""
    mock_response = httpx.Response(
        status_code=429,
        content=b'{"error": {"message": "Rate limit reached"}}',
        request=httpx.Request("POST", "https://api.x.ai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GrokClient(api_key="test-key")

        with pytest.raises(GrokAPIError, match="xAI Grok rate limit exceeded"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_grok_client_server_error_500():
    """500 responses raise GrokAPIError indicating provider outage."""
    mock_response = httpx.Response(
        status_code=500,
        content=b'{"error": {"message": "Internal Server Error"}}',
        request=httpx.Request("POST", "https://api.x.ai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GrokClient(api_key="test-key")

        with pytest.raises(GrokAPIError, match="xAI Grok API returned HTTP 500"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_grok_client_timeout():
    """Request timeouts are wrapped in GrokAPIError."""
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Connection timed out")
        client = GrokClient(api_key="test-key")

        with pytest.raises(GrokAPIError, match="timed out"):
            await client.generate_chat_completion(prompt="Hello")


def test_grok_client_secret_masking():
    """Secret API key is never revealed in string representations."""
    client = GrokClient(api_key="xai-very-secret-key-123456789")
    repr_str = repr(client)
    assert "xai-very-secret-key-123456789" not in repr_str
    assert "xai-***6789" in repr_str


@pytest.mark.asyncio
async def test_grok_llm_provider_factory():
    """Verify get_llm_provider instantiates GrokLLMProvider when configured."""
    settings = Settings(
        AI_PROVIDER="grok",
        XAI_API_KEY="xai-test-key",
        XAI_MODEL="grok-2-latest",
    )
    provider = get_llm_provider(settings)
    assert isinstance(provider, GrokLLMProvider)
    assert provider.model_name == "grok-2-latest"
