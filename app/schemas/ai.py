"""Schemas and data models for TradeMind AI Copilot."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    """Conservative confidence classification grounded in retrieved evidence."""

    SUPPORTED = "supported"
    PARTIALLY_SUPPORTED = "partially_supported"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


class QuestionCategory(str, Enum):
    """Categorization for deterministic question routing."""

    TRADE_EXPLANATION = "trade_explanation"
    ORDER_STATUS = "order_status"
    RISK_DECISION = "risk_decision"
    STRATEGY_DOCUMENTATION = "strategy_documentation"
    HISTORICAL_PERFORMANCE = "historical_performance"
    GENERAL_SYSTEM = "general_system"
    UNSUPPORTED = "unsupported"


class SourceReference(BaseModel):
    """Reference citation to an authentic retrieved record or knowledge document."""

    record_type: str = Field(description="Type of record: signal, order, trade, risk_event, strategy_doc")
    record_id: str = Field(description="Unique identifier of the cited record or document")
    event_timestamp: Optional[str] = Field(default=None, description="ISO timestamp of the event if applicable")
    summary: Optional[str] = Field(default=None, description="Brief summary of what this record provides")


class CopilotChatRequest(BaseModel):
    """Incoming user request schema for TradeMind AI Copilot."""

    question: str = Field(
        min_length=3,
        max_length=1000,
        description="Natural language question about trading decisions, orders, or strategy.",
    )
    trade_id: Optional[str] = Field(default=None, max_length=128, description="Specific trade ID to focus on")
    order_id: Optional[str] = Field(default=None, max_length=128, description="Specific client or exchange order ID")
    signal_id: Optional[str] = Field(default=None, max_length=128, description="Specific signal ID to focus on")
    symbol: Optional[str] = Field(default=None, max_length=32, description="Trading symbol (e.g. BTCUSDT)")
    session_id: Optional[str] = Field(default=None, max_length=128, description="Optional conversational session ID")


class CopilotChatResponse(BaseModel):
    """Structured, evidence-grounded response from TradeMind AI Copilot."""

    answer: str = Field(description="Grounded explanation adhering to the evidence-before-explanation principle")
    sources: List[SourceReference] = Field(default_factory=list, description="Verified source citations")
    confidence: ConfidenceLevel = Field(description="Confidence rating based on record completeness")
    limitations: List[str] = Field(default_factory=list, description="Gaps, missing data, or operational boundaries")
    request_id: str = Field(description="Unique request correlation ID")
    category: QuestionCategory = Field(description="Classified question category")
    timestamp: str = Field(description="UTC timestamp of the answer")


class AIHealthResponse(BaseModel):
    """Health and configuration status of TradeMind AI."""

    ai_enabled: bool
    provider: str
    model: str
    status: str
    timestamp: str


class ConversationMessageRecord(BaseModel):
    """Single message entry in an AI conversation."""

    role: str = Field(description="Role of message sender (user, assistant, system)")
    content: str = Field(description="Content of message")
    timestamp: str = Field(description="UTC timestamp of the message")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata such as sources or confidence")


class ConversationHistoryResponse(BaseModel):
    """Retrieved conversational history for an AI session."""

    conversation_id: str
    messages: List[ConversationMessageRecord] = Field(default_factory=list)
    total_messages: int = 0
    updated_at: str
