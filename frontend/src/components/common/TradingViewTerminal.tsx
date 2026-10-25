import React, { useState, useMemo } from 'react';
import {
  Star,
  ChevronDown,
  Camera,
  Settings,
  Crosshair,
  Slash,
  PenTool,
  Type,
  Smile,
  Ruler,
  ZoomIn,
  Magnet,
  Lock,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';

interface TradingViewTerminalProps {
  initialPair?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const TradingViewTerminal: React.FC<TradingViewTerminalProps> = ({
  initialPair = 'BTCUSD',
  onClose,
  isModal = false,
}) => {
  const [pair] = useState(initialPair);
  const [activeSubTab, setActiveSubTab] = useState<'traded' | 'mark' | 'funding' | 'depth'>('traded');
  const [timeframe, setTimeframe] = useState('1h');
  const [oneClickTrade, setOneClickTrade] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('crosshair');
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const [orderSize, setOrderSize] = useState('0.5');

  // Realistic historical candlestick data replicating the user's screenshot
  const candleData = useMemo(() => {
    const candles = [];

    // Pattern mirroring the screenshot: rise to 84,600, steep drop, consolidation near 80,569
    const priceTrajectory = [
      80200, 79600, 79800, 80400, 81200, 80800, 81500, 82400, 83100, 83900,
      84400, 84650, 84200, 83600, 82900, 82400, 81800, 81200, 80800, 81400,
      81600, 81200, 80900, 81100, 81400, 81200, 80400, 79800, 79400, 80200,
      80450, 80600, 80400, 80569.5,
    ];

    for (let i = 0; i < priceTrajectory.length; i++) {
      const targetClose = priceTrajectory[i];
      const open = i === 0 ? 80100 : priceTrajectory[i - 1];
      const close = targetClose;
      const spread = Math.abs(close - open);
      const high = Math.max(open, close) + Math.random() * (spread * 0.5 + 80);
      const low = Math.min(open, close) - Math.random() * (spread * 0.5 + 80);
      const isUp = close >= open;
      const volume = Math.floor(Math.random() * 120 + 35);

      candles.push({
        index: i,
        time: `${21 + Math.floor(i / 7)}:00`,
        day: 21 + Math.floor(i / 7),
        open,
        high,
        low,
        close,
        volume,
        isUp,
      });
    }
    return candles;
  }, [pair]);

  // Order Book Asks (Red)
  const asks = [
    { price: '80574.0', size: '20.033', total: '80.908', depthPct: 95 },
    { price: '80573.5', size: '16.376', total: '60.875', depthPct: 75 },
    { price: '80573.0', size: '13.387', total: '44.499', depthPct: 55 },
    { price: '80572.5', size: '10.943', total: '31.112', depthPct: 40 },
    { price: '80572.0', size: '5.798', total: '20.169', depthPct: 26 },
    { price: '80571.5', size: '4.740', total: '14.371', depthPct: 18 },
    { price: '80571.0', size: '3.875', total: '9.631', depthPct: 12 },
    { price: '80570.5', size: '3.167', total: '5.756', depthPct: 7 },
    { price: '80570.0', size: '2.589', total: '2.589', depthPct: 4 },
  ];

  // Order Book Bids (Green)
  const bids = [
    { price: '80569.5', size: '4.966', total: '4.966', depthPct: 6 },
    { price: '80569.0', size: '6.075', total: '11.041', depthPct: 14 },
    { price: '80568.5', size: '7.431', total: '18.472', depthPct: 23 },
    { price: '80568.0', size: '9.090', total: '27.562', depthPct: 34 },
    { price: '80567.5', size: '11.119', total: '38.681', depthPct: 48 },
    { price: '80567.0', size: '13.602', total: '52.283', depthPct: 64 },
    { price: '80566.5', size: '16.639', total: '68.922', depthPct: 82 },
    { price: '80566.0', size: '20.354', total: '89.276', depthPct: 95 },
  ];

  // Recent Trades
  const recentTrades = [
    { price: '80569.5', size: '0.033', time: '12:57:32', side: 'S', isBuy: false },
    { price: '80569.5', size: '0.100', time: '12:57:31', side: 'S', isBuy: false },
    { price: '80569.5', size: '0.150', time: '12:57:31', side: 'S', isBuy: false },
    { price: '80570.0', size: '0.060', time: '12:57:29', side: 'B', isBuy: true },
    { price: '80569.5', size: '0.220', time: '12:57:25', side: 'S', isBuy: false },
    { price: '80570.0', size: '0.500', time: '12:57:21', side: 'B', isBuy: true },
  ];

  // Scales & dimensions
  const svgWidth = 840;
  const svgHeight = 440;
  const paddingRight = 68;
  const volumeHeight = 90;

  const minPrice = 79000;
  const maxPrice = 85200;
  const priceRange = maxPrice - minPrice;

  const getY = (p: number) => {
    return svgHeight - ((p - minPrice) / priceRange) * (svgHeight - 40) - 20;
  };

  const hoveredCandle = hoveredCandleIndex !== null ? candleData[hoveredCandleIndex] : candleData[candleData.length - 1];

  return (
    <div className={`tv-terminal-root ${isModal ? 'tv-modal-mode' : ''}`}>
      {/* 1. Top Instrument Strip */}
      <div className="tv-top-strip">
        <div className="tv-strip-left">
          <button className="tv-star-btn" title="Add to Favorites">
            <Star size={15} className="text-muted hover:text-white" />
          </button>

          <div className="tv-pair-selector">
            <span className="tv-pair-title">{pair}</span>
            <ChevronDown size={14} className="text-muted" />
          </div>

          <div className="tv-current-price-block">
            <span className="tv-live-price text-rose font-bold font-mono">$80569.5</span>
            <span className="tv-arrow text-rose">↓</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">24h Change</span>
            <span className="tv-m-val text-rose font-mono">-0.38%</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Index Price</span>
            <span className="tv-m-val font-mono">80609</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">24h High</span>
            <span className="tv-m-val font-mono">$81001.0</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">24h Low</span>
            <span className="tv-m-val font-mono">$79179.0</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">24h Vol.</span>
            <span className="tv-m-val font-mono">$806.4M</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">OI</span>
            <span className="tv-m-val font-mono">$78.2M</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Funding (8h) / Countdown</span>
            <span className="tv-m-val font-mono text-emerald">0.0053% / 00h:32m:28s</span>
          </div>
        </div>

        {isModal && onClose && (
          <button onClick={onClose} className="tv-close-btn" title="Close Chart">
            <X size={18} />
          </button>
        )}
      </div>

      {/* 2. Chart Secondary Header Bar */}
      <div className="tv-chart-subbar">
        <div className="tv-subbar-tabs">
          {(['traded', 'mark', 'funding', 'depth'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`tv-sub-tab ${activeSubTab === tab ? 'active' : ''}`}
            >
              {tab === 'traded' && 'Traded Price'}
              {tab === 'mark' && 'Mark Price'}
              {tab === 'funding' && 'Funding'}
              {tab === 'depth' && 'Depth'}
            </button>
          ))}
        </div>

        <div className="tv-subbar-tools">
          {/* Timeframe selection */}
          <div className="tv-tf-group">
            {['5s', '15s', '30s', '1m', '5m', '15m', '1h', '4h', '1D', '3m'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`tv-tf-pill ${timeframe === tf ? 'active' : ''}`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="tv-tool-sep"></div>

          {/* Indicators fx button */}
          <button className="tv-tool-icon-btn" title="Indicators">
            <span className="font-mono text-xs font-bold text-muted">fx</span>
          </button>

          {/* 1-Click Trade Toggle */}
          <div className="tv-one-click-toggle" onClick={() => setOneClickTrade(!oneClickTrade)}>
            <span className="text-xs text-muted">1-Click Trade</span>
            <span className="tv-info-circle">?</span>
            <div className={`tv-toggle-track ${oneClickTrade ? 'on' : ''}`}>
              <div className="tv-toggle-thumb"></div>
            </div>
          </div>

          <div className="tv-tool-sep"></div>

          <button className="tv-tool-icon-btn" title="Screenshot">
            <Camera size={14} />
          </button>
          <button className="tv-tool-icon-btn" title="Chart Settings">
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* 3. Main Workspace: Toolbar + Chart Area + Order Book */}
      <div className="tv-workspace-grid">
        {/* Left Vertical Drawing Toolbar */}
        <aside className="tv-left-toolbar">
          <button
            className={`tv-draw-btn ${selectedTool === 'crosshair' ? 'active' : ''}`}
            onClick={() => setSelectedTool('crosshair')}
            title="Crosshair"
          >
            <Crosshair size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'line' ? 'active' : ''}`}
            onClick={() => setSelectedTool('line')}
            title="Trendline"
          >
            <Slash size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'brush' ? 'active' : ''}`}
            onClick={() => setSelectedTool('brush')}
            title="Geometric Brush"
          >
            <PenTool size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'text' ? 'active' : ''}`}
            onClick={() => setSelectedTool('text')}
            title="Annotation"
          >
            <Type size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'icons' ? 'active' : ''}`}
            onClick={() => setSelectedTool('icons')}
            title="Icons & Smileys"
          >
            <Smile size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'measure' ? 'active' : ''}`}
            onClick={() => setSelectedTool('measure')}
            title="Measure / Ruler"
          >
            <Ruler size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'zoom' ? 'active' : ''}`}
            onClick={() => setSelectedTool('zoom')}
            title="Zoom In"
          >
            <ZoomIn size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'magnet' ? 'active' : ''}`}
            onClick={() => setSelectedTool('magnet')}
            title="Magnet Mode"
          >
            <Magnet size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'lock' ? 'active' : ''}`}
            onClick={() => setSelectedTool('lock')}
            title="Lock All Drawings"
          >
            <Lock size={15} />
          </button>
          <button
            className={`tv-draw-btn ${selectedTool === 'trash' ? 'active' : ''}`}
            onClick={() => setSelectedTool('trash')}
            title="Remove Drawings"
          >
            <Trash2 size={15} />
          </button>
        </aside>

        {/* Middle Chart Canvas Area */}
        <div className="tv-chart-viewport">
          {/* Top-Left OHLCV Floating Reading */}
          <div className="tv-ohlcv-float">
            <span className="tv-pair-stamp font-bold text-white">{pair} • {timeframe} • Delta</span>
            <span className="tv-val-readout">
              O<strong className="text-white font-mono">{hoveredCandle?.open.toFixed(1)}</strong>
            </span>
            <span className="tv-val-readout">
              H<strong className="text-white font-mono">{hoveredCandle?.high.toFixed(1)}</strong>
            </span>
            <span className="tv-val-readout">
              L<strong className="text-white font-mono">{hoveredCandle?.low.toFixed(1)}</strong>
            </span>
            <span className="tv-val-readout">
              C<strong className={`font-mono ${hoveredCandle?.isUp ? 'text-emerald' : 'text-rose'}`}>
                {hoveredCandle?.close.toFixed(1)}
              </strong>
            </span>
            <span className="tv-val-readout text-emerald font-mono">
              +112.0 (+0.14%)
            </span>
            <span className="tv-val-readout text-muted font-mono">
              Vol {hoveredCandle?.volume} K
            </span>
          </div>

          {/* Quick Floating Buy/Sell Buttons on Chart (from Screenshot) */}
          <div className="tv-chart-quick-order">
            <button className="tv-quick-sell-btn">
              <span className="tv-q-price font-mono">80,569.5</span>
              <span className="tv-q-label">SELL</span>
            </button>
            <div className="tv-quick-size-box">
              <input
                type="text"
                value={orderSize}
                onChange={(e) => setOrderSize(e.target.value)}
                className="tv-quick-input"
              />
              <span className="tv-quick-step">1</span>
            </div>
            <button className="tv-quick-buy-btn">
              <span className="tv-q-price font-mono">80,570.0</span>
              <span className="tv-q-label">BUY</span>
            </button>
          </div>

          {/* SVG Candlestick Chart */}
          <svg
            className="tv-svg-canvas"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal Price Gridlines */}
            {[84800, 84400, 84000, 83600, 83200, 82800, 82400, 82000, 81600, 81200, 80800, 80400, 80000, 79600, 79200].map((price) => {
              const y = getY(price);
              return (
                <g key={price}>
                  <line
                    x1="0"
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#161c28"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth - paddingRight + 6}
                    y={y + 3}
                    fill="#64748b"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {price.toLocaleString('en-US', { minimumFractionDigits: 1 })}
                  </text>
                </g>
              );
            })}

            {/* Vertical Day Separators & Labels */}
            {[0, 7, 14, 21, 28].map((idx, dayI) => {
              const x = (idx / (candleData.length - 1)) * (svgWidth - paddingRight);
              return (
                <g key={idx}>
                  <line
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={svgHeight - 20}
                    stroke="#141924"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <text
                    x={x + 4}
                    y={svgHeight - 6}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {21 + dayI}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks & Volume Histogram */}
            {candleData.map((c, i) => {
              const total = candleData.length;
              const slotW = (svgWidth - paddingRight) / total;
              const x = i * slotW + slotW / 2;
              const candleW = Math.max(4, slotW * 0.65);

              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);

              const top = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));
              const color = c.isUp ? '#10b981' : '#f43f5e';

              // Volume bar at bottom
              const maxVol = 160;
              const volBarH = (c.volume / maxVol) * volumeHeight;
              const volY = svgHeight - 20 - volBarH;

              return (
                <g
                  key={i}
                  onMouseEnter={() => setHoveredCandleIndex(i)}
                  onMouseLeave={() => setHoveredCandleIndex(null)}
                  style={{ cursor: 'crosshair' }}
                >
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleW / 2}
                    y={top}
                    width={candleW}
                    height={bodyHeight}
                    fill={color}
                    rx="1"
                  />
                  {/* Volume Bar */}
                  <rect
                    x={x - candleW / 2}
                    y={volY}
                    width={candleW}
                    height={volBarH}
                    fill={color}
                    opacity="0.38"
                  />
                </g>
              );
            })}

            {/* Current Active Price Line and Tag (80,569.5) */}
            <g pointerEvents="none">
              <line
                x1="0"
                y1={getY(80569.5)}
                x2={svgWidth - paddingRight}
                y2={getY(80569.5)}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              {/* Green Price Pill on Right Axis */}
              <rect
                x={svgWidth - paddingRight + 2}
                y={getY(80569.5) - 10}
                width={paddingRight - 4}
                height={20}
                fill="#10b981"
                rx="3"
              />
              <text
                x={svgWidth - paddingRight + 6}
                y={getY(80569.5) + 3}
                fill="#000000"
                fontSize="9"
                fontWeight="700"
                fontFamily="monospace"
              >
                80,569.5
              </text>
              <text
                x={svgWidth - paddingRight + 6}
                y={getY(80569.5) + 21}
                fill="#10b981"
                fontSize="8.5"
                fontFamily="monospace"
              >
                32:27
              </text>
            </g>

            {/* Hover Crosshair */}
            {hoveredCandleIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={(hoveredCandleIndex / (candleData.length - 1)) * (svgWidth - paddingRight)}
                  y1="0"
                  x2={(hoveredCandleIndex / (candleData.length - 1)) * (svgWidth - paddingRight)}
                  y2={svgHeight - 20}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1={getY(candleData[hoveredCandleIndex].close)}
                  x2={svgWidth - paddingRight}
                  y2={getY(candleData[hoveredCandleIndex].close)}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              </g>
            )}
          </svg>

          {/* Bottom Chart Status Bar */}
          <div className="tv-chart-statusbar">
            <div className="tv-status-left">
              <div className="tv-badge-pill">TV</div>
              <Calendar size={13} className="text-muted ml-2" />
            </div>

            <div className="tv-status-right font-mono">
              <span className="text-muted text-xs">12:57:32 UTC+5:30</span>
              <span className="tv-status-btn">%</span>
              <span className="tv-status-btn">log</span>
              <span className="tv-status-btn active">auto</span>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Order Book & Recent Trades */}
        <aside className="tv-right-sidebar">
          {/* Order Book Section */}
          <div className="tv-orderbook-box">
            <div className="tv-ob-header">
              <div className="tv-ob-title">Order Book</div>
              <div className="tv-ob-grouping">
                <span>0.5</span>
                <ChevronDown size={12} />
              </div>
            </div>

            {/* Columns */}
            <div className="tv-ob-col-headers font-mono">
              <span>Price (USD)</span>
              <span className="text-right">Size (BTC)</span>
              <span className="text-right">Total (BTC)</span>
            </div>

            {/* Asks (Red) */}
            <div className="tv-ob-list asks-list">
              {asks.map((a) => (
                <div key={a.price} className="tv-ob-row font-mono">
                  <div
                    className="tv-ob-depth-bar red"
                    style={{ width: `${a.depthPct}%` }}
                  ></div>
                  <span className="tv-ob-price text-rose">{a.price}</span>
                  <span className="tv-ob-size text-right text-muted">{a.size}</span>
                  <span className="tv-ob-total text-right text-muted">{a.total}</span>
                </div>
              ))}
            </div>

            {/* Spread / Mark Price Mid Banner */}
            <div className="tv-ob-spread-banner font-mono">
              <div className="tv-mid-price text-rose font-bold">$80569.5</div>
              <div className="tv-mark-tag">
                <span className="tv-m-box">M</span>
                <span className="text-muted">80569.4</span>
              </div>
            </div>

            {/* Bids (Green) */}
            <div className="tv-ob-list bids-list">
              {bids.map((b) => (
                <div key={b.price} className="tv-ob-row font-mono">
                  <div
                    className="tv-ob-depth-bar green"
                    style={{ width: `${b.depthPct}%` }}
                  ></div>
                  <span className="tv-ob-price text-emerald">{b.price}</span>
                  <span className="tv-ob-size text-right text-muted">{b.size}</span>
                  <span className="tv-ob-total text-right text-muted">{b.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Trades Section */}
          <div className="tv-recent-trades-box">
            <div className="tv-ob-header border-t border-color-light pt-2">
              <div className="tv-ob-title">Recent Trades</div>
            </div>

            <div className="tv-ob-col-headers font-mono">
              <span>Price (USD)</span>
              <span className="text-right">Size (BTC)</span>
              <span className="text-right">Time/Taker</span>
            </div>

            <div className="tv-trades-list font-mono text-xs">
              {recentTrades.map((t, idx) => (
                <div key={idx} className="tv-trade-row">
                  <span className={`tv-trade-price ${t.isBuy ? 'text-emerald' : 'text-rose'}`}>
                    {t.price} {t.isBuy ? '↗' : '↙'}
                  </span>
                  <span className="text-right text-white font-mono">{t.size}</span>
                  <span className="text-right text-muted font-mono">{t.time} /{t.side}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
