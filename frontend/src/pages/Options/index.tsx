import React, { useState } from 'react';
import { ShieldCheck, Zap, Activity } from 'lucide-react';

export const OptionsPage: React.FC = () => {
  const [expiry, setExpiry] = useState('29MAR26');
  const [assetFilter, setAssetFilter] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="Delta logo">⚡</span>
            <span>Delta Crypto Options Matrix</span>
            <span className="bw-badge-sub">• 0 Fee on OTM Expiry</span>
          </div>
          <h1 className="section-title">Options Contracts &amp; Volatility Surface</h1>
          <p className="section-description">
            Multi-strike European crypto options with real-time Greek sensitivities and delta-neutral hedging.
          </p>
        </div>

        <div className="header-action-group">
          <div className="filter-tab-pills">
            {(['BTC', 'ETH', 'SOL'] as const).map((a) => (
              <button
                key={a}
                className={`tab-filter-btn ${assetFilter === a ? 'active' : ''}`}
                onClick={() => setAssetFilter(a)}
              >
                {a} Options
              </button>
            ))}
          </div>
          <button className="btn-primary">
            <Zap size={14} /> Strategy Builder
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Implied Volatility Index (IV)</div>
          <div className="stat-value">54.2%</div>
          <div className="stat-trend positive">
            <Activity size={14} /> 30-Day Realized Vol: 48.6%
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Put / Call Volume Ratio</div>
          <div className="stat-value">0.74 (Bullish)</div>
          <div className="stat-trend positive">Max Pain: $66,500 Strike</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Portfolio Delta Exposure</div>
          <div className="stat-value font-mono">+0.04 Δ</div>
          <div className="stat-trend positive">
            <ShieldCheck size={14} /> Delta-Neutral Hedged
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Daily Theta Collection</div>
          <div className="stat-value text-emerald">+$420.50 / day</div>
          <div className="stat-trend neutral">Decay Harvest Optimal</div>
        </div>
      </div>

      {/* Options Chain Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">{assetFilter} Option Chain ({expiry})</h3>
            <span className="badge-tag">Underlying: $67,420.50</span>
          </div>

          <div className="filter-tab-pills">
            {['29MAR26', '05APR26', '26APR26'].map((exp) => (
              <button
                key={exp}
                className={`tab-filter-btn ${expiry === exp ? 'active' : ''}`}
                onClick={() => setExpiry(exp)}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table text-center">
            <thead>
              <tr>
                <th colSpan={4} className="border-right text-emerald font-bold">CALLS (Long / Short)</th>
                <th className="text-white font-bold">STRIKE PRICE</th>
                <th colSpan={4} className="border-left text-rose font-bold">PUTS (Long / Short)</th>
              </tr>
              <tr>
                <th>Bid</th>
                <th>Ask</th>
                <th>IV</th>
                <th className="border-right">Delta</th>
                <th className="font-bold text-white bg-dark-pill">Strike</th>
                <th className="border-left">Delta</th>
                <th>IV</th>
                <th>Bid</th>
                <th>Ask</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono text-white">$3,840</td>
                <td className="font-mono text-muted">$3,890</td>
                <td className="font-mono">52.1%</td>
                <td className="border-right font-mono text-emerald">0.68</td>
                <td className="font-bold font-mono text-white bg-dark-row">$66,000</td>
                <td className="border-left font-mono text-rose">-0.32</td>
                <td className="font-mono">51.9%</td>
                <td className="font-mono text-white">$2,410</td>
                <td className="font-mono text-muted">$2,450</td>
              </tr>
              <tr className="bg-atm-row">
                <td className="font-mono text-white">$3,120</td>
                <td className="font-mono text-muted">$3,180</td>
                <td className="font-mono">53.4%</td>
                <td className="border-right font-mono text-emerald">0.52</td>
                <td className="font-bold font-mono text-white bg-dark-row border-glow">
                  $67,000 <span className="bw-pill-new ml-1">ATM</span>
                </td>
                <td className="border-left font-mono text-rose">-0.48</td>
                <td className="font-mono">53.2%</td>
                <td className="font-mono text-white">$2,820</td>
                <td className="font-mono text-muted">$2,860</td>
              </tr>
              <tr>
                <td className="font-mono text-white">$2,540</td>
                <td className="font-mono text-muted">$2,590</td>
                <td className="font-mono">55.1%</td>
                <td className="border-right font-mono text-emerald">0.39</td>
                <td className="font-bold font-mono text-white bg-dark-row">$68,000</td>
                <td className="border-left font-mono text-rose">-0.61</td>
                <td className="font-mono">54.8%</td>
                <td className="font-mono text-white">$3,290</td>
                <td className="font-mono text-muted">$3,340</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
