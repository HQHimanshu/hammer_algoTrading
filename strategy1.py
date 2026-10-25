
import pandas as pd


def heikin_ashi(df):
    """Calculate Heikin-Ashi candles from ordinary OHLC data."""
    df = df.copy()

    df["ha_close"] = (
        df["open"] + df["high"] + df["low"] + df["close"]
    ) / 4

    ha_open = [(df["open"].iloc[0] + df["close"].iloc[0]) / 2]

    for i in range(1, len(df)):
        ha_open.append(
            (ha_open[i - 1] + df["ha_close"].iloc[i - 1]) / 2
        )

    df["ha_open"] = ha_open
    df["ha_bull"] = df["ha_close"] > df["ha_open"]
    df["ha_bear"] = df["ha_close"] < df["ha_open"]

    return df


def generate_signals(df, trend_bars=3, expiry_bars=5):
    """
    Signal: 1 = long, -1 = short, 0 = no entry.

    Pullback levels use real candle highs/lows.
    Breakouts require a completed candle close beyond the level.
    """
    df = heikin_ashi(df).reset_index(drop=True)
    df["signal"] = 0

    long_level = short_level = None
    long_bar = short_bar = None

    for i in range(trend_bars, len(df)):
        previous = df.iloc[i-trend_bars:i]

        bullish_trend = previous["ha_bull"].all()
        bearish_trend = previous["ha_bear"].all()

        # Opposite-colour candle arms a setup.
        if bullish_trend and df.at[i, "ha_bear"]:
            long_level = float(df.at[i, "high"])
            long_bar = i
            short_level = short_bar = None

        elif bearish_trend and df.at[i, "ha_bull"]:
            short_level = float(df.at[i, "low"])
            short_bar = i
            long_level = long_bar = None

        # Expire old setups.
        if long_bar is not None and i - long_bar > expiry_bars:
            long_level = long_bar = None

        if short_bar is not None and i - short_bar > expiry_bars:
            short_level = short_bar = None

        if i == 0:
            continue

        # Confirm breakout using real closing prices.
        if long_level is not None and i > long_bar:
            if (df.at[i, "close"] > long_level
                    and df.at[i-1, "close"] <= long_level):
                df.at[i, "signal"] = 1
                long_level = long_bar = None

        elif short_level is not None and i > short_bar:
            if (df.at[i, "close"] < short_level
                    and df.at[i-1, "close"] >= short_level):
                df.at[i, "signal"] = -1
                short_level = short_bar = None

    return df


def risk_levels(entry, side, stop_pct=0.3, target_pct=1.5):
    """Calculate illustrative percentage-based stop and target."""
    if entry <= 0:
        raise ValueError("Entry must be positive")

    if side == 1:
        return entry * (1 - stop_pct / 100), \
               entry * (1 + target_pct / 100)

    if side == -1:
        return entry * (1 + stop_pct / 100), \
               entry * (1 - target_pct / 100)

    raise ValueError("side must be 1 (long) or -1 (short)")
