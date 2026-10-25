import React from 'react';
import { ArrowUpRight, TrendingUp, Activity, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Trading Overview</h2>
          <p className="section-description">
            High-frequency metrics, execution health, and algorithmic portfolio summary.
          </p>
        </div>
        <div className="status-badge-live">
          <span className="live-dot"></span>
          Strategy Engine Active
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Portfolio Value</div>
          <div className="stat-value">$148,290.40</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> +4.12% ($5,840 today)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Daily Realized PnL</div>
          <div className="stat-value text-emerald">+$3,418.20</div>
          <div className="stat-trend positive">
            <ArrowUpRight size={14} /> 28 Wins / 4 Losses
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Bots Running</div>
          <div className="stat-value">6 / 8</div>
          <div className="stat-trend neutral">
            <Zap size={14} /> 2 Idle / Standby
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Sharpe Ratio (30D)</div>
          <div className="stat-value">2.84</div>
          <div className="stat-trend positive">
            <Activity size={14} /> Max Drawdown: 2.1%
          </div>
        </div>
      </div>

      <div className="cards-grid-two">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Active Strategy Signals</h3>
            <span className="badge-tag">Realtime Feed</span>
          </div>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Strategy</th>
                  <th>Pair</th>
                  <th>Type</th>
                  <th>Trigger Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Mean Reversion Alpha</td>
                  <td>BTC/USDT</td>
                  <td><span className="pill pill-green">LONG</span></td>
                  <td>$67,390.00</td>
                  <td><span className="text-emerald">Executing (98%)</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">Momentum Breakout</td>
                  <td>ETH/USDT</td>
                  <td><span className="pill pill-green">LONG</span></td>
                  <td>$3,510.50</td>
                  <td><span className="text-emerald">Filled</span></td>
                </tr>
                <tr>
                  <td className="font-semibold">Funding Rate Arb</td>
                  <td>SOL/USDT</td>
                  <td><span className="pill pill-red">SHORT</span></td>
                  <td>$182.25</td>
                  <td><span className="text-amber">Monitoring</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Execution Performance</h3>
            <span className="badge-tag">Zero Slip Guard</span>
          </div>
          <div className="perf-metric-list">
            <div className="perf-metric-row">
              <span>Avg Order Latency</span>
              <span className="metric-val">1.4ms</span>
            </div>
            <div className="perf-metric-row">
              <span>Slippage Protection</span>
              <span className="metric-val text-emerald">Active (&lt;0.02%)</span>
            </div>
            <div className="perf-metric-row">
              <span>Exchange API Handshake</span>
              <span className="metric-val text-emerald">Optimal (WebSocket 2.0)</span>
            </div>
            <div className="perf-metric-row">
              <span>Emergency Circuit Breaker</span>
              <span className="metric-val">Ready (Armed)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
