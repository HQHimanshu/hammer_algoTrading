"""Unit tests for standalone Heikin-Ashi Breakout Strategy (strategy1.py)."""

import pandas as pd
import pytest
from strategy1 import generate_signals, heikin_ashi, risk_levels


def test_heikin_ashi_calculation():
    """Verify Heikin-Ashi formulas for open, close, and trend state."""
    raw_data = [
        {"open": 100.0, "high": 105.0, "low": 95.0, "close": 102.0},
        {"open": 102.0, "high": 108.0, "low": 101.0, "close": 106.0},
        {"open": 106.0, "high": 110.0, "low": 104.0, "close": 108.0},
    ]
    df = pd.DataFrame(raw_data)
    df_ha = heikin_ashi(df)

    # First ha_close = (100 + 105 + 95 + 102) / 4 = 100.5
    assert df_ha.at[0, "ha_close"] == pytest.approx(100.5)
    # First ha_open = (100 + 102) / 2 = 101.0
    assert df_ha.at[0, "ha_open"] == pytest.approx(101.0)
    # ha_close < ha_open -> ha_bear is True, ha_bull is False
    assert df_ha.at[0, "ha_bear"] == True
    assert df_ha.at[0, "ha_bull"] == False

    # Second ha_open = (101.0 + 100.5) / 2 = 100.75
    assert df_ha.at[1, "ha_open"] == pytest.approx(100.75)


def test_bullish_pullback_and_breakout():
    """Test 3 bullish candles, 1 bearish pullback arming setup, followed by a breakout close."""
    rows = [
        {"open": 90.0, "high": 92.0, "low": 89.0, "close": 91.0},
        {"open": 92.0, "high": 98.0, "low": 92.0, "close": 97.0},
        {"open": 98.0, "high": 105.0, "low": 98.0, "close": 104.0},
        {"open": 104.0, "high": 112.0, "low": 104.0, "close": 111.0},
        # Bearish pullback candle arms long setup at high 112.0
        {"open": 108.0, "high": 112.0, "low": 90.0, "close": 92.0},
        # Breakout close above 112.0
        {"open": 105.0, "high": 118.0, "low": 104.0, "close": 115.0},
    ]
    df = pd.DataFrame(rows)
    df_sig = generate_signals(df, trend_bars=3, expiry_bars=5)

    assert df_sig.at[5, "signal"] == 1


def test_bearish_pullback_and_breakout():
    """Test 3 bearish candles, 1 bullish pullback arming setup, followed by a breakdown close."""
    rows = [
        {"open": 120.0, "high": 121.0, "low": 119.0, "close": 120.0},
        {"open": 120.0, "high": 120.0, "low": 112.0, "close": 113.0},
        {"open": 113.0, "high": 114.0, "low": 105.0, "close": 106.0},
        {"open": 106.0, "high": 106.0, "low": 98.0, "close": 99.0},
        # Bullish pullback candle arms short setup at low 97.0
        {"open": 99.0, "high": 125.0, "low": 97.0, "close": 124.0},
        # Breakdown close below 97.0
        {"open": 110.0, "high": 110.0, "low": 90.0, "close": 92.0},
    ]
    df = pd.DataFrame(rows)
    df_sig = generate_signals(df, trend_bars=3, expiry_bars=5)

    assert df_sig.at[5, "signal"] == -1


def test_setup_expiry_after_max_bars():
    """If breakout does not occur within expiry_bars, setup expires without generating signal."""
    rows = [
        {"open": 90.0, "high": 92.0, "low": 89.0, "close": 91.0},
        {"open": 92.0, "high": 98.0, "low": 92.0, "close": 97.0},
        {"open": 98.0, "high": 105.0, "low": 98.0, "close": 104.0},
        {"open": 104.0, "high": 112.0, "low": 104.0, "close": 111.0},
        # Pullback candle (high = 112.0)
        {"open": 108.0, "high": 112.0, "low": 90.0, "close": 92.0},
        # Flat candles where price stays below 112.0 beyond expiry_bars=2
        {"open": 92.0, "high": 95.0, "low": 91.0, "close": 94.0},
        {"open": 94.0, "high": 96.0, "low": 93.0, "close": 95.0},
        {"open": 95.0, "high": 97.0, "low": 94.0, "close": 96.0},
        # Breakout after expiry should NOT generate signal
        {"open": 96.0, "high": 118.0, "low": 95.0, "close": 115.0},
    ]
    df = pd.DataFrame(rows)
    df_sig = generate_signals(df, trend_bars=3, expiry_bars=2)

    assert df_sig["signal"].sum() == 0


def test_risk_levels_long_and_short():
    """Verify stop-loss and take-profit calculation formulas."""
    entry = 50000.0

    # Long: 0.3% stop-loss, 1.5% take-profit
    stop_l, target_l = risk_levels(entry, side=1, stop_pct=0.3, target_pct=1.5)
    assert stop_l == pytest.approx(49850.0)
    assert target_l == pytest.approx(50750.0)

    # Short: 0.3% stop-loss, 1.5% take-profit
    stop_s, target_s = risk_levels(entry, side=-1, stop_pct=0.3, target_pct=1.5)
    assert stop_s == pytest.approx(50150.0)
    assert target_s == pytest.approx(49250.0)


def test_risk_levels_invalid_inputs():
    """Verify validation on negative entry and invalid side."""
    with pytest.raises(ValueError, match="Entry must be positive"):
        risk_levels(-100.0, side=1)

    with pytest.raises(ValueError, match="side must be 1"):
        risk_levels(100.0, side=0)
