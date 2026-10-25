import React from 'react';

export const PortfolioPage: React.FC = () => {
  const positions = [
    { symbol: 'BTC/USDT', side: 'LONG', size: '2.50 BTC', entry: '$66,200.00', mark: '$67,420.50', pnl: '+$3,051.25', roe: '+18.4%' },
    { symbol: 'ETH/USDT', side: 'LONG', size: '30.00 ETH', entry: '$3,460.00', mark: '$3,518.20', pnl: '+$1,746.00', roe: '+16.8%' },
    { symbol: 'SOL/USDT', side: 'SHORT', size: '100.00 SOL', entry: '$184.20', mark: '$181.65', pnl: '+$255.00', roe: '+1.38%' },
  ];

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Portfolio & Positions</h2>
          <p className="section-description">Real-time open exposures, margin utilization, and return on equity (ROE).</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Net Asset Value (NAV)</div>
          <div className="stat-value">$148,290.40</div>
          <div className="stat-trend positive">+3.4% this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Unrealized PnL</div>
          <div className="stat-value text-emerald">+$5,052.25</div>
          <div className="stat-trend positive">3 Active Positions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Margin Maintenance Ratio</div>
          <div className="stat-value">14.2%</div>
          <div className="stat-trend positive">Safe (Liquidation Buffer: 85.8%)</div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Open Trading Positions</h3>
          <span className="badge-tag">Mark Price Valuated</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Side</th>
                <th>Size</th>
                <th>Entry Price</th>
                <th>Mark Price</th>
                <th>Unrealized PnL</th>
                <th>ROE</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.symbol}>
                  <td className="font-semibold">{p.symbol}</td>
                  <td>
                    <span className={`pill ${p.side === 'LONG' ? 'pill-green' : 'pill-red'}`}>
                      {p.side}
                    </span>
                  </td>
                  <td>{p.size}</td>
                  <td>{p.entry}</td>
                  <td>{p.mark}</td>
                  <td className="text-emerald font-bold">{p.pnl}</td>
                  <td className="text-emerald font-semibold">{p.roe}</td>
                  <td>
                    <button className="btn-sm btn-danger">Close Position</button>
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
