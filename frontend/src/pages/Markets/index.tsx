import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, BarChart2 } from 'lucide-react';
import { ChartModal, type ChartAsset } from '../../components/common/ChartModal';

export const MarketsPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<ChartAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const marketData: ChartAsset[] = [
    { pair: 'BTC/USDT', price: '$67,420.50', change: '+2.84%', high: '$68,120.00', low: '$65,340.00', volume: '$1.42B', positive: true },
    { pair: 'ETH/USDT', price: '$3,518.20', change: '+1.92%', high: '$3,590.00', low: '$3,410.00', volume: '$840M', positive: true },
    { pair: 'SOL/USDT', price: '$181.65', change: '-1.45%', high: '$189.20', low: '$178.50', volume: '$420M', positive: false },
    { pair: 'BNB/USDT', price: '$594.10', change: '+0.65%', high: '$602.00', low: '$588.00', volume: '$190M', positive: true },
    { pair: 'AVAX/USDT', price: '$34.80', change: '-2.15%', high: '$36.20', low: '$33.90', volume: '$98M', positive: false },
  ];

  const filteredMarkets = marketData.filter((m) =>
    m.pair.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Live Markets</h2>
          <p className="section-description">
            Streaming multi-asset order books and real-time algorithmic price action. Click any asset to open the live chart.
          </p>
        </div>
        <button
          onClick={() => setSelectedAsset(marketData[0])}
          className="btn-primary"
          title="Open BTC/USDT Chart"
        >
          <BarChart2 size={16} /> Open BTC Chart
        </button>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3>Market Watchlist</h3>
            <span className="badge-tag">Click any row to open chart</span>
          </div>
          <div className="search-bar small">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter ticker..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table clickable-rows">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Mark Price</th>
                <th>24h Change</th>
                <th>24h High</th>
                <th>24h Low</th>
                <th>24h Volume</th>
                <th>Chart / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((m) => (
                <tr
                  key={m.pair}
                  onClick={() => setSelectedAsset(m)}
                  className="interactive-row"
                  title={`Click to view ${m.pair} chart`}
                >
                  <td className="font-semibold text-white">
                    <div className="pair-cell">
                      <BarChart2 size={15} className="pair-icon-hover text-emerald" />
                      <span>{m.pair}</span>
                    </div>
                  </td>
                  <td className="font-mono">{m.price}</td>
                  <td>
                    <span className={`stat-trend ${m.positive ? 'positive' : 'negative'}`}>
                      {m.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {m.change}
                    </span>
                  </td>
                  <td className="font-mono text-muted">{m.high}</td>
                  <td className="font-mono text-muted">{m.low}</td>
                  <td className="font-mono text-muted">{m.volume}</td>
                  <td>
                    <div className="row-action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedAsset(m)}
                        className="btn-sm btn-chart"
                        title="Open Interactive Chart"
                      >
                        <BarChart2 size={13} /> Chart
                      </button>
                      <button className="btn-sm btn-primary">Trade</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Modal */}
      <ChartModal
        asset={selectedAsset}
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
      />
    </div>
  );
};
