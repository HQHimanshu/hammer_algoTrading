import React from 'react';
import { Download, Filter } from 'lucide-react';

export const TradeHistoryPage: React.FC = () => {
  const executions = [
    { id: 'ORD-98421', timestamp: '14:12:02.148', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: '$67,390.00', amount: '0.45 BTC', fee: '$0.00', status: 'FILLED' },
    { id: 'ORD-98420', timestamp: '13:58:15.892', pair: 'NIFTY 24800 CE', side: 'BUY', type: 'MARKET', price: '₹142.50', amount: '150 Qty', fee: '₹0.00', status: 'FILLED' },
    { id: 'ORD-98419', timestamp: '13:34:40.012', pair: 'ETH/USDT', side: 'BUY', type: 'MARKET', price: '$3,510.50', amount: '5.20 ETH', fee: '$0.00', status: 'FILLED' },
    { id: 'ORD-98418', timestamp: '13:14:12.784', pair: 'SOL/USDT', side: 'SELL', type: 'LIMIT', price: '$183.50', amount: '25.00 SOL', fee: '$0.00', status: 'FILLED' },
    { id: 'ORD-98417', timestamp: '12:55:05.420', pair: 'BTC/USDT', side: 'SELL', type: 'STOP_LOSS', price: '$66,800.00', amount: '0.20 BTC', fee: '$0.00', status: 'CANCELLED' },
    { id: 'ORD-98416', timestamp: '12:20:11.910', pair: 'BANKNIFTY 51200 PE', side: 'SELL', type: 'LIMIT', price: '₹210.00', amount: '90 Qty', fee: '₹0.00', status: 'FILLED' },
  ];

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Audit Trail &amp; Logs</span>
            <span className="bw-badge-sub">• Microsecond Precision</span>
          </div>
          <h1 className="section-title">Trade History &amp; Audit Logs</h1>
          <p className="section-description">
            Complete institutional audit log of fills, cancellations, execution latencies, and routing diagnostics.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Filter size={14} /> Filter Range
          </button>
          <button className="btn-primary">
            <Download size={14} /> Export CSV / Tax Log
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">24h Orders Processed</div>
          <div className="stat-value">1,482 Orders</div>
          <div className="stat-trend positive">Fill Rate: 99.4%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Commission Saved</div>
          <div className="stat-value text-emerald">$1,248.60</div>
          <div className="stat-trend positive">Zero Fee Pass Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Fill Latency</div>
          <div className="stat-value font-mono">0.84 ms</div>
          <div className="stat-trend positive">Co-located Fiber Gateway</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Audit Hash Verification</div>
          <div className="stat-value text-white">SHA-256 Valid</div>
          <div className="stat-trend positive">Immutable Execution Trail</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Execution Journal</h3>
            <span className="badge-tag">Last 24 Hours (Realtime)</span>
          </div>
          <span className="bw-pill-new">ZERO FEE AUDIT</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Timestamp (IST / UTC)</th>
                <th>Contract / Symbol</th>
                <th>Side</th>
                <th>Order Type</th>
                <th>Executed Price</th>
                <th>Quantity</th>
                <th>Fee</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {executions.map((e) => (
                <tr key={e.id} className="interactive-row">
                  <td className="font-mono text-muted">{e.id}</td>
                  <td className="font-mono text-secondary">{e.timestamp}</td>
                  <td className="font-semibold text-white">{e.pair}</td>
                  <td>
                    <span className={`pill ${e.side === 'BUY' ? 'pill-green' : 'pill-red'}`}>
                      {e.side}
                    </span>
                  </td>
                  <td>
                    <span className="badge-tag">{e.type}</span>
                  </td>
                  <td className="font-mono text-white font-bold">{e.price}</td>
                  <td className="font-mono text-white">{e.amount}</td>
                  <td className="font-mono text-emerald">{e.fee}</td>
                  <td>
                    <span
                      className={`pill ${
                        e.status === 'FILLED' ? 'pill-green' : 'pill-gray'
                      }`}
                    >
                      {e.status}
                    </span>
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
