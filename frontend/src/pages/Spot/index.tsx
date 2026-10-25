import React, { useState } from 'react';
import { ArrowDownUp, Zap, Shield } from 'lucide-react';

export const SpotPage: React.FC = () => {
  const [payAmount, setPayAmount] = useState('1000');
  const [receiveAmount, setReceiveAmount] = useState('0.01483');

  const handlePayAmountChange = (val: string) => {
    setPayAmount(val);
    const num = parseFloat(val) || 0;
    setReceiveAmount((num / 67420.5).toFixed(5));
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Spot Execution Engine</span>
            <span className="bw-badge-sub">• Zero Spread Markup</span>
          </div>
          <h1 className="section-title">Spot Exchange &amp; Smart Order Router</h1>
          <p className="section-description">
            Sub-millisecond institutional spot liquidity matching with smart order routing across global and domestic pools.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Shield size={14} /> Slippage Protection
          </button>
          <button className="btn-primary">
            <Zap size={14} /> Zero Fee Pass
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Best Bid / Ask Spread</div>
          <div className="stat-value text-emerald">0.01 USDT</div>
          <div className="stat-trend positive">Aggregated Liquidity Pools</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Smart Order Routing (SOR)</div>
          <div className="stat-value">Active (5 Nodes)</div>
          <div className="stat-trend positive">Average Price Improvement: +$4.20</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Maker / Taker Tier</div>
          <div className="stat-value">VIP Quant (0.00%)</div>
          <div className="stat-trend neutral">Zero Trading Commission</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Settlement Speed</div>
          <div className="stat-value font-mono">&lt; 150 ms</div>
          <div className="stat-trend positive">Instant Custody Balance</div>
        </div>
      </div>

      <div className="cards-grid-two">
        {/* Swap Form */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-white font-bold">Instant Spot Swap</h3>
              <span className="text-muted text-xs">Direct OTC &amp; CLOB Order Matching</span>
            </div>
            <span className="bw-pill-new">ZERO FEE</span>
          </div>

          <div className="swap-card mt-2">
            <div className="swap-input-group">
              <label>You Pay (USDT / INR Equivalent)</label>
              <div className="input-with-symbol">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => handlePayAmountChange(e.target.value)}
                  className="swap-input"
                />
                <span className="token-tag">USDT</span>
              </div>
            </div>

            <div className="swap-divider">
              <button className="swap-btn-icon" title="Invert Pair">
                <ArrowDownUp size={15} />
              </button>
            </div>

            <div className="swap-input-group">
              <label>You Receive (BTC)</label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  value={receiveAmount}
                  readOnly
                  className="swap-input"
                />
                <span className="token-tag">BTC</span>
              </div>
            </div>

            <div className="perf-metric-row mt-2">
              <span className="text-muted text-xs">Guaranteed Exchange Rate</span>
              <span className="text-white text-xs font-mono">1 BTC = $67,420.50</span>
            </div>

            <button className="btn-primary w-full justify-center py-3 mt-3 font-bold text-sm">
              Execute Spot Buy Order
            </button>
          </div>
        </div>

        {/* Live Order Book */}
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-white font-bold">Live Order Book (BTC/USDT)</h3>
              <span className="text-muted text-xs">Depth: 50 Levels • Aggregation: 0.1</span>
            </div>
            <span className="badge-tag">Spread: 0.05</span>
          </div>

          <div className="orderbook-preview mt-2">
            <div className="ob-side asks">
              <div className="ob-row"><span className="text-rose font-mono">67,422.50</span><span className="text-muted font-mono">1.42 BTC</span></div>
              <div className="ob-row"><span className="text-rose font-mono">67,421.80</span><span className="text-muted font-mono">0.85 BTC</span></div>
              <div className="ob-row"><span className="text-rose font-mono">67,421.00</span><span className="text-muted font-mono">2.10 BTC</span></div>
            </div>
            <div className="ob-mid font-bold text-center py-2 text-white bg-dark-pill border-glow my-1 font-mono">
              $67,420.50 <span className="text-emerald text-xs ml-2">▲ Last Price</span>
            </div>
            <div className="ob-side bids">
              <div className="ob-row"><span className="text-emerald font-mono">67,420.00</span><span className="text-muted font-mono">3.40 BTC</span></div>
              <div className="ob-row"><span className="text-emerald font-mono">67,419.50</span><span className="text-muted font-mono">1.12 BTC</span></div>
              <div className="ob-row"><span className="text-emerald font-mono">67,418.00</span><span className="text-muted font-mono">4.95 BTC</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
