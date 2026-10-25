"""Application configuration using Pydantic Settings.

Ensures strict environment variable loading, safe non-trading defaults,
and validation against live trading URLs.
"""

from functools import lru_cache
from typing import Optional
from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration loaded from environment variables or .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Project metadata
    PROJECT_NAME: str = "Project Hammer"
    APP_NAME: str = "Project Hammer"
    APP_ENV: str = "development"
    DEBUG: bool = False
    VERSION: str = "1.0.0"

    # Delta Exchange API configuration
    DELTA_API_KEY: str = Field(default="", repr=False)
    DELTA_API_SECRET: str = Field(default="", repr=False)
    DELTA_BASE_URL: str = Field(
        default="https://testnet-api.delta.exchange",
        description="Must point to Delta Exchange Testnet",
    )

    # Trading Engine Safety Controls - MUST DEFAULT TO FALSE
    TRADING_ENABLED: bool = Field(
        default=False,
        description="Safety switch. Order submission is blocked unless explicitly enabled.",
    )

    # Risk Controls
    MAX_POSITION_SIZE: float = Field(
        default=1.0,
        gt=0,
        description="Maximum permitted order/position size in contracts/units.",
    )
    MAX_DAILY_LOSS: float = Field(
        default=100.0,
        gt=0,
        description="Daily realized+unrealized loss threshold in USD.",
    )
    MAX_OPEN_POSITIONS: int = Field(
        default=1,
        ge=1,
        description="Maximum simultaneous open positions.",
    )

    # System parameters
    REQUEST_TIMEOUT_SECONDS: float = Field(default=10.0, gt=0)
    LOG_LEVEL: str = Field(default="INFO")
    DATABASE_PATH: str = Field(default="algopilot.db")
    DATABASE_BACKEND: str = Field(
        default="sqlite",
        description="Database backend: 'sqlite' or 'firestore'",
    )
    FIREBASE_PROJECT_ID: str = Field(
        default="hammer-algotrading",
        description="Firebase project ID",
    )
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = Field(
        default=None,
        description="Path to Firebase Service Account JSON credentials file",
    )
    FIREBASE_CREDENTIALS_PATH: Optional[str] = Field(
        default=None,
        description="Alternative alias path to Firebase Service Account JSON credentials file",
    )
    EXECUTION_LOOP_INTERVAL_SECONDS: int = Field(default=30, ge=5)

    # Default Strategy parameters (Moving Average Crossover + RSI)
    DEFAULT_TRADING_SYMBOL: str = Field(default="BTCUSDT")
    STRATEGY_FAST_PERIOD: int = Field(default=5, ge=2)
    STRATEGY_SLOW_PERIOD: int = Field(default=15, ge=3)
    STRATEGY_RSI_PERIOD: int = Field(default=14, ge=2)
    STRATEGY_RSI_OVERBOUGHT: float = Field(default=70.0, ge=50.0, le=100.0)
    STRATEGY_RSI_OVERSOLD: float = Field(default=30.0, ge=0.0, le=50.0)

    # TradeMind AI Copilot Configuration
    AI_ENABLED: bool = Field(
        default=False,
        description="Master switch for TradeMind AI Copilot. Defaults to False.",
    )
    AI_PROVIDER: str = Field(
        default="mock",
        description="AI LLM provider: 'mock' (offline/tests), 'groq' (official Groq API), 'grok' (xAI Grok API), or 'gemini'.",
    )
    AI_MODEL: str = Field(
        default="llama-3.3-70b-versatile",
        description="LLM model identifier.",
    )
    AI_API_KEY: str = Field(
        default="",
        repr=False,
        description="API key for the configured LLM provider.",
    )
    AI_MAX_CONTEXT_RECORDS: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum structured records to retrieve into context.",
    )
    AI_MAX_CONTEXT_CHARS: int = Field(
        default=8000,
        ge=500,
        le=50000,
        description="Character budget for prompt context.",
    )
    AI_REQUEST_TIMEOUT_SECONDS: float = Field(
        default=15.0,
        gt=0,
        description="Timeout in seconds for LLM provider requests.",
    )
    AI_MAX_OUTPUT_TOKENS: int = Field(
        default=1000,
        ge=50,
        le=4000,
        description="Maximum generation tokens from the LLM.",
    )

    # Official Groq API Configuration
    GROQ_API_KEY: str = Field(
        default="",
        repr=False,
        description="Groq API key (starts with gsk_)",
    )
    GROQ_MODEL: str = Field(
        default="llama-3.3-70b-versatile",
        description="Groq model identifier (e.g. 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant')",
    )
    GROQ_BASE_URL: str = Field(
        default="https://api.groq.com/openai/v1",
        description="Groq API base URL",
    )
    RAG_TOP_K: int = Field(
        default=5,
        ge=1,
        description="Top-K documents/chunks for RAG retrieval",
    )
    RAG_MIN_RELEVANCE_SCORE: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
        description="Relevance cutoff score for document retrieval",
    )

    # Official xAI Grok API Configuration
    XAI_API_KEY: str = Field(
        default="",
        repr=False,
        description="xAI API key for Grok models",
    )
    XAI_MODEL: str = Field(
        default="grok-2-latest",
        description="xAI model identifier (e.g. 'grok-2-latest', 'grok-beta')",
    )
    XAI_BASE_URL: str = Field(
        default="https://api.x.ai/v1",
        description="xAI API base URL",
    )
    XAI_TIMEOUT_SECONDS: float = Field(
        default=60.0,
        gt=0,
        description="Timeout for xAI Grok API requests in seconds",
    )

    @field_validator("DATABASE_BACKEND")
    @classmethod
    def validate_database_backend(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ("sqlite", "firestore"):
            raise ValueError(f"DATABASE_BACKEND must be 'sqlite' or 'firestore', got '{v}'")
        return clean

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in ("mock", "groq", "grok", "gemini"):
            raise ValueError(f"AI_PROVIDER must be 'mock', 'groq', 'grok', or 'gemini', got '{v}'")
        return clean

    @model_validator(mode="after")
    def validate_feature_configurations(self) -> "Settings":
        if self.FIREBASE_CREDENTIALS_PATH and not self.FIREBASE_SERVICE_ACCOUNT_PATH:
            self.FIREBASE_SERVICE_ACCOUNT_PATH = self.FIREBASE_CREDENTIALS_PATH

        if self.AI_ENABLED:
            if self.AI_PROVIDER == "groq" and not (self.GROQ_API_KEY.strip() or self.AI_API_KEY.strip()):
                raise ValueError("GROQ_API_KEY must be provided when AI_ENABLED=True and AI_PROVIDER='groq'")
            if self.AI_PROVIDER == "grok" and not (self.XAI_API_KEY.strip() or self.AI_API_KEY.strip()):
                raise ValueError("XAI_API_KEY must be provided when AI_ENABLED=True and AI_PROVIDER='grok'")
            if self.AI_PROVIDER == "gemini" and not self.AI_API_KEY.strip():
                raise ValueError("AI_API_KEY must be provided when AI_ENABLED=True and AI_PROVIDER='gemini'")
        return self

    @field_validator("DELTA_BASE_URL")
    @classmethod
    def validate_testnet_url(cls, v: str) -> str:
        """Enforce that Delta Exchange base URL points to a testnet or demo domain."""
        clean_url = v.strip().rstrip("/")
        # Production URLs like https://api.delta.exchange or https://api.india.delta.exchange are forbidden
        if "testnet" not in clean_url.lower() and "demo" not in clean_url.lower():
            raise ValueError(
                f"SAFETY VIOLATION: '{clean_url}' does not appear to be a testnet URL. "
                "The AlgoPilot trading system only connects to Delta Exchange Testnet "
                "(e.g. 'https://testnet-api.delta.exchange' or 'https://cdn-ind.testnet.deltaex.org')."
            )
        return clean_url

    @field_validator("STRATEGY_SLOW_PERIOD")
    @classmethod
    def validate_periods(cls, slow: int, info) -> int:
        fast = info.data.get("STRATEGY_FAST_PERIOD", 5)
        if slow <= fast:
            raise ValueError("STRATEGY_SLOW_PERIOD must be strictly greater than STRATEGY_FAST_PERIOD")
        return slow

    @property
    def has_credentials(self) -> bool:
        """Check whether Delta Exchange API key and secret are configured."""
        return bool(self.DELTA_API_KEY.strip() and self.DELTA_API_SECRET.strip())

    def masked_api_key(self) -> str:
        """Return masked API key for logging/diagnostics without leaking secrets."""
        if not self.DELTA_API_KEY:
            return "NOT_CONFIGURED"
        if len(self.DELTA_API_KEY) <= 6:
            return "***"
        return f"{self.DELTA_API_KEY[:3]}...{self.DELTA_API_KEY[-3:]}"


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton."""
    return Settings()
