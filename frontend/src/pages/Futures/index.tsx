import React, { useState } from 'react';
import { Shield, Zap, TrendingUp, Cpu } from 'lucide-react';

export const FuturesPage: React.FC = () => {
  const [leverage, setLeverage] = useState<number>(15);
  const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
  const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'Algo'>('Limit');

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Derivatives Engine</span>
            <span className="bw-badge-sub">• 0% Maker Fee With Pass</span>
          </div>
          <h1 className="section-title">Futures &amp; Derivatives Trading</h1>
          <p className="section-description">
            High-leverage perpetual swaps and dated futures with sub-millisecond in-memory risk management.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Shield size={14} /> Risk Guards
          </button>
          <button className="btn-primary">
            <Zap size={14} /> 1-Click Scalp Pass
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Open Futures Interest</div>
          <div className="stat-value">$48.2M</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> Long/Short Ratio: 1.18
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Next Funding Settlement</div>
          <div className="stat-value font-mono">01:42:18</div>
          <div className="stat-trend positive">Est. Rate: +0.0100% (8h)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Available Leverage</div>
          <div className="stat-value">50x Multiplier</div>
          <div className="stat-trend neutral">Dynamic Maintenance Margin</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Auto-Deleveraging (ADL)</div>
          <div className="stat-value text-emerald">Priority Safe</div>
          <div className="stat-trend positive">Insurance Fund: $14.2M</div>
        </div>
      </div>

      {/* Main Order Form & Matrix Grid */}
      <div className="cards-grid-two">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-white font-bold">Contract Order Terminal</h3>
              <span className="text-muted text-xs">BTCUSDT-PERP • Mark: $67,420.50</span>
            </div>

            <div className="filter-tab-pills">
              <button
                className={`tab-filter-btn ${marginMode === 'Cross' ? 'active' : ''}`}
                onClick={() => setMarginMode('Cross')}
              >
                Cross
              </button>
              <button
                className={`tab-filter-btn ${marginMode === 'Isolated' ? 'active' : ''}`}
                onClick={() => setMarginMode('Isolated')}
              >
                Isolated
              </button>
            </div>
          </div>

          {/* Order type pills */}
          <div className="filter-tab-pills w-full justify-start mt-2">
            {(['Limit', 'Market', 'Algo'] as const).map((t) => (
              <button
                key={t}
                className={`tab-filter-btn ${orderType === t ? 'active' : ''}`}
                onClick={() => setOrderType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="form-group mt-3">
            <div className="slider-header">
              <span className="text-secondary text-sm font-semibold">Leverage Multiplier</span>
              <span className="slider-val font-mono font-bold text-white bg-dark-pill px-2 py-0.5 rounded">
                {leverage}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="custom-range"
            />
            <div className="range-marks text-muted text-xs flex justify-between font-mono">
              <span>1x</span>
              <span>10x</span>
              <span>25x</span>
              <span>50x</span>
            </div>
          </div>

          <div className="swap-input-group mt-3">
            <label>Order Size (USDT)</label>
            <div className="input-with-symbol">
              <input
                type="number"
                defaultValue="5000"
                className="swap-input"
              />
              <span className="token-tag">USDT</span>
            </div>
          </div>

          <div className="order-actions-grid mt-4">
            <button className="btn-action btn-buy">
              Buy / Long ({(5000 * leverage).toLocaleString()} Notional)
            </button>
            <button className="btn-action btn-sell">
              Sell / Short ({(5000 * leverage).toLocaleString()} Notional)
            </button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3 className="text-white font-bold">Funding Rate Heatmap</h3>
            <span className="badge-tag">Dynamic 8h Settlement</span>
          </div>

          <div className="perf-metric-list">
            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">BTCUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: ~10.95%</div>
              </div>
              <span className="metric-val text-emerald">+0.0100%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">ETHUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: ~9.20%</div>
              </div>
              <span className="metric-val text-emerald">+0.0084%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">SOLUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: -2.40%</div>
              </div>
              <span className="metric-val text-rose">-0.0022%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">NIFTY Weekly Future</span>
                <div className="text-muted text-xs">Expiry: Thursday 15:30 IST</div>
              </div>
              <span className="metric-val text-white">Basis: +38.5 pts</span>
            </div>
          </div>

          <div className="card-note mt-3">
            <Cpu size={14} className="text-secondary" />
            <span className="text-xs text-muted">
              Hammer Quant Strategy actively collects positive basis across funding cycles with 0 delta exposure.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
