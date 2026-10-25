"""Tests for official GroqCloud API client and LLM provider."""

import json
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from app.config import Settings
from app.services.ai.groq_client import GroqAPIError, GroqClient
from app.services.ai.llm_provider import GroqLLMProvider, get_llm_provider


@pytest.mark.asyncio
async def test_groq_client_success():
    """Verify Groq client parses chat completion responses correctly."""
    mock_response = httpx.Response(
        status_code=200,
        content=json.dumps({
            "id": "chatcmpl-test-groq-123",
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
            "usage": {"prompt_tokens": 40, "completion_tokens": 14, "total_tokens": 54},
        }).encode(),
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response

        client = GroqClient(api_key="gsk_test_groq_key_12345", model="llama-3.3-70b-versatile")
        result = await client.generate_chat_completion(
            prompt="Why did trade TRD-1042 enter?",
            system_instruction="You are TradeMind AI.",
        )

        assert "The strategy generated a BUY signal" in result
        mock_post.assert_called_once()
        # Verify Bearer token authorization header
        call_kwargs = mock_post.call_args.kwargs
        assert call_kwargs["headers"]["Authorization"] == "Bearer gsk_test_groq_key_12345"


@pytest.mark.asyncio
async def test_groq_client_missing_api_key():
    """Missing or empty API key raises ValueError immediately upon client initialization."""
    with pytest.raises(ValueError, match="Groq API key"):
        GroqClient(api_key="")


@pytest.mark.asyncio
async def test_groq_client_unauthorized_401():
    """401 responses raise GroqAPIError with credential check notification."""
    mock_response = httpx.Response(
        status_code=401,
        content=b'{"error": {"message": "Invalid API Key"}}',
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GroqClient(api_key="gsk_invalid_key")

        with pytest.raises(GroqAPIError, match="Groq authentication failed"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_groq_client_rate_limit_429():
    """429 responses raise GroqAPIError with rate limit detail."""
    mock_response = httpx.Response(
        status_code=429,
        content=b'{"error": {"message": "Rate limit exceeded"}}',
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GroqClient(api_key="gsk_test_key")

        with pytest.raises(GroqAPIError, match="Groq rate limit exceeded"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_groq_client_server_error_500():
    """500 responses raise GroqAPIError indicating provider outage."""
    mock_response = httpx.Response(
        status_code=500,
        content=b'{"error": {"message": "Internal Server Error"}}',
        request=httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions"),
    )

    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        client = GroqClient(api_key="gsk_test_key")

        with pytest.raises(GroqAPIError, match="Groq API returned HTTP 500"):
            await client.generate_chat_completion(prompt="Hello")


@pytest.mark.asyncio
async def test_groq_client_timeout():
    """Request timeouts are wrapped in GroqAPIError."""
    with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = httpx.TimeoutException("Connection timed out")
        client = GroqClient(api_key="gsk_test_key")

        with pytest.raises(GroqAPIError, match="timed out"):
            await client.generate_chat_completion(prompt="Hello")


def test_groq_client_secret_masking():
    """Secret API key is never revealed in string representations."""
    client = GroqClient(api_key="gsk_very_secret_key_123456789")
    repr_str = repr(client)
    assert "gsk_very_secret_key_123456789" not in repr_str
    assert "gsk_***6789" in repr_str


@pytest.mark.asyncio
async def test_groq_llm_provider_factory():
    """Verify get_llm_provider instantiates GroqLLMProvider when configured."""
    settings = Settings(
        AI_PROVIDER="groq",
        GROQ_API_KEY="gsk_test_key",
        GROQ_MODEL="llama-3.3-70b-versatile",
    )
    provider = get_llm_provider(settings)
    assert isinstance(provider, GroqLLMProvider)
    assert provider.model_name == "llama-3.3-70b-versatile"
