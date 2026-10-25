"""Heikin-Ashi Pullback Breakout Quantitative Strategy (Strategy 1).

Implements the institutional Heikin-Ashi Pullback Breakout algorithm with
dynamic multi-bar trend arming, opposite-color pullback setup levels,
and completed candle breakout confirmation with percentage-based risk stops.
"""

import datetime
from typing import List, Optional
import pandas as pd
from app.schemas.trading import Candle, SignalAction, StrategySignal
from strategy1 import generate_signals, heikin_ashi, risk_levels


class HeikinAshiStrategy:
    """Strategy 1: Heikin-Ashi Pullback Breakout with Risk Controls."""

    def __init__(
        self,
        trend_bars: int = 3,
        expiry_bars: int = 5,
        stop_pct: float = 0.3,
        target_pct: float = 1.5,
    ):
        self.trend_bars = trend_bars
        self.expiry_bars = expiry_bars
        self.stop_pct = stop_pct
        self.target_pct = target_pct
        self.last_evaluated_candle_time: Optional[int] = None
        self.last_signal: Optional[StrategySignal] = None

    @property
    def min_required_candles(self) -> int:
        return self.trend_bars + 3

    def evaluate(self, symbol: str, candles: List[Candle]) -> StrategySignal:
        """Evaluate Heikin-Ashi pullback breakout on chronological candles."""
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        if len(candles) < self.min_required_candles:
            return StrategySignal(
                symbol=symbol,
                action=SignalAction.HOLD,
                price=candles[-1].close if candles else 0.0,
                reason=f"Insufficient candles: got {len(candles)}, need at least {self.min_required_candles}",
                timestamp=now_iso,
                strategy_name="Strategy 1 - Heikin-Ashi Pullback Breakout",
            )

        # Convert to pandas DataFrame for calculation
        data = [
            {
                "open": c.open,
                "high": c.high,
                "low": c.low,
                "close": c.close,
                "volume": c.volume,
                "time": c.time,
            }
            for c in candles
        ]
        df = pd.DataFrame(data)

        # Generate signals
        df_sig = generate_signals(
            df, trend_bars=self.trend_bars, expiry_bars=self.expiry_bars
        )
        last_row = df_sig.iloc[-1]
        sig_val = int(last_row.get("signal", 0))
        curr_price = float(last_row["close"])
        self.last_evaluated_candle_time = int(last_row["time"])

        if sig_val == 1:
            sl, tp = risk_levels(curr_price, 1, self.stop_pct, self.target_pct)
            action = SignalAction.BUY
            reason = (
                f"Bullish Heikin-Ashi Pullback Breakout confirmed above armed level. "
                f"Stop-Loss: {sl:.2f} (-{self.stop_pct}%), Take-Profit: {tp:.2f} (+{self.target_pct}%)"
            )
        elif sig_val == -1:
            sl, tp = risk_levels(curr_price, -1, self.stop_pct, self.target_pct)
            action = SignalAction.SELL
            reason = (
                f"Bearish Heikin-Ashi Pullback Breakdown confirmed below armed level. "
                f"Stop-Loss: {sl:.2f} (+{self.stop_pct}%), Take-Profit: {tp:.2f} (-{self.target_pct}%)"
            )
        else:
            action = SignalAction.HOLD
            ha_trend = "Bullish" if last_row.get("ha_bull", False) else ("Bearish" if last_row.get("ha_bear", False) else "Neutral")
            reason = f"No active breakout trigger. Current Heikin-Ashi trend: {ha_trend}. Waiting for armed pullback breakout."

        signal = StrategySignal(
            symbol=symbol,
            action=action,
            price=curr_price,
            reason=reason,
            timestamp=now_iso,
            strategy_name="Strategy 1 - Heikin-Ashi Pullback Breakout",
            timeframe="1m",
            data_fresh=True,
        )
        self.last_signal = signal
        return signal
