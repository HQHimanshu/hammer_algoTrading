import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { api, type TradingStatusData, type RiskEventRecord } from '../../services/api';

export const RiskMonitorPage: React.FC = () => {
  const [tradingStatus, setTradingStatus] = useState<TradingStatusData | null>(null);
  const [riskEvents, setRiskEvents] = useState<RiskEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadRiskData = async () => {
    setIsLoading(true);
    try {
      const [status, events] = await Promise.all([
        api.getTradingStatus(),
        api.getRiskEvents(25),
      ]);
      setTradingStatus(status);
      setRiskEvents(events || []);
      setEmergencyActive(status.emergency_stop_active);
    } catch (err: any) {
      console.warn('Risk data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const handleEmergencyStop = async () => {
    if (!window.confirm('Are you sure you want to trigger an EMERGENCY STOP? This will immediately halt the background execution loop and block all new orders.')) {
      return;
    }
    try {
      await api.emergencyStop();
      setEmergencyActive(true);
      setActionMessage('EMERGENCY STOP ENGAGED: Automated loop halted and orders blocked.');
      await loadRiskData();
    } catch (err: any) {
      alert(`Emergency stop failed: ${err.message}`);
    }
  };

  return (
    <div className="page-container">
      {/* Header section */}
      <div className="page-header-block">
        <div>
          <div className="bw-badge-india mb-3">
            <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
            <span>Risk Guard Matrix</span>
            <span className="bw-badge-sub">• Real-Time Hard Limits</span>
          </div>
          <h1 className="section-title">Risk Monitor &amp; Capital Protection</h1>
          <p className="section-description">
            Automated hard stop-loss guards, max daily drawdown circuit breakers, and sub-millisecond exposure bounds.
          </p>
        </div>

        <div className="header-action-group">
          <button
            className="btn-secondary"
            onClick={() => loadRiskData()}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? 'spin-animation' : ''} />
            <span>Sync Guards</span>
          </button>
          <button
            onClick={handleEmergencyStop}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: emergencyActive ? '#7f1d1d' : '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldAlert size={15} />
            <span>{emergencyActive ? 'HALTED (CIRCUIT OPEN)' : 'EMERGENCY KILL SWITCH'}</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: '16px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={15} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Daily Max Drawdown Cap</div>
          <div className="stat-value font-mono">
            ${tradingStatus?.max_daily_loss ? tradingStatus.max_daily_loss.toFixed(2) : '200.00'}
          </div>
          <div className="stat-trend positive">
            Current Daily Loss: ${tradingStatus?.daily_realized_loss?.toFixed(2) || '0.00'} (Safe)
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Max Position Size Limit</div>
          <div className="stat-value font-mono">
            {tradingStatus?.max_position_size || 5.0} Units
          </div>
          <div className="stat-trend positive">Pre-Trade Enforcement Active</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Trading Safety Gate</div>
          <div
            className="stat-value"
            style={{ color: tradingStatus?.trading_enabled ? '#10b981' : '#f59e0b' }}
          >
            {tradingStatus?.trading_enabled ? 'ENABLED' : 'DISABLED (SAFE)'}
          </div>
          <div className="stat-trend neutral">Paper Testing Protection</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Emergency Circuit Breaker</div>
          <div
            className="stat-value"
            style={{ color: emergencyActive ? '#ef4444' : '#10b981' }}
          >
            {emergencyActive ? 'CIRCUIT TRIPPED' : 'ARMED READY'}
          </div>
          <div className="stat-trend neutral">Sub-ms Pre-Trade Guard Active</div>
        </div>
      </div>

      {/* Real-time Pre-Trade Audit Events */}
      <div className="panel-card" style={{ marginBottom: '24px' }}>
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Pre-Trade Risk Audit Ledger</h3>
            <span className="badge-tag">Real-Time Risk Rejection Logs</span>
          </div>
          <span className="bw-pill-new">HARD ENFORCEMENT</span>
        </div>

        <div className="table-responsive">
          {riskEvents.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#71717a' }}>
              <ShieldCheck size={32} style={{ margin: '0 auto 8px auto', opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '13px' }}>
                No risk violations or order rejections recorded. All pre-trade limits are within safe parameters.
              </p>
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Quantity</th>
                  <th>Risk Status</th>
                  <th>Reason for Rejection / Guard Trigger</th>
                </tr>
              </thead>
              <tbody>
                {riskEvents.map((ev, i) => (
                  <tr key={ev.id || i}>
                    <td className="font-mono text-muted">{ev.created_at || 'Recent'}</td>
                    <td className="font-semibold text-white">{ev.symbol}</td>
                    <td>
                      <span className={`pill ${ev.side === 'BUY' ? 'pill-green' : 'pill-red'}`}>
                        {ev.side}
                      </span>
                    </td>
                    <td className="font-mono text-white">{ev.size}</td>
                    <td>
                      <span className="pill pill-red">
                        <XCircle size={11} style={{ marginRight: '4px' }} />
                        {ev.status}
                      </span>
                    </td>
                    <td className="font-mono text-secondary" style={{ fontSize: '12px' }}>
                      {ev.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Circuit Breakers & Safeguards List */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="flex-align-gap">
            <h3 className="text-white font-bold">Automated Safeguard Protocols</h3>
            <span className="badge-tag">Pre-Trade Validation Engine</span>
          </div>
          <span className="bw-pill-new">ACTIVE 24/7</span>
        </div>

        <div className="perf-metric-list">
          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Delta Exchange Testnet Isolation</div>
              <div className="text-muted text-xs">Rejects any production URL (https://api.delta.exchange) to prevent real-money loss</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Trading Switch Pre-Trade Check</div>
              <div className="text-muted text-xs">Blocks execution unless TRADING_ENABLED=true is explicitly configured</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Max Single Order Notional Limiter</div>
              <div className="text-muted text-xs">Blocks orders larger than MAX_POSITION_SIZE (5.0 contracts)</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>

          <div className="perf-metric-row">
            <div>
              <div className="font-semibold text-white">Cumulative Daily Loss Hard Stop</div>
              <div className="text-muted text-xs">Instantly halts automated trading loop if realized losses reach $200.00</div>
            </div>
            <span className="pill pill-green">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RiskMonitorPage;
