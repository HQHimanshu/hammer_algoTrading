import React, { useState } from 'react';
import { Play, Pause, Cpu, CheckCircle2, Sliders } from 'lucide-react';

export const AlgoTradingPage: React.FC = () => {
  const [strategies, setStrategies] = useState([
    {
      id: 'strat-1',
      name: 'Hammer Breakout Scalper',
      type: 'Price Action & Volatility',
      status: 'RUNNING',
      winRate: '72.4%',
      pnl: '+$4,210.50',
      activeOrders: 3,
      pair: 'BTC/USDT',
    },
    {
      id: 'strat-2',
      name: 'EMA Cross + Order Flow Imbalance',
      type: 'Trend Following',
      status: 'RUNNING',
      winRate: '68.1%',
      pnl: '+$2,840.10',
      activeOrders: 2,
      pair: 'ETH/USDT',
    },
    {
      id: 'strat-3',
      name: 'Funding Rate & Basis Arbitrage',
      type: 'Delta-Neutral Arb',
      status: 'PAUSED',
      winRate: '94.2%',
      pnl: '+$1,190.00',
      activeOrders: 0,
      pair: 'SOL/USDT',
    },
  ]);

  const toggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'RUNNING' ? 'PAUSED' : 'RUNNING' }
          : s
      )
    );
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <div className="flex-align-gap">
            <h2 className="section-title">Automated Strategy Engine</h2>
            <span className="nav-badge badge-emerald">Core Module</span>
          </div>
          <p className="section-description">
            Algorithmic execution models, backtested rule engines, and automated order execution loops.
          </p>
        </div>
        <div className="header-action-group">
          <button className="btn-secondary">
            <Sliders size={15} /> Parameters
          </button>
          <button className="btn-primary">
            <Cpu size={15} /> Deploy New Strategy
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Execution Engine Health</div>
          <div className="stat-value text-emerald">100% OK</div>
          <div className="stat-trend positive">
            <CheckCircle2 size={14} /> Low-Latency WebSocket Online
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Algo Cumulative 24h PnL</div>
          <div className="stat-value text-emerald">+$8,240.60</div>
          <div className="stat-trend positive">142 Automated Fills</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Execution Speed</div>
          <div className="stat-value">0.82 ms</div>
          <div className="stat-trend positive">Colocated Node</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Risk Circuit Guard</div>
          <div className="stat-value">Armed</div>
          <div className="stat-trend neutral">Max 3% Daily Drawdown Limit</div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Active Deployed Strategies</h3>
          <span className="badge-tag">3 Registered Models</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Strategy Name</th>
                <th>Category</th>
                <th>Pair</th>
                <th>Win Rate</th>
                <th>Realized PnL</th>
                <th>Active Orders</th>
                <th>Status</th>
                <th>Controls</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((strat) => (
                <tr key={strat.id}>
                  <td className="font-semibold">{strat.name}</td>
                  <td>{strat.type}</td>
                  <td>{strat.pair}</td>
                  <td className="text-emerald font-semibold">{strat.winRate}</td>
                  <td className="text-emerald font-bold">{strat.pnl}</td>
                  <td>{strat.activeOrders}</td>
                  <td>
                    <span
                      className={`pill ${
                        strat.status === 'RUNNING' ? 'pill-green' : 'pill-amber'
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
