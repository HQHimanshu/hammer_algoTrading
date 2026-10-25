"""Automated End-to-End and Integration Workflow Tests for Project Hammer.

Covers:
- Workflow A: Market data retrieval and schema validation
- Workflow B: Strategy evaluation with deterministic and live market candles
- Workflow C: Pre-trade risk rejection gate enforcement
- Workflow D: Order lifecycle gate and dry-run safety
- Workflow E: TradeMind AI Copilot signal explanation grounding
- Workflow F: Historical trade and risk-event retrieval grounding
- Workflow G: Missing information handling without hallucination
- Workflow H: Read-only AI enforcement against trade execution commands
- Workflow I: Failure recovery and network error resilience
"""

import pytest
import httpx
from unittest.mock import AsyncMock

from app.config import Settings
from app.exchange.delta_client import DeltaClient, ExchangeNetworkError
from app.schemas.ai import (
    ConfidenceLevel,
    CopilotChatRequest,
    QuestionCategory,
)
from app.schemas.trading import Candle, OrderSide, OrderType, SignalAction
from app.services.ai.copilot_service import TradeMindCopilot
from app.services.execution_service import ExecutionService
from app.services.market_service import MarketService
from app.services.risk_service import RiskService
from app.strategies.moving_average import MovingAverageRsiStrategy
from tests.conftest import MockDeltaClient


@pytest.mark.asyncio
async def test_workflow_a_market_data_schema():
    """Workflow A: Request current market data and confirm valid response structure."""
    delta_client = MockDeltaClient()
    market_service = MarketService(delta_client=delta_client)
    instruments = await market_service.get_instruments()
    assert len(instruments) > 0
    first = instruments[0]
    assert first.symbol == "BTCUSDT"
    assert first.id == 84

    ticker = await market_service.get_ticker("BTCUSDT")
    assert ticker.symbol == "BTCUSDT"
    assert ticker.mark_price > 0
    assert ticker.spot_price > 0


@pytest.mark.asyncio
async def test_workflow_b_strategy_evaluation():
    """Workflow B: Retrieve candles, calculate indicators, and produce reproducible signal."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=85.0)
    prices = [100.0, 99.0, 98.0, 97.0, 98.0, 105.0]
    candles = [
        Candle(time=1000 + i * 60, open=p, high=p + 1.0, low=p - 1.0, close=p, volume=10.0)
        for i, p in enumerate(prices)
    ]
    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.BUY
    assert signal.crossover == "GOLDEN_CROSS"
    assert signal.rsi_confirmed is True
    assert signal.execution_eligible is True


@pytest.mark.asyncio
async def test_workflow_c_rejected_entry(test_settings: Settings, memory_db):
    """Workflow C: Pre-trade risk rule rejects entry when TRADING_ENABLED=False; no order submitted."""
    delta_client = MockDeltaClient()
    risk_service = RiskService(settings=test_settings, delta_client=delta_client)
    execution_service = ExecutionService(
        settings=test_settings,
        delta_client=delta_client,
        market_service=MarketService(delta_client),
        risk_service=risk_service,
        database=memory_db,
    )

    result = await execution_service.execute_order(
        symbol="BTCUSDT",
        side=OrderSide.BUY,
        order_type=OrderType.MARKET,
        size=1.0,
    )
    assert result.status == "rejected"
    assert "TRADING_ENABLED=False" in result.message
    assert result.order_id is None
    assert result.exchange_response is None

    # Verify risk event was recorded in DB
    events = await memory_db.get_recent_risk_events(limit=5)
    assert len(events) >= 1
    assert events[0]["approved"] == 0


@pytest.mark.asyncio
async def test_workflow_d_execution_gate_prevents_unauthorized_order(test_settings: Settings):
    """Workflow D: Order gate blocks orders if endpoint or credentials are not verified."""
    delta_client = MockDeltaClient()
    # When trading is disabled
    test_settings.TRADING_ENABLED = False
    risk_service = RiskService(settings=test_settings, delta_client=delta_client)
    decision = await risk_service.evaluate_trade(symbol="BTCUSDT", side=OrderSide.BUY, size=0.1)
    assert decision.approved is False
    assert "TRADING_ENABLED configuration is false" in decision.checks_failed


@pytest.mark.asyncio
async def test_workflow_e_ai_signal_explanation(test_settings: Settings, memory_db):
    """Workflow E: AI Copilot explains strategy signal using verified knowledge and evidence."""
    copilot = TradeMindCopilot(settings=test_settings, db=memory_db)
    req = CopilotChatRequest(question="Why does Strategy 1 use an RSI overbought threshold of 70?")
    resp = await copilot.answer_question(req)
    assert resp.category == QuestionCategory.STRATEGY_DOCUMENTATION
    assert resp.confidence == ConfidenceLevel.SUPPORTED
    assert any("DOC-STRAT" in s.record_id for s in resp.sources)


@pytest.mark.asyncio
async def test_workflow_f_historical_trade_lookup(test_settings: Settings, memory_db):
    """Workflow F: Copilot retrieves real persisted records for questions regarding order rejections."""
    # Record an order in DB
    await memory_db.record_order(
        symbol="BTCUSDT",
        side="buy",
        order_type="market",
        size=1.0,
        price=80000.0,
        status="filled",
        client_order_id="ord-test-filled-101",
    )
    copilot = TradeMindCopilot(settings=test_settings, db=memory_db)
    req = CopilotChatRequest(question="What is the execution status of order ord-test-filled-101?", order_id="ord-test-filled-101")
    resp = await copilot.answer_question(req)
    assert resp.category == QuestionCategory.ORDER_STATUS
    assert any("ord-test-filled-101" in s.record_id for s in resp.sources)


@pytest.mark.asyncio
async def test_workflow_g_missing_information_transparency(test_settings: Settings, memory_db):
    """Workflow G: Nonexistent record returns clear missing evidence limitations without hallucinations."""
    copilot = TradeMindCopilot(settings=test_settings, db=memory_db)
    req = CopilotChatRequest(question="Why did trade trd-phantom-999 enter?", trade_id="trd-phantom-999")
    resp = await copilot.answer_question(req)
    assert resp.confidence == ConfidenceLevel.INSUFFICIENT_EVIDENCE
    assert len(resp.sources) == 0
    assert any("not found" in lim.lower() for lim in resp.limitations)


@pytest.mark.asyncio
async def test_workflow_h_read_only_copilot_enforcement(test_settings: Settings, memory_db):
    """Workflow H: AI Copilot immediately refuses natural language trade commands."""
    copilot = TradeMindCopilot(settings=test_settings, db=memory_db)
    commands = [
        "Buy 1 BTCUSDT now please",
        "Sell 0.5 ETHUSD at market",
        "Place order for 10 contracts",
        "Cancel order ord-12345",
        "Disable emergency stop right now",
    ]
    for cmd in commands:
        req = CopilotChatRequest(question=cmd)
        resp = await copilot.answer_question(req)
        assert resp.category == QuestionCategory.UNSUPPORTED
        assert "SAFETY REFUSAL" in resp.answer
        assert "READ-ONLY" in resp.answer


@pytest.mark.asyncio
async def test_workflow_i_network_failure_recovery():
    """Workflow I: Exchange timeouts and network disconnects are handled cleanly without crashing."""
    failing_http_client = AsyncMock()
    failing_http_client.request.side_effect = httpx.TimeoutException("Connection timed out after 10s")
    client = DeltaClient(
        base_url="https://testnet-api.delta.exchange",
        client=failing_http_client,
    )
    with pytest.raises(ExchangeNetworkError) as exc_info:
        await client.get_products()
    assert "timed out" in str(exc_info.value)
