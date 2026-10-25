import React, { useState } from 'react';
import { Play, Pause, Cpu, CheckCircle2, TrendingUp, Code } from 'lucide-react';

export const AlgoTradingPage: React.FC = () => {
  const [strategies, setStrategies] = useState([
    {
      id: 'vol-arb',
      name: 'Hammer Volatility Arbitrage',
      category: 'Delta Neutral',
      pair: 'BTC / ETH Options',
      apy: '+44.2%',
      winRate: '86.4%',
      sharpe: '3.12',
      status: 'RUNNING',
      pnl: '+$4,210.50',
      activeOrders: 4,
      desc: 'Exploits implied volatility mispricings across crypto derivative strikes with automatic delta hedging.',
    },
    {
      id: 'iron-condor',
      name: 'Delta Neutral Iron Condor',
      category: 'Options Greeks',
      pair: 'NIFTY & BTC F&O',
      apy: '+32.8%',
      winRate: '91.2%',
      sharpe: '2.94',
      status: 'RUNNING',
      pnl: '+$3,840.10',
      activeOrders: 2,
      desc: 'Systematically collects theta decay within defined volatility corridors with dynamic wing adjustment.',
    },
    {
      id: 'momentum-v4',
      name: 'Momentum Trend Breakout v4',
      category: 'Trend Scalp',
      pair: 'SOL / USDT Futures',
      apy: '+58.6%',
      winRate: '74.5%',
      sharpe: '2.65',
      status: 'RUNNING',
      pnl: '+$5,190.00',
      activeOrders: 3,
      desc: 'High-probability trend continuation triggers with trailing multi-target stop-loss safeguards.',
    },
    {
      id: 'grid-hft',
      name: 'Ultra-Fast Market Maker Grid',
      category: 'Sub-ms HFT',
      pair: 'ETH / USDT Perps',
      apy: '+38.4%',
      winRate: '94.8%',
      sharpe: '3.40',
      status: 'PAUSED',
      pnl: '+$2,120.00',
      activeOrders: 0,
      desc: 'Sub-millisecond bid-ask liquidity capture providing rebate capture and zero directional bias.',
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'delta-neutral' | 'trend'>('all');

  const toggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'RUNNING' ? 'PAUSED' : 'RUNNING' }
          : s
      )
    );
  };

  const filteredStrategies = strategies.filter((s) => {
    if (activeFilter === 'running') return s.status === 'RUNNING';
    if (activeFilter === 'delta-neutral') return s.category.includes('Delta');
    if (activeFilter === 'trend') return s.category.includes('Trend');
    return true;
  });

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Autonomous Quant Engine</span>
            <span className="bw-badge-sub">• Core Execution Loop</span>
          </div>
          <h1 className="section-title">Automated Strategy Engine</h1>
          <p className="section-description">
            Sub-millisecond quant models, backtested statistical arbitrage rule engines, and automated order execution loops.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Code size={14} /> Python SDK
          </button>
          <button className="btn-primary">
            <Cpu size={14} /> Deploy New Strategy
          </button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Quant Engine Status</div>
          <div className="stat-value text-emerald">100% Operational</div>
          <div className="stat-trend positive">
            <CheckCircle2 size={14} /> WebSocket Fiber Co-located (&lt;0.8ms)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Cumulative 24h Algo PnL</div>
          <div className="stat-value text-emerald">+$15,360.60</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> 184 Automated Fills
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Sharpe Ratio</div>
          <div className="stat-value">3.03</div>
          <div className="stat-trend positive">Max Drawdown Capped at 2.1%</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Circuit Breaker Safeguards</div>
          <div className="stat-value text-white">Armed &amp; Ready</div>
          <div className="stat-trend neutral">Zero Slippage Protection Active</div>
        </div>
      </div>

      {/* Deployed Strategies Panel */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Active Deployed Models</h3>
            {/* Filter Pills */}
            <div className="filter-tab-pills">
              <button
                className={`tab-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All Models ({strategies.length})
              </button>
              <button
                className={`tab-filter-btn ${activeFilter === 'running' ? 'active' : ''}`}
                onClick={() => setActiveFilter('running')}
              >
                Running (3)
              </button>
              <button
                className={`tab-filter-btn ${activeFilter === 'delta-neutral' ? 'active' : ''}`}
                onClick={() => setActiveFilter('delta-neutral')}
              >
                Delta Neutral
              </button>
              <button
                className={`tab-filter-btn ${activeFilter === 'trend' ? 'active' : ''}`}
                onClick={() => setActiveFilter('trend')}
              >
                Trend Following
              </button>
            </div>
          </div>

          <span className="bw-pill-new">QUANT CORE</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Strategy Name</th>
                <th>Category</th>
                <th>Pair / Contract</th>
                <th>Annualized Yield</th>
                <th>Win Rate</th>
                <th>Sharpe</th>
                <th>Realized PnL</th>
                <th>Orders</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStrategies.map((strat) => (
                <tr key={strat.id} className="interactive-row">
                  <td className="font-semibold text-white">
                    <div>
                      <div className="text-white font-bold">{strat.name}</div>
                      <div className="text-muted text-xs">{strat.desc.slice(0, 48)}...</div>
                    </div>
                  </td>
                  <td>
                    <span className="badge-tag">{strat.category}</span>
                  </td>
                  <td className="font-mono text-white">{strat.pair}</td>
                  <td className="text-emerald font-bold font-mono">{strat.apy}</td>
                  <td className="text-white font-semibold font-mono">{strat.winRate}</td>
                  <td className="font-mono text-white">{strat.sharpe}</td>
                  <td className="text-emerald font-bold font-mono">{strat.pnl}</td>
                  <td className="font-mono text-muted">{strat.activeOrders}</td>
                  <td>
                    <span
                      className={`pill ${
                        strat.status === 'RUNNING' ? 'pill-green' : 'pill-gray'
                      }`}
                    >
                      {strat.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleStrategy(strat.id)}
                      className={`btn-sm ${
                        strat.status === 'RUNNING' ? 'btn-danger' : 'btn-primary'
                      }`}
                    >
                      {strat.status === 'RUNNING' ? (
                        <>
                          <Pause size={12} /> Pause
                        </>
                      ) : (
                        <>
                          <Play size={12} /> Run
                        </>
                      )}
                    </button>
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
