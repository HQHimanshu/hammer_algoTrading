"""Deterministic Moving Average Crossover Strategy with RSI Confirmation.

Strategy Rules:
1. Fast Simple Moving Average (SMA) and Slow Simple Moving Average (SMA) are computed on Close prices.
2. Crossover Detection:
   - Golden Cross: Fast SMA crosses strictly ABOVE Slow SMA on current candle (prev_fast <= prev_slow and curr_fast > curr_slow).
   - Death Cross: Fast SMA crosses strictly BELOW Slow SMA on current candle (prev_fast >= prev_slow and curr_fast < curr_slow).
3. RSI Filter:
   - For Golden Cross: RSI must be below the overbought threshold (default 70.0) to confirm buying momentum without buying an overextended peak.
   - For Death Cross: RSI must be above the oversold threshold (default 30.0) to confirm exit without selling into an oversold capitulation.
4. Signals:
   - BUY: Golden Cross confirmed by RSI. Semantics: Open long position or add if within limits.
   - SELL: Death Cross confirmed by RSI. Semantics: Close existing long position.
   - HOLD: No crossover event, insufficient data, or RSI veto.
"""

import datetime
from typing import List, Optional, Tuple
from app.schemas.trading import Candle, SignalAction, StrategySignal


class MovingAverageRsiStrategy:
    """Deterministic Moving Average Crossover with RSI confirmation."""

    def __init__(
        self,
        fast_period: int = 5,
        slow_period: int = 15,
        rsi_period: int = 14,
        rsi_overbought: float = 70.0,
        rsi_oversold: float = 30.0,
    ):
        if fast_period >= slow_period:
            raise ValueError(
                f"fast_period ({fast_period}) must be strictly less than slow_period ({slow_period})"
            )
        if rsi_period < 2:
            raise ValueError("rsi_period must be at least 2")

        self.fast_period = fast_period
        self.slow_period = slow_period
        self.rsi_period = rsi_period
        self.rsi_overbought = rsi_overbought
        self.rsi_oversold = rsi_oversold

        # State tracking to avoid duplicate signals on the same candle
        self.last_evaluated_candle_time: Optional[int] = None
        self.last_signal: Optional[StrategySignal] = None

    @property
    def min_required_candles(self) -> int:
        """Minimum number of observations needed to compute crossover and RSI."""
        return max(self.slow_period + 1, self.rsi_period + 1)

    @staticmethod
    def calculate_sma(prices: List[float], period: int) -> float:
        """Calculate simple moving average of the most recent `period` prices."""
        if len(prices) < period:
            raise ValueError(f"Insufficient data for SMA({period}): got {len(prices)} values")
        subset = prices[-period:]
        return sum(subset) / period

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> float:
        """Calculate Relative Strength Index (RSI) using standard delta averaging.

        Formula:
        RS = Average Gain / Average Loss
        RSI = 100 - (100 / (1 + RS))
        """
        if len(prices) < period + 1:
            raise ValueError(f"Insufficient data for RSI({period}): need {period + 1} prices")

        # Calculate price changes over the window
        deltas = [prices[i] - prices[i - 1] for i in range(len(prices) - period, len(prices))]

        gains = [d for d in deltas if d > 0]
        losses = [-d for d in deltas if d < 0]

        avg_gain = sum(gains) / period if gains else 0.0
        avg_loss = sum(losses) / period if losses else 0.0

        if avg_loss == 0.0:
            return 100.0 if avg_gain > 0 else 50.0

        rs = avg_gain / avg_loss
        return 100.0 - (100.0 / (1.0 + rs))

    def evaluate(self, symbol: str, candles: List[Candle]) -> StrategySignal:
        """Evaluate market candles and return a deterministic StrategySignal.

        Input candles must be sorted chronologically (oldest first, latest last).
        """
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        # 1. Validate candle count
        if not candles or len(candles) < self.min_required_candles:
            reason = (
                f"Insufficient market observations: provided {len(candles) if candles else 0}, "
                f"minimum required {self.min_required_candles}."
            )
            return StrategySignal(
                symbol=symbol,
                action=SignalAction.HOLD,
                price=candles[-1].close if candles else 0.0,
                fast_ma=None,
                slow_ma=None,
                rsi=None,
                reason=reason,
                timestamp=now_iso,
                strategy_name="Strategy 1 - Golden Cross + RSI Confirmation",
                crossover="NONE",
                rsi_confirmed=None,
                risk_eligible=None,
                data_fresh=False,
                execution_eligible=False,
            )

        # 2. Validate candle values (positive, non-zero, finite numbers)
        import math
        for idx, c in enumerate(candles):
            if (
                c.close <= 0.0
                or c.open <= 0.0
                or c.high < c.low
                or math.isnan(c.close)
                or math.isinf(c.close)
            ):
                return StrategySignal(
                    symbol=symbol,
                    action=SignalAction.HOLD,
                    price=candles[-1].close,
                    fast_ma=None,
                    slow_ma=None,
                    rsi=None,
                    reason=f"Invalid candle data at index {idx}: non-positive or non-finite price encountered.",
                    timestamp=now_iso,
                    strategy_name="Strategy 1 - Golden Cross + RSI Confirmation",
                    crossover="NONE",
                    rsi_confirmed=None,
                    risk_eligible=None,
                    data_fresh=False,
                    execution_eligible=False,
                )

        # 3. Validate chronological ordering
        for i in range(1, len(candles)):
            if candles[i].time <= candles[i - 1].time:
                return StrategySignal(
                    symbol=symbol,
                    action=SignalAction.HOLD,
                    price=candles[-1].close,
                    fast_ma=None,
                    slow_ma=None,
                    rsi=None,
                    reason="Invalid market data: candle timestamps must be strictly ascending chronologically.",
                    timestamp=now_iso,
                    strategy_name="Strategy 1 - Golden Cross + RSI Confirmation",
                    crossover="NONE",
                    rsi_confirmed=None,
                    risk_eligible=None,
                    data_fresh=False,
                    execution_eligible=False,
                )

        # 4. Check data freshness (candle timestamp within reasonable boundary)
        import time
        now_ts = int(time.time())
        latest_candle = candles[-1]
        current_price = latest_candle.close
        # If timestamp is a real Unix epoch (> 1_000_000), check if older than 24 hours (86400s)
        is_stale = latest_candle.time > 1_000_000 and (now_ts - latest_candle.time > 86400)
        data_fresh = not is_stale

        # Check duplicate candle timestamp
        if (
            self.last_evaluated_candle_time is not None
            and latest_candle.time == self.last_evaluated_candle_time
        ):
            return StrategySignal(
                symbol=symbol,
                action=SignalAction.HOLD,
                price=current_price,
                fast_ma=self.last_signal.fast_ma if self.last_signal else None,
                slow_ma=self.last_signal.slow_ma if self.last_signal else None,
                rsi=self.last_signal.rsi if self.last_signal else None,
                reason=f"Holding: candle {latest_candle.time} was already evaluated.",
                timestamp=now_iso,
                strategy_name="Strategy 1 - Golden Cross + RSI Confirmation",
                crossover="NONE",
                rsi_confirmed=None,
                risk_eligible=None,
                data_fresh=data_fresh,
                execution_eligible=False,
            )

        # 5. Compute indicators for current candle and previous candle
        closes = [c.close for c in candles]
        curr_fast_ma = self.calculate_sma(closes, self.fast_period)
        curr_slow_ma = self.calculate_sma(closes, self.slow_period)

        prev_closes = closes[:-1]
        prev_fast_ma = self.calculate_sma(prev_closes, self.fast_period)
        prev_slow_ma = self.calculate_sma(prev_closes, self.slow_period)

        # Current RSI
        curr_rsi = self.calculate_rsi(closes, self.rsi_period)

        # 6. Genuine crossover detection
        golden_cross = (prev_fast_ma <= prev_slow_ma) and (curr_fast_ma > curr_slow_ma)
        death_cross = (prev_fast_ma >= prev_slow_ma) and (curr_fast_ma < curr_slow_ma)

        action = SignalAction.HOLD
        crossover_status = "NONE"
        rsi_confirmed: Optional[bool] = None

        if golden_cross:
            crossover_status = "GOLDEN_CROSS"
            if curr_rsi < self.rsi_overbought:
                action = SignalAction.BUY
                rsi_confirmed = True
                reason = (
                    f"BUY Signal: Golden Cross detected (Fast MA {curr_fast_ma:.2f} crossed above "
                    f"Slow MA {curr_slow_ma:.2f}). RSI {curr_rsi:.1f} confirms bullish trend (< {self.rsi_overbought})."
                )
            else:
                action = SignalAction.HOLD
                rsi_confirmed = False
                reason = (
                    f"HOLD: Golden Cross detected but vetoed by RSI ({curr_rsi:.1f} >= {self.rsi_overbought}) "
                    "indicating overbought market."
                )

        elif death_cross:
            crossover_status = "DEATH_CROSS"
            if curr_rsi > self.rsi_oversold:
                action = SignalAction.SELL
                rsi_confirmed = True
                reason = (
                    f"SELL Signal: Death Cross detected (Fast MA {curr_fast_ma:.2f} crossed below "
                    f"Slow MA {curr_slow_ma:.2f}). RSI {curr_rsi:.1f} confirms exit (> {self.rsi_oversold})."
                )
            else:
                action = SignalAction.HOLD
                rsi_confirmed = False
                reason = (
                    f"HOLD: Death Cross detected but vetoed by RSI ({curr_rsi:.1f} <= {self.rsi_oversold}) "
                    "indicating oversold capitulation."
                )
        else:
            crossover_status = "NONE"
            rsi_confirmed = None
            action = SignalAction.HOLD
            if curr_fast_ma > curr_slow_ma:
                reason = (
                    f"HOLD: Fast MA({self.fast_period})={curr_fast_ma:.2f} is above Slow MA({self.slow_period})={curr_slow_ma:.2f}, "
                    f"but no new Golden Cross occurred on this candle. RSI={curr_rsi:.1f}."
                )
            elif curr_fast_ma < curr_slow_ma:
                reason = (
                    f"HOLD: Fast MA({self.fast_period})={curr_fast_ma:.2f} is below Slow MA({self.slow_period})={curr_slow_ma:.2f}, "
                    f"but no new Death Cross occurred on this candle. RSI={curr_rsi:.1f}."
                )
            else:
                reason = (
                    f"HOLD: Fast MA({self.fast_period}) equals Slow MA({self.slow_period}) ({curr_fast_ma:.2f}). "
                    f"No crossover detected. RSI={curr_rsi:.1f}."
                )

        signal = StrategySignal(
            symbol=symbol,
            action=action,
            price=current_price,
            fast_ma=round(curr_fast_ma, 4),
            slow_ma=round(curr_slow_ma, 4),
            rsi=round(curr_rsi, 2),
            reason=reason,
            timestamp=now_iso,
            strategy_name="Strategy 1 - Golden Cross + RSI Confirmation",
            crossover=crossover_status,
            rsi_confirmed=rsi_confirmed,
            risk_eligible=True if action != SignalAction.HOLD else None,
            data_fresh=data_fresh,
            execution_eligible=(action != SignalAction.HOLD and data_fresh),
        )

        # Update evaluation state
        self.last_evaluated_candle_time = latest_candle.time
        self.last_signal = signal
        return signal
