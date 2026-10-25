"""Async client for official GroqCloud API.

Endpoints: https://api.groq.com/openai/v1/chat/completions
Documentation: https://console.groq.com/docs/api-reference
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("algopilot.ai.groq")


class GroqAPIError(Exception):
    """Raised when Groq API encounters an authentication, rate-limit, or response failure."""

    def __init__(self, message: str, status_code: Optional[int] = None, response_body: Optional[str] = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_body = response_body


class GroqClient:
    """Async client for official GroqCloud API."""

    def __init__(
        self,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        base_url: str = "https://api.groq.com/openai/v1",
        timeout_seconds: float = 30.0,
        max_output_tokens: int = 1000,
    ):
        if not api_key or not api_key.strip():
            raise ValueError("Groq API key (GROQ_API_KEY) must be provided for Groq client.")
        self.api_key = api_key.strip()
        self.model = model.strip() or "llama-3.3-70b-versatile"
        self.base_url = base_url.rstrip("/")
        self.timeout_seconds = timeout_seconds
        self.max_output_tokens = max_output_tokens

    @property
    def masked_key(self) -> str:
        """Safe masked representation of Groq API key."""
        if len(self.api_key) <= 8:
            return "***"
        return f"{self.api_key[:4]}***{self.api_key[-4:]}"

    def __repr__(self) -> str:
        return f"<GroqClient model='{self.model}' base_url='{self.base_url}' api_key='{self.masked_key}'>"

    def _build_headers(self) -> Dict[str, str]:
        """Construct authorization and content headers with secret safety."""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "TradeMindAI-GroqClient/1.0",
        }

    async def generate_chat_completion(
        self,
        prompt: str,
        system_instruction: str = "",
        temperature: float = 0.2,
    ) -> str:
        """Send chat completion request to GroqCloud endpoint."""
        url = f"{self.base_url}/chat/completions"

        messages: List[Dict[str, str]] = []
        if system_instruction.strip():
            messages.append({"role": "system", "content": system_instruction.strip()})
        messages.append({"role": "user", "content": prompt.strip()})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": self.max_output_tokens,
        }

        headers = self._build_headers()

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 200:
                    data = response.json()
                    choices = data.get("choices", [])
                    if not choices:
                        raise GroqAPIError("Groq returned empty choices list in response.", status_code=200)

                    message = choices[0].get("message", {})
                    content = message.get("content", "")
                    if not content:
                        raise GroqAPIError("Groq response choice contained empty message content.", status_code=200)

                    return content

                if response.status_code == 401:
                    logger.error("Groq API authentication failure (HTTP 401)")
                    raise GroqAPIError(
                        "Groq authentication failed: Invalid or expired API key.",
                        status_code=401,
                        response_body=response.text,
                    )

                if response.status_code == 429:
                    logger.warning("Groq API rate limit exceeded (HTTP 429)")
                    raise GroqAPIError(
                        "Groq rate limit exceeded. Please retry after backoff.",
                        status_code=429,
                        response_body=response.text,
                    )

                logger.error("Groq API error (%d): %s", response.status_code, response.text)
                raise GroqAPIError(
                    f"Groq API returned HTTP {response.status_code}: {response.text}",
                    status_code=response.status_code,
                    response_body=response.text,
                )

        except httpx.TimeoutException as exc:
            logger.error("Groq request timed out after %.1fs", self.timeout_seconds)
            raise GroqAPIError(f"Groq request timed out after {self.timeout_seconds}s") from exc

        except httpx.RequestError as exc:
            logger.error("Groq network request error: %s", exc)
            raise GroqAPIError(f"Groq network connection error: {str(exc)}") from exc
