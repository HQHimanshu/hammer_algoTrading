"""HAMMER Breakout v1.2 research backtest. READ-ONLY: never places orders.

15m close breakout of prior 20 completed candles, filtered by completed 1h
EMA200. ATR14 stop = 2 ATR; target = 1.5R (3 ATR). Entry next 15m open.
Generic underlying-price units are used; Delta contract multiplier, funding and
exchange-specific liquidation/margin mechanics are NOT modeled.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import numpy as np
import pandas as pd
from main import normalize_candles


def prepare_data(raw: pd.DataFrame, breakout_period: int = 20, atr_period: int = 14,
                 trend_ema: int = 200) -> pd.DataFrame:
    d = raw.copy().reset_index(drop=True)
    if "datetime" not in d:
        if "time" not in d:
            raise ValueError("CSV must include datetime or time column.")
        t = pd.to_numeric(d["time"], errors="coerce")
        unit = "ms" if t.dropna().median() > 10_000_000_000 else "s"
        d["datetime"] = pd.to_datetime(t, unit=unit, utc=True, errors="coerce")
    d["datetime"] = pd.to_datetime(d["datetime"], utc=True, errors="coerce")
    for c in ("open", "high", "low", "close"):
        d[c] = pd.to_numeric(d[c], errors="coerce")
    d = d.dropna(subset=["datetime", "open", "high", "low", "close"])
    d = d.sort_values("datetime").drop_duplicates("datetime").reset_index(drop=True)
    if len(d) < max(breakout_period, atr_period) + 5:
        raise ValueError("Not enough valid candles.")
    if (d[["open", "high", "low", "close"]] <= 0).any().any():
        raise ValueError("OHLC prices must be positive.")

    # True range and ATR (Wilder-style EMA approximation).
    prev_close = d["close"].shift(1)
    tr = pd.concat([(d["high"] - d["low"]),
                    (d["high"] - prev_close).abs(),
                    (d["low"] - prev_close).abs()], axis=1).max(axis=1)
    d["atr"] = tr.ewm(alpha=1 / atr_period, adjust=False, min_periods=atr_period).mean()
    d["prior_high"] = d["high"].shift(1).rolling(breakout_period).max()
    d["prior_low"] = d["low"].shift(1).rolling(breakout_period).min()

    # Resample open-timestamped 15m candles into 1h candles. Label at the hour
    # END, then backward as-of join, so a 1h candle is never used before close.
    indexed = d.set_index("datetime")
    hourly = indexed.resample("1h", label="right", closed="left").agg(
        open=("open", "first"), high=("high", "max"), low=("low", "min"),
        close=("close", "last"), count=("close", "count"))
    hourly = hourly[hourly["count"] == 4].copy()  # exclude incomplete hourly bars
    hourly["ema200_1h"] = hourly["close"].ewm(span=trend_ema, adjust=False,
                                                min_periods=trend_ema).mean()
    h = hourly[["ema200_1h"]].dropna().reset_index().rename(columns={"datetime": "trend_time"})
    d = pd.merge_asof(d.sort_values("datetime"), h.sort_values("trend_time"),
                      left_on="datetime", right_on="trend_time", direction="backward")
    d["signal"] = 0
    valid = d["atr"].notna() & d["ema200_1h"].notna()
    # Trigger only on a fresh close breakout, not on every candle that remains
    # beyond the rolling range. This prevents repeated same-direction re-entries.
    fresh_long = (d["close"] > d["prior_high"]) & (d["close"].shift(1) <= d["prior_high"].shift(1))
    fresh_short = (d["close"] < d["prior_low"]) & (d["close"].shift(1) >= d["prior_low"].shift(1))
    long = valid & fresh_long & (d["close"] > d["ema200_1h"])
    short = valid & fresh_short & (d["close"] < d["ema200_1h"])
    d.loc[long, "signal"] = 1
    d.loc[short, "signal"] = -1
    return d


def backtest(d: pd.DataFrame, equity0=10000.0, risk_pct=0.25, fee_bps=5.0,
             slippage_bps=2.0, max_exposure=1.0, stop_atr=2.0, target_r=1.5,
             daily_loss_pct=1.0, max_drawdown_pct=10.0, breakout_period=20):
    if min(equity0, risk_pct, max_exposure, stop_atr, target_r) <= 0:
        raise ValueError("Equity, risk, exposure, ATR stop and target R must be positive.")
    if min(fee_bps, slippage_bps, daily_loss_pct, max_drawdown_pct) < 0:
        raise ValueError("Costs and loss limits cannot be negative.")
    fee, slip = fee_bps / 10000, slippage_bps / 10000
    equity = float(equity0); peak = equity; maxdd = 0.0
    position = None; trades = []; curve = []
    day_start_equity = equity; current_day = None; day_locked = False; kill = False

    def close_pos(raw_exit, i, reason, gap=False):
        nonlocal equity, position
        p = position; side = p['side']
        if gap:
            raw_exit = min(raw_exit, p['stop']) if side == 1 else max(raw_exit, p['stop'])
        exit_px = raw_exit * (1 - slip * side)
        gross = p['qty'] * side * (exit_px - p['entry'])
        exit_fee = p['qty'] * exit_px * fee
        total_fees = p['entry_fee'] + exit_fee
        net = gross - total_fees
        equity += gross - exit_fee  # entry fee was debited at entry
        trades.append({"entry_time": d.iloc[p['entry_i']]['datetime'],
                       "exit_time": d.iloc[i]['datetime'], "side": "LONG" if side == 1 else "SHORT",
                       "entry": p['entry'], "exit": exit_px, "stop": p['stop'],
                       "target": p['target'], "qty_generic_units": p['qty'],
                       "risk_budget": p['risk_budget'], "gross_pnl": gross,
                       "fees": total_fees, "net_pnl": net, "exit_reason": reason})
        position = None

    for i in range(1, len(d)):
        row = d.iloc[i]; ts = row['datetime']; day = ts.date()
        if day != current_day:
            current_day = day; day_start_equity = equity; day_locked = False
        # Daily loss guard uses realized equity; global kill uses realized equity.
        if equity <= equity0 * (1 - max_drawdown_pct / 100): kill = True
        if equity <= day_start_equity * (1 - daily_loss_pct / 100): day_locked = True

        exited_this_bar = False
        if position is not None:
            p = position; o, h, l = float(row.open), float(row.high), float(row.low)
            stop_hit = l <= p['stop'] if p['side'] == 1 else h >= p['stop']
            target_hit = h >= p['target'] if p['side'] == 1 else l <= p['target']
            if stop_hit:
                gap = o < p['stop'] if p['side'] == 1 else o > p['stop']
                close_pos(o if gap else p['stop'], i, 'stop_loss', gap)
                exited_this_bar = True
            elif target_hit:
                gap = o >= p['target'] if p['side'] == 1 else o <= p['target']
                # Conservative target fill: do not grant a favorable gap-through fill.
                close_pos(p['target'], i, 'take_profit', False)
                exited_this_bar = True

        # Signal on previous completed candle; enter at current candle open.
        sig = int(d.iloc[i-1]['signal'])
        if position is None and not exited_this_bar and not kill and not day_locked and sig:
            entry = float(row.open) * (1 + slip * sig)
            atr = float(d.iloc[i-1]['atr'])
            if np.isfinite(atr) and atr > 0 and entry > 0:
                dist = atr * stop_atr
                stop = entry - sig * dist; target = entry + sig * dist * target_r
                budget = equity * risk_pct / 100
                qty = min(budget / dist, equity * max_exposure / entry)
                if qty > 0 and stop > 0 and target > 0:
                    entry_fee = qty * entry * fee
                    equity -= entry_fee
                    position = {"side": sig, "entry": entry, "stop": stop, "target": target,
                                "qty": qty, "risk_budget": budget, "entry_fee": entry_fee, "entry_i": i}
        marked = equity
        if position:
            marked += position['side'] * position['qty'] * (float(row.close) - position['entry'])
        peak = max(peak, marked)
        maxdd = max(maxdd, (peak - marked) / peak if peak > 0 else 0)
        curve.append({"time": ts, "equity": marked, "realized_equity": equity,
                      "daily_loss_locked": day_locked, "drawdown_kill": kill})
    if position is not None:
        close_pos(float(d.iloc[-1]['close']), len(d)-1, 'end_of_data')
        if curve: curve[-1]['equity'] = equity; curve[-1]['realized_equity'] = equity
    t = pd.DataFrame(trades); c = pd.DataFrame(curve)
    if t.empty:
        gross_win = gross_loss = net = wr = pf = 0.0
    else:
        wins = t.loc[t.net_pnl > 0, 'net_pnl']; losses = t.loc[t.net_pnl < 0, 'net_pnl']
        gross_win = float(wins.sum()); gross_loss = float(-losses.sum())
        net = float(t.net_pnl.sum()); wr = float((t.net_pnl > 0).mean() * 100)
        pf = gross_win / gross_loss if gross_loss else (float('inf') if gross_win else 0.0)
    # Accounting invariant: final realized equity = starting equity + sum of trade net P&L.
    reconcile = equity0 + (float(t.net_pnl.sum()) if not t.empty else 0.0)
    stats = {"strategy": f"breakout{breakout_period}_1h_ema_atr14", "candles": len(d), "trades": len(t),
             "win_rate_pct": wr, "gross_winning_trades_pnl": gross_win,
             "gross_losing_trades_pnl": gross_loss, "net_pnl": net,
             "starting_equity": equity0, "ending_equity": equity,
             "reconciled_equity": reconcile, "accounting_difference": equity - reconcile,
             "return_pct": (equity / equity0 - 1) * 100, "max_drawdown_pct": maxdd * 100,
             "profit_factor": pf, "fees_bps_per_side": fee_bps,
             "slippage_bps_per_side": slippage_bps, "risk_pct_per_trade": risk_pct,
             "breakout_period": int(breakout_period),
             "stop_atr_multiple": stop_atr, "target_R": target_r,
             "daily_loss_limit_pct": daily_loss_pct, "max_drawdown_kill_pct": max_drawdown_pct,
             "drawdown_kill_triggered": kill}
    return stats, t, c


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--csv', default='data/candles.csv'); p.add_argument('--symbol', default='BTCUSD')
    p.add_argument('--resolution', default='15m'); p.add_argument('--output-dir', default='results_breakout_v1_2')
    p.add_argument('--breakout-period', type=int, default=20); p.add_argument('--atr-period', type=int, default=14)
    p.add_argument('--trend-ema', type=int, default=200); p.add_argument('--stop-atr', type=float, default=2.0)
    p.add_argument('--target-r', type=float, default=1.5); p.add_argument('--equity', type=float, default=10000)
    p.add_argument('--risk-pct', type=float, default=0.25); p.add_argument('--fee-bps', type=float, default=5)
    p.add_argument('--slippage-bps', type=float, default=2); p.add_argument('--max-exposure', type=float, default=1.0)
    p.add_argument('--daily-loss-pct', type=float, default=1.0); p.add_argument('--max-drawdown-pct', type=float, default=10.0)
    a = p.parse_args()
    if a.breakout_period < 2 or a.atr_period < 2 or a.trend_ema < 2:
        p.error('indicator periods must be >= 2')
    csv = Path(a.csv)
    if not csv.exists(): raise SystemExit(f'CSV not found: {csv}')
    raw = normalize_candles(pd.read_csv(csv).to_dict('records'))
    d = prepare_data(raw, a.breakout_period, a.atr_period, a.trend_ema)
    stats, trades, curve = backtest(d, a.equity, a.risk_pct, a.fee_bps, a.slippage_bps,
                                    a.max_exposure, a.stop_atr, a.target_r,
                                    a.daily_loss_pct, a.max_drawdown_pct, a.breakout_period)
    out = Path(a.output_dir); out.mkdir(parents=True, exist_ok=True)
    d.to_csv(out/'breakout_signals.csv', index=False); trades.to_csv(out/'breakout_trades.csv', index=False)
    curve.to_csv(out/'breakout_equity_curve.csv', index=False); pd.DataFrame([stats]).to_csv(out/'breakout_summary.csv', index=False)
    print(f'{a.symbol} | {a.resolution} | {len(d)} candles | READ-ONLY research')
    print(f'Breakout={a.breakout_period}; 1h EMA={a.trend_ema}; ATR={a.atr_period}; stop={a.stop_atr} ATR; target={a.target_r}R')
    print(f'Risk={a.risk_pct}% | fees={a.fee_bps} bps/side | slippage={a.slippage_bps} bps/side')
    print('WARNING: generic underlying-price units; Delta contract multiplier, funding and margin/liquidation are not modeled.')
    print('\n--- SUMMARY ---'); print(pd.Series(stats).to_string())
    if not trades.empty: print('\n--- EXIT REASONS ---'); print(trades.groupby('exit_reason').agg(trades=('net_pnl','size'), net_pnl=('net_pnl','sum')).to_string())
    print(f'\nResults saved to: {out.resolve()}')

if __name__ == '__main__': main()
