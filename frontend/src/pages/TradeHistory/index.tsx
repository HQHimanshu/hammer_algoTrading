import React from 'react';
import { Download, Filter } from 'lucide-react';

export const TradeHistoryPage: React.FC = () => {
  const executions = [
    { id: 'ORD-98421', timestamp: '11:48:02.148', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: '$67,390.00', amount: '0.45 BTC', fee: '$3.03', status: 'FILLED' },
    { id: 'ORD-98420', timestamp: '11:32:15.892', pair: 'ETH/USDT', side: 'BUY', type: 'MARKET', price: '$3,510.50', amount: '5.20 ETH', fee: '$9.12', status: 'FILLED' },
    { id: 'ORD-98419', timestamp: '11:14:40.012', pair: 'SOL/USDT', side: 'SELL', type: 'LIMIT', price: '$183.50', amount: '25.00 SOL', fee: '$2.29', status: 'FILLED' },
    { id: 'ORD-98418', timestamp: '10:55:12.784', pair: 'BTC/USDT', side: 'SELL', type: 'STOP_LOSS', price: '$66,800.00', amount: '0.20 BTC', fee: '$1.33', status: 'CANCELLED' },
    { id: 'ORD-98417', timestamp: '10:20:05.420', pair: 'BTC/USDT', side: 'BUY', type: 'LIMIT', price: '$66,410.00', amount: '1.00 BTC', fee: '$6.64', status: 'FILLED' },
  ];

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Trade History & Audit Logs</h2>
          <p className="section-description">Timestamped fills, microsecond latency records, and trade audit trail.</p>
        </div>
        <div className="header-action-group">
          <button className="btn-secondary">
            <Filter size={15} /> Filter Logs
          </button>
          <button className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Execution Journal</h3>
          <span className="badge-tag">Last 24 Hours</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Timestamp (UTC)</th>
                <th>Pair</th>
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
                <tr key={e.id}>
                  <td className="font-mono text-muted">{e.id}</td>
                  <td className="font-mono">{e.timestamp}</td>
                  <td className="font-semibold">{e.pair}</td>
                  <td>
                    <span className={`pill ${e.side === 'BUY' ? 'pill-green' : 'pill-red'}`}>
                      {e.side}
                    </span>
                  </td>
                  <td>{e.type}</td>
                  <td>{e.price}</td>
                  <td>{e.amount}</td>
                  <td className="text-muted">{e.fee}</td>
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
