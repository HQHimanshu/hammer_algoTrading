import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Search, BarChart2, TrendingUp } from 'lucide-react';
import { ChartModal, type ChartAsset } from '../../components/common/ChartModal';

interface MarketsPageProps {
  onSelectChart?: (pair: string) => void;
}

export const MarketsPage: React.FC<MarketsPageProps> = ({ onSelectChart }) => {
  const [selectedAsset, setSelectedAsset] = useState<ChartAsset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'crypto' | 'indices' | 'top-gainers'>('all');

  const marketData: ChartAsset[] = [
    { pair: 'BTC/USDT', price: '$67,420.50', change: '+2.84%', high: '$68,120.00', low: '$65,340.00', volume: '$1.42B', positive: true },
    { pair: 'ETH/USDT', price: '$3,518.20', change: '+1.92%', high: '$3,590.00', low: '$3,410.00', volume: '$840M', positive: true },
    { pair: 'SOL/USDT', price: '$181.65', change: '-1.45%', high: '$189.20', low: '$178.50', volume: '$420M', positive: false },
    { pair: 'NIFTY 50 (F&O)', price: '₹24,850.10', change: '+0.72%', high: '₹24,920.00', low: '₹24,780.00', volume: '₹14,200 Cr', positive: true },
    { pair: 'BANKNIFTY (F&O)', price: '₹51,420.00', change: '+1.15%', high: '₹51,680.00', low: '₹51,100.00', volume: '₹18,500 Cr', positive: true },
    { pair: 'BNB/USDT', price: '$594.10', change: '+0.65%', high: '$602.00', low: '$588.00', volume: '$190M', positive: true },
    { pair: 'AVAX/USDT', price: '$34.80', change: '-2.15%', high: '$36.20', low: '$33.90', volume: '$98M', positive: false },
  ];

  const filteredMarkets = marketData.filter((m) => {
    const matchesSearch = m.pair.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (marketFilter === 'crypto') return m.pair.includes('USDT');
    if (marketFilter === 'indices') return m.pair.includes('NIFTY');
    if (marketFilter === 'top-gainers') return m.positive;
    return true;
  });

  return (
    <div className="page-container">
      {/* Header section with badge */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Indian F&amp;O + Crypto Derivatives</span>
            <span className="bw-badge-sub">• Ultra-Low Latency Feed</span>
          </div>
          <h1 className="section-title">Live Markets & Order Book</h1>
          <p className="section-description">
            Direct streaming exchange feeds, tick-by-tick order flow, and institutional algorithmic execution corridors.
          </p>
        </div>

        <button
          onClick={() => {
            if (onSelectChart) {
              onSelectChart('BTCUSD');
            } else {
              setSelectedAsset(marketData[0]);
            }
          }}
          className="btn-primary"
          title="Open BTC/USDT Chart"
        >
          <BarChart2 size={15} /> Open Live BTC Chart
        </button>
      </div>

      {/* Stats Summary row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">24h Derivative Turnover</div>
          <div className="stat-value">$2.94B / ₹24,800 Cr</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> +18.4% vs 7D Avg
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tick-To-Trade Latency</div>
          <div className="stat-value text-emerald">0.82 ms</div>
          <div className="stat-trend positive">Colocated In-Memory Fiber</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Zero-Fee Eligible Pairs</div>
          <div className="stat-value">28 Assets</div>
          <div className="stat-trend neutral">Maker Rebate Active (0.01%)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active HFT Market Makers</div>
          <div className="stat-value">14 Running</div>
          <div className="stat-trend positive">Continuous Tight Spread</div>
        </div>
      </div>

      {/* Main Watchlist Card */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Market Watchlist</h3>
            {/* Filter Tabs */}
            <div className="filter-tab-pills">
              <button
                className={`tab-filter-btn ${marketFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMarketFilter('all')}
              >
                All Markets
              </button>
              <button
                className={`tab-filter-btn ${marketFilter === 'indices' ? 'active' : ''}`}
                onClick={() => setMarketFilter('indices')}
              >
                NSE / Indian F&amp;O
              </button>
              <button
                className={`tab-filter-btn ${marketFilter === 'crypto' ? 'active' : ''}`}
                onClick={() => setMarketFilter('crypto')}
              >
                Crypto Perps
              </button>
              <button
                className={`tab-filter-btn ${marketFilter === 'top-gainers' ? 'active' : ''}`}
                onClick={() => setMarketFilter('top-gainers')}
              >
                Top Gainers
              </button>
            </div>
          </div>

          <div className="search-bar small">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search ticker (BTC, NIFTY)..."
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
                <th>Asset / Ticker</th>
                <th>Mark Price</th>
                <th>24h Change</th>
                <th>24h High</th>
                <th>24h Low</th>
                <th>24h Volume</th>
                <th>Execution</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarkets.map((m) => (
                <tr
                  key={m.pair}
                  onClick={() => {
                    if (onSelectChart) {
                      onSelectChart(m.pair);
                    } else {
                      setSelectedAsset(m);
                    }
                  }}
                  className="interactive-row"
                  title={`Click to open full-page ${m.pair} trading terminal`}
                >
                  <td className="font-semibold text-white">
                    <div className="pair-cell">
                      <BarChart2 size={15} className="pair-icon-hover text-white" />
                      <span>{m.pair}</span>
                      {m.pair.includes('NIFTY') ? (
                        <span className="bw-pill-new">INDIA</span>
                      ) : (
                        <span className="badge-tag">PERP</span>
                      )}
                    </div>
                  </td>
                  <td className="font-mono text-white font-bold">{m.price}</td>
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
                        onClick={() => {
                          if (onSelectChart) {
                            onSelectChart(m.pair);
                          } else {
                            setSelectedAsset(m);
                          }
                        }}
                        className="btn-sm btn-chart"
                        title="Open Full-Page Trading Chart"
                      >
                        <BarChart2 size={13} /> Full Chart
                      </button>
                      <button
                        className="btn-sm btn-primary"
                        onClick={() => {
                          if (onSelectChart) {
                            onSelectChart(m.pair);
                          } else {
                            setSelectedAsset(m);
                          }
                        }}
                      >
                        Trade
                      </button>
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
