import React from 'react';
import { Sliders, CheckCircle2 } from 'lucide-react';

export const RiskMonitorPage: React.FC = () => {
  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Risk Guard Matrix</span>
            <span className="bw-badge-sub">• Real-Time Hard Limits</span>
          </div>
          <h1 className="section-title">Risk Monitor &amp; Capital Protection</h1>
          <p className="section-description">
            Automated hard stop-loss guards, max daily drawdown circuit breakers, and sub-millisecond exposure bounds.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Sliders size={14} /> Adjust Thresholds
          </button>
          <div className="status-badge-live">
            <CheckCircle2 size={15} />
            <span>Circuit Armed</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Daily Max Drawdown Cap</div>
          <div className="stat-value">3.00% ($4,440)</div>
          <div className="stat-trend positive">Current Daily DD: 0.28% (Safe)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Single Asset Exposure</div>
          <div className="stat-value">25.0%</div>
          <div className="stat-trend positive">Top Asset: BTC (18.2%)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Value at Risk (VaR 99%)</div>
          <div className="stat-value">$2,180.00</div>
          <div className="stat-trend positive">Tolerance: &lt; $5,000</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Emergency Kill Switch</div>
          <div className="stat-value text-emerald">STANDBY READY</div>
          <div className="stat-trend neutral">0 Emergency Triggers</div>
        </div>
      </div>

      {/* Circuit Breakers & Safeguards List */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Automated Safeguard Protocols</h3>
            <span className="badge-tag">Pre-Trade Validation Engine</span>
          </div>
          <span className="bw-pill-new">ACTIVE 24/7</span>
        </div>

        <div className="perf-metric-list">
          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Volatile Market Spread Shield</div>
              <div className="text-muted text-xs">Halts new market entries if bid-ask spread exceeds 0.25%</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Fat Finger &amp; Max Notional Limiter</div>
              <div className="text-muted text-xs">Blocks single order executions exceeding $50,000 without dual sign-off</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">API Disconnect Dead Man's Switch</div>
              <div className="text-muted text-xs">Cancels all resting limit orders automatically if heartbeat drops for &gt;2000ms</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Auto Delta-Hedging Hedger Trigger</div>
              <div className="text-muted text-xs">Maintains portfolio net delta within -0.05 to +0.05 via perp micro-orders</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
