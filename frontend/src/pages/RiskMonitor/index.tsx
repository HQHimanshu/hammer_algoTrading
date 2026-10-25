import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const RiskMonitorPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Risk Monitor & Capital Protection</h2>
          <p className="section-description">
            Automated hard stop-loss guards, max daily drawdown circuit breakers, and exposure bounds.
          </p>
        </div>
        <div className="status-badge-live">
          <ShieldCheck size={16} />
          Protection Matrix Armed
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Daily Max Drawdown Limit</div>
          <div className="stat-value">3.00% ($4,440)</div>
          <div className="stat-trend positive">Current Daily DD: 0.28%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Single Position Exposure</div>
          <div className="stat-value">25.0%</div>
          <div className="stat-trend positive">Highest Asset: BTC (18.2%)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Value at Risk (VaR 99%)</div>
          <div className="stat-value">$2,180.00</div>
          <div className="stat-trend positive">Within Tolerance (&lt; $5,000)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Kill Switch Status</div>
          <div className="stat-value text-emerald">READY</div>
          <div className="stat-trend neutral">0 Emergency Triggers</div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Emergency Circuit Breakers & Safeguards</h3>
          <span className="badge-tag">Automated Pre-Trade Checks</span>
        </div>

        <div className="perf-metric-list">
          <div className="perf-metric-row">
            <div>
              <div className="font-semibold">Volatile Market Spread Shield</div>
              <div className="text-muted text-sm">Halt new market entries if bid-ask spread exceeds 0.25%</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold">Fat Finger & Notional Size Limiter</div>
              <div className="text-muted text-sm">Block orders exceeding $50,000 single execution size</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold">API Disconnect Auto-Cancel (Dead Man's Switch)</div>
              <div className="text-muted text-sm">Cancel all resting limit orders if ping lost for &gt;3000ms</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
