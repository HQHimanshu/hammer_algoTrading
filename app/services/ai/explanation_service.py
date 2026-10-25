"""Explanation service for TradeMind AI Copilot.

Assembles bounded evidence packages, validates answer grounding, and determines
conservative confidence classifications.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple
from app.schemas.ai import ConfidenceLevel, QuestionCategory, SourceReference
from app.services.ai.document_ingestion import KnowledgeDoc

logger = logging.getLogger("algopilot.ai.explanation_service")


class ExplanationService:
    """Assembles evidence contexts and validates factual grounding of answers."""

    def __init__(self, max_context_chars: int = 8000, max_context_records: int = 20):
        self.max_context_chars = max_context_chars
        self.max_context_records = max_context_records

    def build_evidence_context(
        self,
        signals: List[Dict[str, Any]],
        orders: List[Dict[str, Any]],
        trades: List[Dict[str, Any]],
        risk_events: List[Dict[str, Any]],
        docs: List[KnowledgeDoc],
        metrics: Optional[Dict[str, Any]] = None,
    ) -> Tuple[str, List[SourceReference], List[str]]:
        """Format retrieved records into a bounded evidence string and source citations."""
        sources: List[SourceReference] = []
        limitations: List[str] = []
        sections: List[str] = []

        # 1. Signals section
        if signals:
            sig_lines = ["--- RECORDED STRATEGY SIGNALS ---"]
            for s in signals[: self.max_context_records]:
                sig_id = str(s.get("id", "N/A"))
                sig_lines.append(
                    f"Signal ID: {sig_id} | Symbol: {s.get('symbol')} | Action: {s.get('action')} "
                    f"| Price: {s.get('price')} | Fast SMA: {s.get('fast_sma')} | Slow SMA: {s.get('slow_sma')} "
                    f"| RSI: {s.get('rsi')} | Reason: {s.get('reason')} | Timestamp: {s.get('timestamp')}"
                )
                sources.append(
                    SourceReference(
                        record_type="signal",
                        record_id=sig_id,
                        event_timestamp=s.get("timestamp"),
                        summary=f"Signal {s.get('action')} on {s.get('symbol')}",
                    )
                )
            sections.append("\n".join(sig_lines))

        # 2. Orders section
        if orders:
            ord_lines = ["--- RECORDED ORDERS ---"]
            for o in orders[: self.max_context_records]:
                ord_id = str(o.get("order_id") or o.get("client_order_id") or o.get("id", "N/A"))
                client_id = str(o.get("client_order_id") or "")
                ord_lines.append(
                    f"Order ID: {ord_id} | Client Order ID: {client_id} "
                    f"| Symbol: {o.get('symbol')} | Side: {o.get('side')} | Type: {o.get('order_type')} "
                    f"| Size: {o.get('size')} | Price: {o.get('price')} | Status: {o.get('status')} "
                    f"| Timestamp: {o.get('timestamp')}"
                )
                summary_str = f"Order {ord_id}"
                if client_id and client_id != ord_id:
                    summary_str += f" ({client_id})"
                summary_str += f" status: {o.get('status')}"
                sources.append(
                    SourceReference(
                        record_type="order",
                        record_id=ord_id,
                        event_timestamp=o.get("timestamp"),
                        summary=summary_str,
                    )
                )
            sections.append("\n".join(ord_lines))

        # 3. Trades section
        if trades:
            trd_lines = ["--- RECORDED TRADES ---"]
            for t in trades[: self.max_context_records]:
                trd_id = str(t.get("trade_id") or t.get("id", "N/A"))
                trd_lines.append(
                    f"Trade ID: {trd_id} | Order ID: {t.get('order_id')} | Symbol: {t.get('symbol')} "
                    f"| Side: {t.get('side')} | Size: {t.get('size')} | Price: {t.get('price')} "
                    f"| Realized P&L: {t.get('realized_pnl')} | Timestamp: {t.get('timestamp')}"
                )
                sources.append(
                    SourceReference(
                        record_type="trade",
                        record_id=trd_id,
                        event_timestamp=t.get("timestamp"),
                        summary=f"Trade {trd_id} realized P&L: {t.get('realized_pnl')}",
                    )
                )
            sections.append("\n".join(trd_lines))

        # 4. Risk events section
        if risk_events:
            rsk_lines = ["--- RECORDED RISK DECISION EVENTS ---"]
            for r in risk_events[: self.max_context_records]:
                rsk_id = str(r.get("id", "N/A"))
                passed = r.get("checks_passed") or "[]"
                failed = r.get("checks_failed") or "[]"
                rsk_lines.append(
                    f"Risk Event ID: {rsk_id} | Client Order ID: {r.get('client_order_id')} "
                    f"| Type: {r.get('event_type')} | Decision: {r.get('decision')} | Reason: {r.get('reason')} "
                    f"| Checks Passed: {passed} | Checks Failed: {failed} | Timestamp: {r.get('timestamp')}"
                )
                sources.append(
                    SourceReference(
                        record_type="risk_event",
                        record_id=rsk_id,
                        event_timestamp=r.get("timestamp"),
                        summary=f"Risk Decision: {r.get('decision')} ({r.get('reason')})",
                    )
                )
            sections.append("\n".join(rsk_lines))

        # 5. Calculated Performance Metrics
        if metrics:
            scope_desc = metrics.get('data_scope', 'Bounded sample')
            m_lines = [
                "--- DETERMINISTIC SYSTEM PERFORMANCE METRICS ---",
                f"Data Scope: {scope_desc}",
                f"Total Orders Evaluated: {metrics.get('total_orders')}",
                f"Filled Orders: {metrics.get('filled_orders')}",
                f"Rejected Orders: {metrics.get('rejected_orders')}",
                f"Cancelled Orders: {metrics.get('cancelled_orders')}",
                f"Open Orders: {metrics.get('open_orders')}",
                f"Total Trades Recorded: {metrics.get('total_trades')}",
                f"Closed Trades with Realized P&L: {metrics.get('pnl_recorded_trades')}",
                f"Total Realized P&L (USD): ${metrics.get('total_realized_pnl_usd', 0.0):.4f}",
                f"Profitable Trades: {metrics.get('profitable_trades')}",
                f"Losing Trades: {metrics.get('losing_trades')}",
                f"Win Rate: {metrics.get('win_rate_percent')}%",
            ]
            sections.append("\n".join(m_lines))
            limitations.append(f"Performance metrics reflect a {scope_desc}, not total lifetime performance.")

        # 6. Approved Knowledge Documents
        if docs:
            doc_lines = ["--- APPROVED STRATEGY & SYSTEM DOCUMENTATION ---"]
            for d in docs:
                doc_lines.append(
                    f"Document ID: {d.doc_id} | Title: {d.title} (v{d.version})\n{d.content}\n"
                )
                sources.append(
                    SourceReference(
                        record_type="strategy_doc",
                        record_id=d.doc_id,
                        summary=f"{d.title} (v{d.version})",
                    )
                )
            sections.append("\n".join(doc_lines))

        raw_context = "\n\n".join(sections)
        if len(raw_context) > self.max_context_chars:
            raw_context = raw_context[: self.max_context_chars] + "\n...[CONTEXT TRUNCATED TO BUDGET]..."
            limitations.append("Context was bounded to maximum character budget.")

        return raw_context, sources, limitations

    def assess_confidence(
        self,
        category: QuestionCategory,
        has_target_record: bool,
        sources: List[SourceReference],
        docs_found: bool,
    ) -> ConfidenceLevel:
        """Conservatively determine answer confidence grounded in retrieved evidence."""
        if category in (QuestionCategory.TRADE_EXPLANATION, QuestionCategory.ORDER_STATUS, QuestionCategory.RISK_DECISION):
            if not has_target_record and not any(s.record_type in ("order", "trade", "signal", "risk_event") for s in sources):
                return ConfidenceLevel.INSUFFICIENT_EVIDENCE
            if not has_target_record:
                return ConfidenceLevel.PARTIALLY_SUPPORTED
            return ConfidenceLevel.SUPPORTED

        if category == QuestionCategory.STRATEGY_DOCUMENTATION:
            return ConfidenceLevel.SUPPORTED if docs_found else ConfidenceLevel.INSUFFICIENT_EVIDENCE

        if category == QuestionCategory.HISTORICAL_PERFORMANCE:
            return ConfidenceLevel.SUPPORTED if sources else ConfidenceLevel.INSUFFICIENT_EVIDENCE

        return ConfidenceLevel.SUPPORTED if sources else ConfidenceLevel.INSUFFICIENT_EVIDENCE
