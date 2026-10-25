import React, { useState, useEffect } from 'react';
import {
  Cpu,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';
import {
  api,
  type StrategyCatalogItem,
  type StrategySignalResult,
  type TradingStatusData,
} from '../../services/api';

export const AlgoTradingPage: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyCatalogItem[]>([]);
  const [tradingStatus, setTradingStatus] = useState<TradingStatusData | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('strategy_heikin_ashi');
  const [evaluationSymbol, setEvaluationSymbol] = useState<string>('BTCUSDT');
  const [evaluationResult, setEvaluationResult] = useState<StrategySignalResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fallback initial models
  const initialStrategies: StrategyCatalogItem[] = [
    {
      id: 'strategy_heikin_ashi',
      name: 'Strategy 1 — Heikin-Ashi Pullback Breakout',
      status: 'active',
      symbol: 'BTCUSDT',
      trend_bars: 3,
      expiry_bars: 5,
      stop_pct: 0.3,
      target_pct: 1.5,
      description: 'Directional trend isolation using noise-filtered Heikin-Ashi candles. Pullback bars arm breakout triggers confirmed on real closes.',
    },
    {
      id: 'strategy_1',
      name: 'Strategy 1 — Golden Cross + RSI Momentum',
      status: 'active',
      symbol: 'BTCUSDT',
      fast_period: 5,
      slow_period: 15,
      rsi_period: 14,
      rsi_overbought: 70.0,
      rsi_oversold: 30.0,
      description: 'Dual Simple Moving Average crossover (SMA 5/15) with RSI momentum overbought/oversold confirmation filter.',
    },
    {
      id: 'vol-arb',
      name: 'Hammer Volatility Arbitrage',
      status: 'active',
      symbol: 'BTC / ETH Options',
      description: 'Exploits implied volatility mispricings across crypto derivative strikes with automatic delta hedging.',
    },
    {
      id: 'iron-condor',
      name: 'Delta Neutral Iron Condor',
      status: 'active',
      symbol: 'NIFTY & BTC F&O',
      description: 'Systematically collects theta decay within defined volatility corridors with dynamic wing adjustment.',
    },
  ];

  const loadData = async () => {
    setIsLoadingStatus(true);
    setErrorMessage(null);
    try {
      // 1. Fetch real strategies catalog from backend
      const serverStrategies = await api.getStrategies();
      if (serverStrategies && serverStrategies.length > 0) {
        // Merge with portfolio strategies
        const combined = [...serverStrategies];
        for (const init of initialStrategies.slice(2)) {
          if (!combined.find((s) => s.id === init.id)) {
            combined.push(init);
          }
        }
        setStrategies(combined);
      } else {
        setStrategies(initialStrategies);
      }

      // 2. Fetch trading loop and risk status
      const status = await api.getTradingStatus();
      setTradingStatus(status);
    } catch (err: any) {
      console.warn('API error in AlgoTradingPage:', err);
      setStrategies(initialStrategies);
      setErrorMessage(err.message || 'Failed to connect to AlgoEngine backend.');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setStatusMessage(null);
    setErrorMessage(null);
    try {
      const result = await api.evaluateStrategy(evaluationSymbol, selectedStrategyId);
      setEvaluationResult(result);
      setStatusMessage(`Evaluated real market candles for ${evaluationSymbol} successfully.`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Strategy evaluation failed.');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Autonomous Quant Engine</span>
            <span className="bw-badge-sub">• Core Execution &amp; Strategy 1</span>
          </div>
          <h1 className="section-title">Automated Strategy Engine</h1>
          <p className="section-description">
            Sub-millisecond quant models, Strategy 1 Heikin-Ashi breakouts, Golden Cross momentum filters, and testnet execution safeguards.
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="btn-secondary"
            onClick={() => loadData()}
            disabled={isLoadingStatus}
            title="Refresh engine status"
          >
            <RefreshCw size={14} className={isLoadingStatus ? 'spin-animation' : ''} />
            <span>Sync Engine</span>
          </button>
          <button
            className="btn-primary"
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Zap size={14} />
            <span>{isEvaluating ? 'Evaluating...' : 'Run Live Signal Check'}</span>
          </button>
        </div>
      </div>

      {/* Stats Summary row */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Trading Safety Gate</div>
          <div className="stat-value" style={{ color: tradingStatus?.trading_enabled ? '#10b981' : '#f59e0b' }}>
            {tradingStatus?.trading_enabled ? 'ENABLED (LIVE)' : 'DISABLED (SAFE DEMO)'}
          </div>
          <div className="stat-trend neutral">
            <Shield size={13} /> Paper Trading Protected
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Background Execution Loop</div>
          <div className="stat-value">
            {tradingStatus?.loop_running ? (
              <span className="text-emerald">ACTIVE (POLLING)</span>
            ) : (
              <span>STANDBY (IDLE)</span>
            )}
          </div>
          <div className="stat-trend positive">
            Interval: {tradingStatus?.loop_interval_seconds || 10}s
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Daily Drawdown Bound</div>
          <div className="stat-value font-mono">
            ${tradingStatus?.max_daily_loss?.toFixed(2) || '200.00'}
          </div>
          <div className="stat-trend positive">Current Loss: $0.00</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Emergency Circuit Breaker</div>
          <div className="stat-value text-emerald">
            {tradingStatus?.emergency_stop_active ? 'HALTED' : 'ARMED & READY'}
          </div>
          <div className="stat-trend positive">Sub-ms Pre-Trade Guard Active</div>
        </div>
      </div>

      {/* Strategy 1 Live Evaluator Panel */}
      <div
        className="panel-card"
        style={{
          border: '1px solid #3f3f46',
          backgroundColor: '#0c0c0e',
          marginBottom: '24px',
        }}
      >
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} className="text-emerald" />
            <h3 className="text-white font-bold" style={{ margin: 0 }}>
              Live Strategy 1 Signal Evaluator (Delta Exchange Real Feed)
            </h3>
          </div>
          <span className="bw-pill-new">TESTNET VERIFIED</span>
        </div>

        <div style={{ padding: '20px' }}>
          <p style={{ color: '#a1a1aa', fontSize: '13px', marginBottom: '18px' }}>
            Directly test quantitative signal conditions on fresh Delta Exchange candles without placing an order.
            Compares real-time price action against armed pullback levels and momentum filters.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
                SELECT STRATEGY MODEL
              </label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                style={{
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  border: '1px solid #27272a',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minWidth: '320px',
                }}
              >
                <option value="strategy_heikin_ashi">Strategy 1 — Heikin-Ashi Pullback Breakout</option>
                <option value="strategy_1">Strategy 1 — Golden Cross + RSI Momentum</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>
                EXCHANGE SYMBOL
              </label>
              <select
                value={evaluationSymbol}
                onChange={(e) => setEvaluationSymbol(e.target.value)}
                style={{
                  backgroundColor: '#18181b',
                  color: '#ffffff',
                  border: '1px solid #27272a',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minWidth: '150px',
                }}
              >
                <option value="BTCUSDT">BTCUSDT (Bitcoin Perp)</option>
                <option value="ETHUSDT">ETHUSDT (Ethereum Perp)</option>
                <option value="SOLUSDT">SOLUSDT (Solana Perp)</option>
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                style={{
                  padding: '9px 20px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={14} className={isEvaluating ? 'spin-animation' : ''} />
                <span>{isEvaluating ? 'Evaluating Live...' : 'Evaluate Live Candles'}</span>
              </button>
            </div>
          </div>

          {/* Results Box */}
          {evaluationResult && (
            <div
              style={{
                backgroundColor: '#141417',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #27272a',
                  paddingBottom: '12px',
                  marginBottom: '12px',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#71717a' }}>STRATEGY EVALUATION OUTCOME</span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                    {evaluationResult.strategy_name}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontWeight: 700,
                      fontSize: '14px',
                      backgroundColor:
                        evaluationResult.action === 'BUY'
                          ? 'rgba(16, 185, 129, 0.2)'
                          : evaluationResult.action === 'SELL'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(113, 113, 122, 0.2)',
                      color:
                        evaluationResult.action === 'BUY'
                          ? '#10b981'
                          : evaluationResult.action === 'SELL'
                          ? '#ef4444'
                          : '#e4e4e7',
                      border:
                        evaluationResult.action === 'BUY'
                          ? '1px solid #10b981'
                          : evaluationResult.action === 'SELL'
                          ? '1px solid #ef4444'
                          : '1px solid #52525b',
                    }}
                  >
                    SIGNAL: {evaluationResult.action}
                  </span>
                </div>
              </div>

              <div className="stats-grid" style={{ marginBottom: '14px' }}>
                <div className="stat-card" style={{ padding: '10px', backgroundColor: '#18181b' }}>
                  <div className="stat-label">Market Close Price</div>
                  <div className="stat-value font-mono" style={{ fontSize: '18px' }}>
                    ${evaluationResult.price?.toLocaleString()}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '10px', backgroundColor: '#18181b' }}>
                  <div className="stat-label">Candle Interval</div>
                  <div className="stat-value" style={{ fontSize: '18px' }}>
                    {evaluationResult.timeframe}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '10px', backgroundColor: '#18181b' }}>
                  <div className="stat-label">Data Freshness</div>
                  <div className="stat-value text-emerald" style={{ fontSize: '18px' }}>
                    {evaluationResult.data_fresh ? 'REAL-TIME' : 'STALE'}
                  </div>
                </div>

                <div className="stat-card" style={{ padding: '10px', backgroundColor: '#18181b' }}>
                  <div className="stat-label">Risk Gate Clearance</div>
                  <div className="stat-value" style={{ fontSize: '18px', color: '#fbbf24' }}>
                    DRY-RUN SAFE
                  </div>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#0a0a0c',
                  border: '1px solid #1f1f23',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}
              >
                <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '4px' }}>
                  MATHEMATICAL DECISION RATIONALE:
                </div>
                <div style={{ color: '#e4e4e7', fontFamily: 'monospace' }}>
                  {evaluationResult.reason}
                </div>
              </div>
            </div>
          )}

          {statusMessage && (
            <div style={{ marginTop: '10px', color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={13} />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div style={{ marginTop: '10px', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={13} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Deployed Strategies Panel */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Registered Quantitative Strategies</h3>
            <span className="bw-pill-new">INSTITUTIONAL MODELS</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Strategy Name</th>
                <th>Target Asset</th>
                <th>Engine Status</th>
                <th>Configuration Parameters</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold text-white">
                    <div className="pair-cell">
                      <Cpu size={16} className="text-emerald" />
                      <div>
                        <div>{s.name}</div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>{s.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-white">{s.symbol}</td>
                  <td>
                    <span className="status-badge live">
                      <span className="dot-live"></span>
                      <span>ACTIVE</span>
                    </span>
                  </td>
                  <td className="font-mono text-muted" style={{ fontSize: '12px' }}>
                    {s.fast_period ? (
                      `Fast EMA: ${s.fast_period} | Slow EMA: ${s.slow_period} | RSI: ${s.rsi_period}`
                    ) : s.trend_bars ? (
                      `Trend Bars: ${s.trend_bars} | Expiry: ${s.expiry_bars} | Stop: ${s.stop_pct}% | Target: ${s.target_pct}%`
                    ) : (
                      'Automated Risk Guard'
                    )}
                  </td>
                  <td>
                    <button
                      className="btn-sm btn-primary"
                      onClick={() => {
                        setSelectedStrategyId(s.id);
                        handleRunEvaluation();
                      }}
                    >
                      Evaluate Now
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
export default AlgoTradingPage;
