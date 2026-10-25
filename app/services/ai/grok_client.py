"""Official xAI Grok API client for TradeMind AI.

Supports official xAI Grok endpoints at https://api.x.ai/v1 with
asynchronous HTTPX dispatch, low-temperature grounding, timeouts,
rate-limit resilience, and strict secret masking.
"""

import json
import logging
from typing import Any, Dict, List, Optional
import httpx
from app.config import Settings

logger = logging.getLogger("algopilot.ai.grok")


class GrokAPIError(Exception):
    """Raised when Grok API request fails or returns an error response."""

    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class GrokClient:
    """Async client for official xAI Grok API."""

    def __init__(
        self,
        api_key: str,
        model: str = "grok-2-latest",
        base_url: str = "https://api.x.ai/v1",
        timeout_seconds: float = 60.0,
        max_output_tokens: int = 1000,
    ):
        if not api_key or not api_key.strip():
            raise ValueError("xAI API key (XAI_API_KEY) must be provided for Grok client.")
        self.api_key = api_key.strip()
        self.model = model.strip() or "grok-2-latest"
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.max_output_tokens = max_output_tokens

    @property
    def masked_key(self) -> str:
        """Safe masked representation of API key."""
        if len(self.api_key) <= 8:
            return "***"
        return f"{self.api_key[:4]}***{self.api_key[-4:]}"

    def __repr__(self) -> str:
        return f"<GrokClient model='{self.model}' base_url='{self.base_url}' api_key='{self.masked_key}'>"

    def _build_headers(self) -> Dict[str, str]:
        """Construct authorization and content headers with secret safety."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "TradeMindAI-GrokClient/1.0",
        }

    async def generate_chat_completion(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
    ) -> str:
        """Send chat completion request to xAI Grok endpoint."""
        url = f"{self.base_url}/chat/completions"

        messages: List[Dict[str, str]] = []
        if system_instruction and system_instruction.strip():
            messages.append({"role": "system", "content": system_instruction.strip()})
        messages.append({"role": "user", "content": prompt.strip()})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": self.max_output_tokens,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=self._build_headers())

                if response.status_code == 401 or response.status_code == 403:
                    logger.error("xAI Grok API authentication failure (HTTP %d)", response.status_code)
                    raise GrokAPIError("xAI Grok authentication failed: Invalid or expired API key.", status_code=response.status_code)

                if response.status_code == 429:
                    logger.warning("xAI Grok API rate limit exceeded (HTTP 429)")
                    raise GrokAPIError("xAI Grok rate limit exceeded. Please retry after backoff.", status_code=429)

                if response.status_code != 200:
                    logger.error("xAI Grok API error (%d): %s", response.status_code, response.text)
                    raise GrokAPIError(
                        f"xAI Grok API returned HTTP {response.status_code}: {response.text}",
                        status_code=response.status_code,
                        response_body=response.text,
                    )

                data = response.json()
                choices = data.get("choices", [])
                if not choices:
                    raise GrokAPIError("Empty choices returned by Grok API.", status_code=200)

                message = choices[0].get("message", {})
                content = message.get("content", "")
                if not content:
                    raise GrokAPIError("Empty content returned in Grok response message.", status_code=200)

                return content.strip()

        except httpx.TimeoutException as exc:
            logger.error("xAI Grok request timed out after %.1fs", self.timeout_seconds)
            raise GrokAPIError(f"xAI Grok request timed out after {self.timeout_seconds}s") from exc
        except httpx.RequestError as exc:
            logger.error("xAI Grok network connection error: %s", str(exc))
            raise GrokAPIError(f"xAI Grok network connection error: {str(exc)}") from exc
