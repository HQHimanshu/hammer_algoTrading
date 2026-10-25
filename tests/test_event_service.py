"""Tests for Trading Event Ledger service and deterministic analytics."""

import pytest
from app.database import Database
from app.schemas.trading import (
    OrderSide,
    OrderStatus,
    OrderType,
    SignalAction,
)
from app.services.event_service import EventService


@pytest.mark.asyncio
async def test_event_service_lifecycle_and_lookups(tmp_path):
    """Test full event ledger recording: strategy, risk, order, fill, and exit events."""
    db_path = str(tmp_path / "test_ledger.db")
    db = Database(db_path=db_path)
    await db.init_db()

    ledger = EventService(storage=db)

    # 1. Record Strategy Event
    strat_event = await ledger.record_strategy_event(
        symbol="BTCUSDT",
        signal=SignalAction.BUY,
        price=50000.0,
        fast_ma=50100.0,
        slow_ma=49900.0,
        rsi=55.0,
        reason="Fast EMA crossed above Slow EMA",
        parameters={"fast": 9, "slow": 21},
    )
    assert strat_event.signal_id.startswith("SIG-")
    assert strat_event.action == SignalAction.BUY
    assert strat_event.symbol == "BTCUSDT"

    # Query back strategy event
    retrieved_strat = await ledger.get_strategy_event(strat_event.signal_id)
    assert retrieved_strat is not None
    assert retrieved_strat.symbol == "BTCUSDT"
    assert retrieved_strat.price == 50000.0

    # 2. Record Risk Event
    risk_event = await ledger.record_risk_event(
        symbol="BTCUSDT",
        action="BUY",
        approved=True,
        reason="All pre-trade risk checks passed",
        checks_passed=["trading_enabled", "position_limit", "loss_limit"],
        checks_failed=[],
        client_order_id="test-client-ord-1",
        signal_id=strat_event.signal_id,
    )
    assert risk_event.event_id.startswith("RISK-")
    assert risk_event.approved is True

    # Query back risk event
    retrieved_risk = await ledger.get_risk_event(risk_event.event_id)
    assert retrieved_risk is not None
    assert retrieved_risk.approved is True
    assert "trading_enabled" in retrieved_risk.checks_passed

    # 3. Record Order Event
    order_event = await ledger.record_order_event(
        symbol="BTCUSDT",
        side=OrderSide.BUY,
        order_type=OrderType.LIMIT,
        size=0.1,
        price=50000.0,
        status=OrderStatus.OPEN,
        client_order_id="test-client-ord-1",
        order_id="EXCH-9999",
        signal_id=strat_event.signal_id,
        risk_event_id=risk_event.event_id,
    )
    assert order_event.order_id == "ORD-EXCH-9999"

    # Query back order event
    retrieved_ord = await ledger.get_order_event("EXCH-9999")
    assert retrieved_ord is not None
    assert retrieved_ord.symbol == "BTCUSDT"
    assert retrieved_ord.side == OrderSide.BUY

    # 4. Record Fill Event
    fill_event = await ledger.record_fill_event(
        order_id="EXCH-9999",
        symbol="BTCUSDT",
        side=OrderSide.BUY,
        price=50000.0,
        size=0.1,
        exchange_order_id="EXCH-9999",
        fee=2.5,
    )
    assert fill_event.fill_id.startswith("FILL-")
    assert fill_event.price == 50000.0

    # 5. Record Exit / Close Event with Realized P&L
    exit_event = await ledger.record_exit_event(
        trade_id="TRD-1042",
        order_id="EXCH-10000",
        symbol="BTCUSDT",
        side="sell",
        size=0.1,
        price=51000.0,
        realized_pnl=100.0,
        exit_reason="take_profit",
    )
    assert exit_event.trade_id == "TRD-1042"
    assert exit_event.realized_pnl == 100.0

    # Query back trade event
    retrieved_trade = await ledger.get_trade_event("TRD-1042")
    assert retrieved_trade is not None
    assert retrieved_trade.symbol == "BTCUSDT"
    assert retrieved_trade.realized_pnl == 100.0


@pytest.mark.asyncio
async def test_event_service_deterministic_analytics(tmp_path):
    """Verify compute_analytics_summary produces exact metric aggregations."""
    db_path = str(tmp_path / "test_analytics.db")
    db = Database(db_path=db_path)
    await db.init_db()

    ledger = EventService(storage=db)

    # Record 2 signals
    await ledger.record_strategy_event("BTCUSDT", SignalAction.BUY, 50000.0)
    await ledger.record_strategy_event("BTCUSDT", SignalAction.SELL, 51000.0)

    # Record 1 approved risk event, 1 rejected risk event
    await ledger.record_risk_event(
        "BTCUSDT", "BUY", approved=True, reason="ok", checks_passed=["limit"], checks_failed=[]
    )
    await ledger.record_risk_event(
        "BTCUSDT", "BUY", approved=False, reason="position_limit_exceeded", checks_passed=[], checks_failed=["max_position_size"]
    )

    # Record 1 filled order, 1 rejected order
    await ledger.record_order_event("BTCUSDT", "buy", "market", 0.1, 50000.0, "filled", client_order_id="ord-1")
    await ledger.record_order_event("BTCUSDT", "buy", "market", 0.5, 50000.0, "rejected", client_order_id="ord-2")

    # Record 2 trades: one profitable (+150), one losing (-50)
    await ledger.record_exit_event("T-1", "BTCUSDT", "sell", 0.1, 51500.0, realized_pnl=150.0, exit_reason="take_profit")
    await ledger.record_exit_event("T-2", "BTCUSDT", "sell", 0.1, 49500.0, realized_pnl=-50.0, exit_reason="stop_loss")

    # Compute analytics
    summary = await ledger.compute_analytics_summary()

    assert summary.total_signals == 2
    assert summary.total_orders == 2
    assert summary.filled_orders == 1
    assert summary.rejected_orders == 1
    assert summary.total_trades == 2
    assert summary.closed_trades_with_pnl == 2
    assert summary.profitable_trades == 1
    assert summary.losing_trades == 1
    assert summary.total_realized_pnl_usd == 100.0  # 150 - 50
    assert summary.win_rate_percent == 50.0  # 1 / 2 * 100
    assert summary.exit_reason_distribution == {"take_profit": 1, "stop_loss": 1}
    assert summary.risk_rule_rejection_counts == {"max_position_size": 1}
