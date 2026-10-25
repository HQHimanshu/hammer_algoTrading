"""TradeMind AI Copilot Orchestrator.

Main entry point for explainable, evidence-grounded trading Q&A.
Strictly read-only; absolutely cannot place, modify, or cancel orders.
"""

import datetime
import logging
import re
import uuid
from typing import Any, Dict, List, Optional
from app.config import Settings
from app.schemas.ai import (
    ConfidenceLevel,
    CopilotChatRequest,
    CopilotChatResponse,
    QuestionCategory,
    SourceReference,
)
from app.services.ai.document_ingestion import DocumentIngestionService
from app.services.ai.explanation_service import ExplanationService
from app.services.ai.llm_provider import BaseLLMProvider, LLMProviderError, get_llm_provider
from app.services.ai.prompt_templates import SYSTEM_INSTRUCTION, build_copilot_prompt
from app.services.ai.retrieval_service import RetrievalService

logger = logging.getLogger("algopilot.ai.copilot_service")


class TradeMindCopilot:
    """TradeMind AI explainable copilot service."""

    def __init__(
        self,
        settings: Settings,
        db,
        llm_provider: Optional[BaseLLMProvider] = None,
        retrieval_service: Optional[RetrievalService] = None,
        explanation_service: Optional[ExplanationService] = None,
    ):
        self.settings = settings
        self.db = db
        self.llm = llm_provider or get_llm_provider(settings)
        self.retrieval = retrieval_service or RetrievalService(db)
        self.explanation = explanation_service or ExplanationService(
            max_context_chars=settings.AI_MAX_CONTEXT_CHARS,
            max_context_records=settings.AI_MAX_CONTEXT_RECORDS,
        )
        self._conversations: Dict[str, List[Dict[str, Any]]] = {}

    def get_conversation_history(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve stored message history for a conversation session."""
        if conversation_id not in self._conversations:
            return None
        messages = self._conversations[conversation_id]
        latest_time = messages[-1]["timestamp"] if messages else datetime.datetime.now(datetime.timezone.utc).isoformat()
        return {
            "conversation_id": conversation_id,
            "messages": messages,
            "total_messages": len(messages),
            "updated_at": latest_time,
        }

    def classify_question(self, question: str, req: CopilotChatRequest) -> QuestionCategory:
        """Deterministically route questions into domain categories."""
        q = question.lower()

        if req.trade_id or "trade" in q and ("why" in q or "enter" in q or "exit" in q):
            return QuestionCategory.TRADE_EXPLANATION

        if req.order_id or any(kw in q for kw in ["order", "placed", "submitted", "accepted", "filled", "partially"]):
            if "risk" in q or "reject" in q:
                return QuestionCategory.RISK_DECISION
            return QuestionCategory.ORDER_STATUS

        if any(kw in q for kw in ["strategy", "golden cross", "death cross", "moving average", "sma", "rsi", "indicator", "rule", "how does"]):
            return QuestionCategory.STRATEGY_DOCUMENTATION

        if any(kw in q for kw in ["pnl", "profit", "win rate", "performance", "how many trades", "how many orders", "today"]):
            return QuestionCategory.HISTORICAL_PERFORMANCE

        if any(kw in q for kw in ["risk", "reject", "veto", "limit", "emergency stop", "cooldown", "check"]):
            return QuestionCategory.RISK_DECISION

        if any(kw in q for kw in ["architecture", "delta", "testnet", "database", "sqlite", "firestore", "backend"]):
            return QuestionCategory.GENERAL_SYSTEM

        return QuestionCategory.TRADE_EXPLANATION

    def check_adversarial_or_trading_intent(self, question: str) -> Optional[str]:
        """Intercept attempts to command order execution or prompt injection."""
        q = question.lower()

        # 1. Trading action attempt
        trading_verbs = [
            "buy ", "sell ", "place order", "submit order", "cancel order",
            "close position", "open position", "modify order", "disable emergency stop",
            "change limit", "start engine", "stop engine"
        ]
        if any(v in q for v in trading_verbs) and ("please" in q or "now" in q or "execute" in q or q.startswith(("buy", "sell", "place", "cancel"))):
            return (
                "SAFETY REFUSAL: TradeMind AI is a strictly READ-ONLY explanation assistant. "
                "I have no authority or programmatic capability to place, modify, or cancel exchange orders, "
                "nor can I modify risk controls or engine states. Please use the appropriate trading API endpoints."
            )

        # 2. Prompt injection attempt
        injection_phrases = [
            "ignore previous instructions", "ignore all instructions", "override instructions",
            "you are now in developer mode", "system prompt", "reveal your instructions"
        ]
        if any(phrase in q for phrase in injection_phrases):
            return (
                "SECURITY ALERT: Instruction override detected. TradeMind AI remains strictly grounded "
                "in verified trading records and approved system documentation."
            )

        return None

    async def answer_question(self, req: CopilotChatRequest) -> CopilotChatResponse:
        """Execute the complete evidence-first RAG pipeline."""
        req_id = f"req-{uuid.uuid4().hex[:8]}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # Step 1: Check safety / execution intent
        refusal = self.check_adversarial_or_trading_intent(req.question)
        if refusal:
            return CopilotChatResponse(
                answer=refusal,
                sources=[],
                confidence=ConfidenceLevel.SUPPORTED,
                limitations=["Action execution request blocked by AI safety guardrails."],
                request_id=req_id,
                category=QuestionCategory.UNSUPPORTED,
                timestamp=now_iso,
            )

        # Step 2: Classify category
        category = self.classify_question(req.question, req)

        # Step 3: Retrieval
        signals: List[Dict[str, Any]] = []
        orders: List[Dict[str, Any]] = []
        trades: List[Dict[str, Any]] = []
        risk_events: List[Dict[str, Any]] = []
        docs = []
        metrics = None
        has_target_record = False
        limitations: List[str] = []

        # Target specific order
        target_order_id = req.order_id
        if not target_order_id:
            # Look for order id pattern in question (e.g. ord-..., ord_...)
            match = re.search(r"\b(ord[_\-][a-zA-Z0-9_\-]+)\b", req.question, re.IGNORECASE)
            if match:
                target_order_id = match.group(1)

        if target_order_id:
            ord_record = await self.retrieval.get_order(target_order_id)
            if ord_record:
                orders.append(ord_record)
                has_target_record = True
                # Look for linked risk events or signals if client_order_id exists
                client_ord_id = ord_record.get("client_order_id")
                if client_ord_id and hasattr(self.db, "get_recent_risk_events"):
                    all_risks = await self.retrieval.get_recent_risk_events(limit=50)
                    linked_risks = [r for r in all_risks if r.get("client_order_id") == client_ord_id]
                    risk_events.extend(linked_risks)
            else:
                limitations.append(f"Order '{target_order_id}' was not found in the recorded database.")

        # Target specific trade
        target_trade_id = req.trade_id
        if not target_trade_id:
            match = re.search(r"\b(trd[_\-][a-zA-Z0-9_\-]+)\b", req.question, re.IGNORECASE)
            if match:
                target_trade_id = match.group(1)

        if target_trade_id:
            trd_record = await self.retrieval.get_trade(target_trade_id)
            if trd_record:
                trades.append(trd_record)
                has_target_record = True
                linked_ord_id = trd_record.get("order_id")
                if linked_ord_id:
                    ord_record = await self.retrieval.get_order(linked_ord_id)
                    if ord_record:
                        orders.append(ord_record)
            else:
                limitations.append(f"Trade '{target_trade_id}' was not found in the recorded database.")

        # Target specific signal
        target_signal_id = req.signal_id
        if not target_signal_id:
            match = re.search(r"\bsig[_\-]?(\d+)\b", req.question, re.IGNORECASE)
            if match:
                target_signal_id = match.group(1)

        if target_signal_id:
            sig_record = await self.retrieval.get_signal(target_signal_id)
            if sig_record:
                signals.append(sig_record)
                has_target_record = True
            else:
                limitations.append(f"Signal '{target_signal_id}' was not found in the recorded database.")

        # If historical performance question
        if category == QuestionCategory.HISTORICAL_PERFORMANCE:
            metrics = await self.retrieval.calculate_historical_performance(symbol=req.symbol, limit=100)
            trades = await self.retrieval.get_recent_trades(symbol=req.symbol, limit=5)
            orders = await self.retrieval.get_recent_orders(symbol=req.symbol, limit=5)
            has_target_record = bool(metrics.get("total_orders", 0) > 0 or metrics.get("total_trades", 0) > 0)

        # General / category-based fetching if no exact target ID was specified
        if not target_order_id and not target_trade_id and not target_signal_id:
            if category == QuestionCategory.RISK_DECISION:
                risk_events = await self.retrieval.get_recent_risk_events(symbol=req.symbol, limit=10)
                orders = await self.retrieval.get_recent_orders(symbol=req.symbol, limit=5)
                has_target_record = bool(risk_events)
            elif category == QuestionCategory.ORDER_STATUS:
                orders = await self.retrieval.get_recent_orders(symbol=req.symbol, limit=10)
                has_target_record = bool(orders)
            elif category == QuestionCategory.TRADE_EXPLANATION:
                trades = await self.retrieval.get_recent_trades(symbol=req.symbol, limit=5)
                signals = await self.retrieval.get_recent_signals(symbol=req.symbol, limit=5)
                orders = await self.retrieval.get_recent_orders(symbol=req.symbol, limit=5)
                has_target_record = bool(trades or signals)

        # Retrieve relevant knowledge docs
        rag_limit = getattr(self.settings, "RAG_TOP_K", 5)
        docs = self.retrieval.search_knowledge(req.question, limit=rag_limit)

        # Step 4: Build evidence context
        evidence_str, sources, context_limitations = self.explanation.build_evidence_context(
            signals=signals,
            orders=orders,
            trades=trades,
            risk_events=risk_events,
            docs=docs,
            metrics=metrics,
        )
        limitations.extend(context_limitations)

        # Determine confidence grounded in evidence
        confidence = self.explanation.assess_confidence(
            category=category,
            has_target_record=has_target_record,
            sources=sources,
            docs_found=bool(docs),
        )

        # If completely insufficient evidence for a target lookup, respond directly with honest uncertainty
        if (target_order_id or target_trade_id or target_signal_id) and not has_target_record:
            item_desc = target_order_id or target_trade_id or target_signal_id
            answer = (
                f"I cannot provide an explanation for '{item_desc}' because no matching record exists "
                "in the recorded database.\n\n"
                "Evidence:\n"
                "- Record Lookup: Failed (no matching document found)\n\n"
                "Interpretation:\n"
                "The requested identifier may not have been executed on this system, or occurred outside the database scope.\n\n"
                "Limitations:\n"
                "- Missing record prevents factual analysis."
            )
            return CopilotChatResponse(
                answer=answer,
                sources=[],
                confidence=ConfidenceLevel.INSUFFICIENT_EVIDENCE,
                limitations=limitations,
                request_id=req_id,
                category=category,
                timestamp=now_iso,
            )

        # Step 5: Generate answer via LLM
        prompt = build_copilot_prompt(
            question=req.question,
            evidence_context=evidence_str,
            category=category.value,
            limitations=limitations,
        )

        try:
            answer = await self.llm.generate_response(prompt=prompt, system_instruction=SYSTEM_INSTRUCTION)
        except LLMProviderError as exc:
            logger.error("LLM generation error: %s", exc)
            # Safe grounded fallback on provider failure
            answer = (
                "The AI language model is currently unavailable, but here is the factual record from the database:\n\n"
                f"{evidence_str[:1200]}\n\n"
                "All trading systems and risk controls remain fully functional."
            )
            limitations.append(f"LLM generation failed: {str(exc)}")
            confidence = ConfidenceLevel.PARTIALLY_SUPPORTED

        resp = CopilotChatResponse(
            answer=answer,
            sources=sources,
            confidence=confidence,
            limitations=limitations,
            request_id=req_id,
            category=category,
            timestamp=now_iso,
        )

        # Track conversation history if session_id is provided or generated
        conv_id = req.session_id or req_id
        if conv_id not in self._conversations:
            self._conversations[conv_id] = []
        self._conversations[conv_id].append({
            "role": "user",
            "content": req.question,
            "timestamp": now_iso,
            "metadata": {"trade_id": req.trade_id, "order_id": req.order_id, "signal_id": req.signal_id},
        })
        self._conversations[conv_id].append({
            "role": "assistant",
            "content": resp.answer,
            "timestamp": now_iso,
            "metadata": {
                "confidence": resp.confidence.value,
                "category": resp.category.value,
                "sources_count": len(resp.sources),
            },
        })

        return resp
