import React, { useState } from 'react';

export const FuturesPage: React.FC = () => {
  const [leverage, setLeverage] = useState<number>(10);
  const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Futures & Derivatives</h2>
          <p className="section-description">Perpetual contracts, automated funding arbitrage, and leverage controls.</p>
        </div>
      </div>

      <div className="cards-grid-two">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Contract Order Form (BTCUSDT-PERP)</h3>
            <div className="badge-group">
              <button 
                className={`tab-pill ${marginMode === 'Cross' ? 'active' : ''}`}
                onClick={() => setMarginMode('Cross')}
              >
                Cross
              </button>
              <button 
                className={`tab-pill ${marginMode === 'Isolated' ? 'active' : ''}`}
                onClick={() => setMarginMode('Isolated')}
              >
                Isolated
              </button>
            </div>
          </div>

          <div className="form-group">
            <div className="slider-header">
              <label>Leverage Multiplier</label>
              <span className="slider-val font-semibold text-emerald">{leverage}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="custom-range"
            />
          </div>

          <div className="order-actions-grid">
            <button className="btn-action btn-buy">Buy / Long</button>
            <button className="btn-action btn-sell">Sell / Short</button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Perpetual Funding Heatmap</h3>
            <span className="badge-tag">Next Countdown: 02:44:19</span>
          </div>

          <div className="perf-metric-list">
            <div className="perf-metric-row">
              <span>BTC-PERP Rate</span>
              <span className="metric-val text-emerald">+0.0100% / 8h</span>
            </div>
            <div className="perf-metric-row">
              <span>ETH-PERP Rate</span>
              <span className="metric-val text-emerald">+0.0084% / 8h</span>
            </div>
            <div className="perf-metric-row">
              <span>Estimated 24h Funding PnL</span>
              <span className="metric-val text-emerald">+$412.30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
