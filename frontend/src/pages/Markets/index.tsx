import React from 'react';
import { ArrowUpRight, ArrowDownRight, Search } from 'lucide-react';

export const MarketsPage: React.FC = () => {
  const marketData = [
    { pair: 'BTC/USDT', price: '$67,420.50', change: '+2.84%', high: '$68,120.00', low: '$65,340.00', volume: '$1.42B', positive: true },
    { pair: 'ETH/USDT', price: '$3,518.20', change: '+1.92%', high: '$3,590.00', low: '$3,410.00', volume: '$840M', positive: true },
    { pair: 'SOL/USDT', price: '$181.65', change: '-1.45%', high: '$189.20', low: '$178.50', volume: '$420M', positive: false },
    { pair: 'BNB/USDT', price: '$594.10', change: '+0.65%', high: '$602.00', low: '$588.00', volume: '$190M', positive: true },
    { pair: 'AVAX/USDT', price: '$34.80', change: '-2.15%', high: '$36.20', low: '$33.90', volume: '$98M', positive: false },
  ];

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Live Markets</h2>
          <p className="section-description">Streaming multi-asset order books and real-time algorithmic price action.</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Market Watchlist</h3>
          <div className="search-bar small">
            <Search size={14} />
            <input type="text" placeholder="Filter ticker..." className="search-input" />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Mark Price</th>
                <th>24h Change</th>
                <th>24h High</th>
                <th>24h Low</th>
                <th>24h Volume</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((m) => (
                <tr key={m.pair}>
                  <td className="font-semibold">{m.pair}</td>
                  <td>{m.price}</td>
                  <td>
                    <span className={`stat-trend ${m.positive ? 'positive' : 'negative'}`}>
                      {m.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {m.change}
                    </span>
                  </td>
                  <td>{m.high}</td>
                  <td>{m.low}</td>
                  <td>{m.volume}</td>
                  <td>
                    <button className="btn-sm btn-primary">Trade</button>
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
