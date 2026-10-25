import React from 'react';
import { TrendingUp, Zap, Download } from 'lucide-react';

export const PortfolioPage: React.FC = () => {
  const positions = [
    { symbol: 'BTC/USDT', side: 'LONG', size: '2.50 BTC', entry: '$66,200.00', mark: '$67,420.50', pnl: '+$3,051.25', roe: '+18.4%' },
    { symbol: 'ETH/USDT', side: 'LONG', size: '30.00 ETH', entry: '$3,460.00', mark: '$3,518.20', pnl: '+$1,746.00', roe: '+16.8%' },
    { symbol: 'NIFTY 50 (F&O)', side: 'LONG', size: '150 Qty', entry: '₹24,780.00', mark: '₹24,850.10', pnl: '+₹10,515.00', roe: '+14.2%' },
    { symbol: 'SOL/USDT', side: 'SHORT', size: '100.00 SOL', entry: '$184.20', mark: '$181.65', pnl: '+$255.00', roe: '+1.38%' },
  ];

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Portfolio &amp; Risk Metrics</span>
            <span className="bw-badge-sub">• Mark-to-Market Realtime</span>
          </div>
          <h1 className="section-title">Portfolio &amp; Open Positions</h1>
          <p className="section-description">
            Consolidated cross-asset equity, margin maintenance, unrealized PnL, and live algorithmic exposure.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Download size={14} /> Tax &amp; PnL Statement
          </button>
          <button className="btn-primary">
            <Zap size={14} /> Rebalance Portfolio
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Net Asset Value (NAV)</div>
          <div className="stat-value">$148,290.40</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> +$5,052.25 Unrealized PnL
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Margin Maintenance Ratio</div>
          <div className="stat-value text-emerald">14.2% (Safe)</div>
          <div className="stat-trend positive">Liquidation Buffer: 85.8%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Available Free Margin</div>
          <div className="stat-value">$127,150.00</div>
          <div className="stat-trend neutral">Capital Utilization: 14.2%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">30-Day Realized Returns</div>
          <div className="stat-value text-white">+24.8%</div>
          <div className="stat-trend positive">Sharpe Ratio: 3.12</div>
        </div>
      </div>

      {/* Open Positions Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Open Trading Positions</h3>
            <span className="badge-tag">{positions.length} Active Positions</span>
          </div>
          <span className="bw-pill-new">LIVE MARGIN</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Contract / Symbol</th>
                <th>Side</th>
                <th>Position Size</th>
                <th>Entry Price</th>
                <th>Mark Price</th>
                <th>Unrealized PnL</th>
                <th>ROE %</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol} className="interactive-row">
                  <td className="font-semibold text-white">{p.symbol}</td>
                  <td>
                    <span className={`pill ${p.side === 'LONG' ? 'pill-green' : 'pill-red'}`}>
                      {p.side}
                    </span>
                  </td>
                  <td className="font-mono text-white">{p.size}</td>
                  <td className="font-mono text-muted">{p.entry}</td>
                  <td className="font-mono text-white font-bold">{p.mark}</td>
                  <td className="text-emerald font-bold font-mono">{p.pnl}</td>
                  <td className="text-emerald font-semibold font-mono">{p.roe}</td>
                  <td>
                    <button className="btn-sm btn-danger">Close</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
