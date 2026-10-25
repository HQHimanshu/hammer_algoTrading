"""API routes for TradeMind AI Copilot."""

import datetime
from typing import Any, Dict
from fastapi import APIRouter, HTTPException, Request, status
from app.config import Settings
from app.schemas.ai import AIHealthResponse, CopilotChatRequest, CopilotChatResponse
from app.services.ai.copilot_service import TradeMindCopilot

router = APIRouter(tags=["TradeMind AI Copilot"])


@router.get("/health", response_model=AIHealthResponse)
async def get_ai_health(request: Request) -> AIHealthResponse:
    """Check TradeMind AI Copilot readiness and configuration."""
    settings: Settings = request.app.state.settings
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    return AIHealthResponse(
        ai_enabled=settings.AI_ENABLED,
        provider=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
        status="ready" if settings.AI_ENABLED else "disabled",
        timestamp=now_iso,
    )


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    chat_req: CopilotChatRequest,
    request: Request,
) -> CopilotChatResponse:
    """Submit natural-language questions to TradeMind AI Copilot.

    Answers are strictly grounded in recorded trading events, strategy rules,
    risk checks, and execution documents.
    """
    settings: Settings = request.app.state.settings
    if not settings.AI_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "TradeMind AI Copilot is currently disabled. Set AI_ENABLED=true in configuration "
                "or environment variables to enable explainable trading assistance."
            ),
        )

    copilot: TradeMindCopilot = request.app.state.copilot_service
    try:
        return await copilot.answer_question(chat_req)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TradeMind AI encountered an error processing your query: {str(exc)}",
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    request: Request,
) -> Dict[str, Any]:
    """Retrieve stored conversational messages and metadata for a session."""
    copilot: TradeMindCopilot = getattr(request.app.state, "copilot_service", None)
    if not copilot:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TradeMind AI service is not initialized",
        )

    history = copilot.get_conversation_history(conversation_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation '{conversation_id}' not found",
        )
    return history
