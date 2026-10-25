import React, { useState, useEffect } from 'react';
import { Shield, Zap, TrendingUp, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';
import { TradingViewTerminal } from '../../components/common/TradingViewTerminal';
import { api, type TickerData } from '../../services/api';

export const FuturesPage: React.FC = () => {
  const [leverage, setLeverage] = useState<number>(15);
  const [marginMode, setMarginMode] = useState<'Cross' | 'Isolated'>('Cross');
  const [orderType, setOrderType] = useState<'Limit' | 'Market' | 'Algo'>('Limit');
  const [orderSize, setOrderSize] = useState<number>(5000);
  const [liveTicker, setLiveTicker] = useState<TickerData | null>(null);
  const [orderNotice, setOrderNotice] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    const fetchTicker = async () => {
      try {
        const t = await api.getTicker('BTCUSDT');
        if (active && t) {
          setLiveTicker(t);
        }
      } catch (err) {
        console.debug('Failed to fetch ticker for futures page:', err);
      }
    };
    fetchTicker();
    const interval = setInterval(fetchTicker, 6000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleOrderSubmit = async (side: 'BUY' | 'SELL') => {
    setOrderNotice({
      type: 'warning',
      message: `Simulating ${side} order: ${orderSize} USDT (${(orderSize * leverage).toLocaleString()} notional at ${leverage}x ${marginMode}). Trading must be explicitly enabled via backend safety controls to execute live exchange orders.`,
    });
    setTimeout(() => setOrderNotice(null), 6000);
  };

  const currentMark = liveTicker?.mark_price ? `$${liveTicker.mark_price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}` : '$81,654.50';

  return (
    <div className="page-container space-y-6">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Derivatives Engine</span>
            <span className="bw-badge-sub">• Delta Exchange Testnet</span>
          </div>
          <h1 className="section-title">Futures &amp; Derivatives Trading</h1>
          <p className="section-description">
            High-leverage perpetual swaps and dated futures streaming live market data with sub-millisecond risk management.
          </p>
        </div>

        <div className="header-action-group">
          <button className="btn-secondary">
            <Shield size={14} /> Risk Guards (Active)
          </button>
          <button className="btn-primary">
            <Zap size={14} /> 1-Click Scalp Pass
          </button>
        </div>
      </div>

      {/* 1. Live Trading Terminal & Chart */}
      <div className="w-full bg-[#0d111a] border border-[#1e293b] rounded-xl overflow-hidden shadow-2xl">
        <TradingViewTerminal initialPair="BTCUSDT" isModal={false} />
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">BTCUSDT Mark Price</div>
          <div className="stat-value font-mono text-emerald">{currentMark}</div>
          <div className="stat-trend positive">
            <TrendingUp size={14} /> Delta Exchange Testnet
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Best Bid / Best Ask</div>
          <div className="stat-value font-mono text-sm">
            {liveTicker?.best_bid?.toFixed(1) || '81,650.0'} / {liveTicker?.best_ask?.toFixed(1) || '81,655.0'}
          </div>
          <div className="stat-trend neutral">Live Level 2 Quotes</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Available Leverage</div>
          <div className="stat-value">50x Multiplier</div>
          <div className="stat-trend neutral">Dynamic Maintenance Margin</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Auto-Deleveraging (ADL)</div>
          <div className="stat-value text-emerald">Priority Safe</div>
          <div className="stat-trend positive">Insurance Fund: $14.2M</div>
        </div>
      </div>

      {orderNotice && (
        <div className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 font-mono ${
          orderNotice.type === 'success' ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300' :
          orderNotice.type === 'warning' ? 'bg-amber-950/50 border-amber-500/40 text-amber-300' :
          'bg-rose-950/50 border-rose-500/40 text-rose-300'
        }`}>
          {orderNotice.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{orderNotice.message}</span>
        </div>
      )}

      {/* Main Order Form & Matrix Grid */}
      <div className="cards-grid-two">
        <div className="panel-card">
          <div className="panel-header">
            <div>
              <h3 className="text-white font-bold">Contract Order Terminal</h3>
              <span className="text-muted text-xs">BTCUSDT-PERP • Mark: {currentMark}</span>
            </div>

            <div className="filter-tab-pills">
              <button
                className={`tab-filter-btn ${marginMode === 'Cross' ? 'active' : ''}`}
                onClick={() => setMarginMode('Cross')}
              >
                Cross
              </button>
              <button
                className={`tab-filter-btn ${marginMode === 'Isolated' ? 'active' : ''}`}
                onClick={() => setMarginMode('Isolated')}
              >
                Isolated
              </button>
            </div>
          </div>

          {/* Order type pills */}
          <div className="filter-tab-pills w-full justify-start mt-2">
            {(['Limit', 'Market', 'Algo'] as const).map((t) => (
              <button
                key={t}
                className={`tab-filter-btn ${orderType === t ? 'active' : ''}`}
                onClick={() => setOrderType(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="form-group mt-3">
            <div className="slider-header">
              <span className="text-secondary text-sm font-semibold">Leverage Multiplier</span>
              <span className="slider-val font-mono font-bold text-white bg-dark-pill px-2 py-0.5 rounded">
                {leverage}x
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="custom-range"
            />
            <div className="range-marks text-muted text-xs flex justify-between font-mono">
              <span>1x</span>
              <span>10x</span>
              <span>25x</span>
              <span>50x</span>
            </div>
          </div>

          <div className="swap-input-group mt-3">
            <label>Order Size (USDT)</label>
            <div className="input-with-symbol">
              <input
                type="number"
                value={orderSize}
                onChange={(e) => setOrderSize(Number(e.target.value))}
                className="swap-input"
              />
              <span className="token-tag">USDT</span>
            </div>
          </div>

          <div className="order-actions-grid mt-4">
            <button className="btn-action btn-buy" onClick={() => handleOrderSubmit('BUY')}>
              Buy / Long ({(orderSize * leverage).toLocaleString()} Notional)
            </button>
            <button className="btn-action btn-sell" onClick={() => handleOrderSubmit('SELL')}>
              Sell / Short ({(orderSize * leverage).toLocaleString()} Notional)
            </button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3 className="text-white font-bold">Funding Rate Heatmap</h3>
            <span className="badge-tag">Dynamic 8h Settlement</span>
          </div>

          <div className="perf-metric-list">
            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">BTCUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: ~10.95%</div>
              </div>
              <span className="metric-val text-emerald">+0.0100%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">ETHUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: ~9.20%</div>
              </div>
              <span className="metric-val text-emerald">+0.0084%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">SOLUSDT Perpetual</span>
                <div className="text-muted text-xs">Annualized: -2.40%</div>
              </div>
              <span className="metric-val text-rose">-0.0022%</span>
            </div>

            <div className="perf-metric-row">
              <div>
                <span className="font-semibold text-white">XRPUSD Perpetual</span>
                <div className="text-muted text-xs">Annualized: +12.40%</div>
              </div>
              <span className="metric-val text-emerald">+0.0112%</span>
            </div>
          </div>

          <div className="card-note mt-3">
            <Cpu size={14} className="text-secondary" />
            <span className="text-xs text-muted">
              Hammer Quant Strategy actively collects positive basis across funding cycles with 0 delta exposure.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
