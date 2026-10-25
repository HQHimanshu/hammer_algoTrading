"""Unit tests for MovingAverageRsiStrategy."""

import pytest
from app.schemas.trading import Candle, SignalAction
from app.strategies.moving_average import MovingAverageRsiStrategy


def create_candles(prices: list[float], start_time: int = 1000) -> list[Candle]:
    """Helper to generate candle objects from close prices."""
    return [
        Candle(
            time=start_time + (i * 60),
            open=p,
            high=p + 1.0,
            low=p - 1.0,
            close=p,
            volume=10.0,
        )
        for i, p in enumerate(prices)
    ]


def test_sma_calculation():
    """Verify Simple Moving Average formula."""
    prices = [10.0, 20.0, 30.0, 40.0, 50.0]
    sma3 = MovingAverageRsiStrategy.calculate_sma(prices, 3)
    assert sma3 == pytest.approx(40.0)  # (30 + 40 + 50) / 3

    sma5 = MovingAverageRsiStrategy.calculate_sma(prices, 5)
    assert sma5 == pytest.approx(30.0)  # sum / 5

    with pytest.raises(ValueError):
        MovingAverageRsiStrategy.calculate_sma([1.0], 5)


def test_rsi_calculation():
    """Verify Relative Strength Index formula."""
    # Constantly rising prices -> RSI should be 100
    rising = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0]
    rsi_rising = MovingAverageRsiStrategy.calculate_rsi(rising, 4)
    assert rsi_rising == pytest.approx(100.0)

    # Flat prices -> RSI 50
    flat = [10.0, 10.0, 10.0, 10.0, 10.0]
    rsi_flat = MovingAverageRsiStrategy.calculate_rsi(flat, 4)
    assert rsi_flat == pytest.approx(50.0)

    with pytest.raises(ValueError):
        MovingAverageRsiStrategy.calculate_rsi([10.0], 5)


def test_insufficient_candles():
    """Strategy must return HOLD with clear explanation if observations are fewer than min_required."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=6, rsi_period=4)
    # min_required = max(6 + 1, 4 + 1) = 7
    candles = create_candles([100.0, 101.0, 102.0])  # only 3
    signal = strategy.evaluate("BTCUSDT", candles)

    assert signal.action == SignalAction.HOLD
    assert "Insufficient market observations" in signal.reason
    assert signal.fast_ma is None
    assert signal.slow_ma is None


def test_golden_cross_buy_signal():
    """Fast SMA crossing strictly above Slow SMA triggers BUY when confirmed by RSI."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=85.0)

    # Design price sequence where:
    # At index -2 (candle 5): Fast SMA <= Slow SMA
    # At index -1 (candle 6): Fast SMA > Slow SMA
    prices = [100.0, 99.0, 98.0, 97.0, 98.0, 105.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.BUY
    assert "BUY Signal: Golden Cross detected" in signal.reason
    assert signal.fast_ma > signal.slow_ma


def test_golden_cross_rsi_veto():
    """Golden cross must be vetoed to HOLD if RSI >= overbought threshold."""
    # Force low overbought threshold (e.g. 50.0) so strong uptrend gets vetoed
    strategy = MovingAverageRsiStrategy(
        fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=50.0
    )

    prices = [100.0, 99.0, 98.0, 97.0, 102.0, 115.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert "vetoed by RSI" in signal.reason
    assert "overbought" in signal.reason


def test_death_cross_sell_signal():
    """Fast SMA crossing strictly below Slow SMA triggers SELL when confirmed by RSI."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_oversold=15.0)

    # Design price sequence where:
    # At index -2: Fast SMA >= Slow SMA
    # At index -1: Fast SMA < Slow SMA
    prices = [100.0, 101.0, 102.0, 103.0, 102.0, 92.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.SELL
    assert "SELL Signal: Death Cross detected" in signal.reason
    assert signal.fast_ma < signal.slow_ma


def test_death_cross_rsi_veto():
    """Death cross must be vetoed to HOLD if RSI <= oversold threshold."""
    strategy = MovingAverageRsiStrategy(
        fast_period=3, slow_period=5, rsi_period=4, rsi_oversold=50.0
    )

    prices = [100.0, 101.0, 102.0, 103.0, 98.0, 80.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert "vetoed by RSI" in signal.reason
    assert "oversold" in signal.reason


def test_no_crossover_remains_hold():
    """When moving averages maintain their position without crossing, signal is HOLD."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4)

    # Constant steady flat trend
    prices = [100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert "No crossover detected" in signal.reason


def test_duplicate_candle_prevention():
    """Evaluating on the exact same candle twice must not duplicate signals."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=85.0)

    prices = [100.0, 99.0, 98.0, 97.0, 98.0, 105.0]
    candles = create_candles(prices, start_time=5000)

    first_eval = strategy.evaluate("BTCUSDT", candles)
    assert first_eval.action == SignalAction.BUY

    # Re-evaluate with identical candle list (same latest timestamp)
    second_eval = strategy.evaluate("BTCUSDT", candles)
    assert second_eval.action == SignalAction.HOLD
    assert "already evaluated" in second_eval.reason


def test_strategy_config_validation():
    """Config validation: fast_period must be strictly less than slow_period and rsi_period >= 2."""
    with pytest.raises(ValueError, match="strictly less than slow_period"):
        MovingAverageRsiStrategy(fast_period=10, slow_period=10)

    with pytest.raises(ValueError, match="strictly less than slow_period"):
        MovingAverageRsiStrategy(fast_period=15, slow_period=5)

    with pytest.raises(ValueError, match="rsi_period must be at least 2"):
        MovingAverageRsiStrategy(fast_period=5, slow_period=15, rsi_period=1)


def test_fast_already_above_slow_without_new_crossover():
    """When Fast SMA was already above Slow SMA on the previous candle, signal is HOLD."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4)

    # Fast SMA is already well above Slow SMA on both previous and current candle
    prices = [100.0, 105.0, 110.0, 115.0, 120.0, 125.0, 130.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert signal.crossover == "NONE"
    assert "no new Golden Cross occurred" in signal.reason
    assert signal.execution_eligible is False


def test_fast_already_below_slow_without_new_crossover():
    """When Fast SMA was already below Slow SMA on the previous candle, signal is HOLD."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4)

    # Fast SMA is already well below Slow SMA on both previous and current candle
    prices = [130.0, 125.0, 120.0, 115.0, 110.0, 105.0, 100.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert signal.crossover == "NONE"
    assert "no new Death Cross occurred" in signal.reason
    assert signal.execution_eligible is False


def test_invalid_candle_numerical_values():
    """Non-positive or non-finite candle prices return HOLD with clear explanation."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4)
    candles = create_candles([100.0, 99.0, 98.0, 97.0, 0.0, 105.0])  # zero price at index 4

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert "Invalid candle data" in signal.reason
    assert signal.execution_eligible is False


def test_unsorted_candle_timestamps():
    """Candle timestamps that are not strictly ascending chronologically return HOLD."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4)
    candles = [
        Candle(time=1000, open=100, high=101, low=99, close=100, volume=10),
        Candle(time=1060, open=101, high=102, low=100, close=101, volume=10),
        Candle(time=1050, open=102, high=103, low=101, close=102, volume=10),  # timestamp goes backwards
        Candle(time=1120, open=103, high=104, low=102, close=103, volume=10),
        Candle(time=1180, open=104, high=105, low=103, close=104, volume=10),
        Candle(time=1240, open=105, high=106, low=104, close=105, volume=10),
        Candle(time=1300, open=106, high=107, low=105, close=106, volume=10),
    ]

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.action == SignalAction.HOLD
    assert "strictly ascending chronologically" in signal.reason
    assert signal.execution_eligible is False


def test_strategy_signal_structured_metadata():
    """Strategy 1 returns complete, structured metadata attributes."""
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=85.0)
    prices = [100.0, 99.0, 98.0, 97.0, 98.0, 105.0]
    candles = create_candles(prices)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.strategy_name == "Strategy 1 - Golden Cross + RSI Confirmation"
    assert signal.timeframe == "1m"
    assert signal.crossover == "GOLDEN_CROSS"
    assert signal.rsi_confirmed is True
    assert signal.execution_eligible is True
    assert signal.risk_eligible is True


def test_stale_candle_data_handling():
    """Candles with timestamps far in the past are marked data_fresh=False."""
    import time
    strategy = MovingAverageRsiStrategy(fast_period=3, slow_period=5, rsi_period=4, rsi_overbought=85.0)
    # Stale timestamps: 2 days in the past (Unix epoch > 1_000_000)
    stale_time = int(time.time()) - (86400 * 2)
    prices = [100.0, 99.0, 98.0, 97.0, 98.0, 105.0]
    candles = create_candles(prices, start_time=stale_time)

    signal = strategy.evaluate("BTCUSDT", candles)
    assert signal.data_fresh is False
    assert signal.execution_eligible is False
