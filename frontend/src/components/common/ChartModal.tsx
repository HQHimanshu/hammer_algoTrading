import React, { useState, useMemo } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
} from 'lucide-react';

export interface ChartAsset {
  pair: string;
  price: string;
  change: string;
  high: string;
  low: string;
  volume: string;
  positive: boolean;
}

interface ChartModalProps {
  asset: ChartAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({ asset, isOpen, onClose }) => {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '4H' | '1D'>('15m');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Generate realistic synthetic candlestick data
  const candleData = useMemo(() => {
    if (!asset) return [];
    const basePrice = parseFloat(asset.price.replace(/[^0-9.]/g, '')) || 67000;
    const candles = [];
    let current = basePrice * 0.97;

    for (let i = 0; i < 36; i++) {
      const volatility = basePrice * 0.008;
      const change = (Math.sin(i * 0.5) + (Math.random() - 0.47) * 2) * volatility;
      const open = current;
      const close = current + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.8;
      const low = Math.min(open, close) - Math.random() * volatility * 0.8;
      const volume = Math.floor(Math.random() * 850 + 200);
      const isUp = close >= open;

      candles.push({
        time: `${10 + Math.floor(i / 6)}:${(i % 6) * 10 || '00'}`,
        open,
        high,
        low,
        close,
        volume,
        isUp,
      });

      current = close;
    }
    return candles;
  }, [asset, timeframe]);

  if (!isOpen || !asset) return null;

  // Compute SVG dimensions and scales
  const chartHeight = 320;
  const chartWidth = 760;
  const volHeight = 70;
  const paddingBottom = 40;
  const paddingRight = 60;

  const minPrice = Math.min(...candleData.map((c) => c.low));
  const maxPrice = Math.max(...candleData.map((c) => c.high));
  const priceRange = maxPrice - minPrice || 1;

  const maxVol = Math.max(...candleData.map((c) => c.volume));

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * (chartHeight - 40) - 20;
  };

  const hoveredCandle = hoverIndex !== null ? candleData[hoverIndex] : candleData[candleData.length - 1];

  // Moving average lines
  const ma7Points = candleData
    .map((_c, i) => {
      const x = (i / (candleData.length - 1)) * (chartWidth - paddingRight);
      const slice = candleData.slice(Math.max(0, i - 6), i + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length;
      return `${x},${getY(avg)}`;
    })
    .join(' ');

  const ma25Points = candleData
    .map((_c, i) => {
      const x = (i / (candleData.length - 1)) * (chartWidth - paddingRight);
      const slice = candleData.slice(Math.max(0, i - 14), i + 1);
      const avg = slice.reduce((acc, curr) => acc + curr.close, 0) / slice.length;
      return `${x},${getY(avg)}`;
    })
    .join(' ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="chart-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="chart-modal-header">
          <div className="chart-modal-asset-info">
            <div className="asset-pair-tag">
              <span className="pair-symbol">{asset.pair}</span>
              <span className="pair-badge">Perpetual</span>
            </div>

            <div className="asset-price-group">
              <span className="asset-main-price">{asset.price}</span>
              <span className={`asset-delta ${asset.positive ? 'positive' : 'negative'}`}>
                {asset.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {asset.change}
              </span>
            </div>

            <div className="asset-stat-pills">
              <div className="stat-pill">
                <span className="p-lbl">24h High:</span>
                <span className="p-val">{asset.high}</span>
              </div>
              <div className="stat-pill">
                <span className="p-lbl">24h Low:</span>
                <span className="p-val">{asset.low}</span>
              </div>
              <div className="stat-pill">
                <span className="p-lbl">24h Vol:</span>
                <span className="p-val font-mono">{asset.volume}</span>
              </div>
            </div>
          </div>

          <div className="chart-modal-controls">
            {/* Timeframe selector */}
            <div className="timeframe-buttons">
              {(['1m', '5m', '15m', '1H', '4H', '1D'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Chart Mode */}
            <div className="type-buttons">
              <button
                onClick={() => setChartType('candle')}
                className={`type-btn ${chartType === 'candle' ? 'active' : ''}`}
                title="Candlestick Chart"
              >
                <Layers size={14} />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`type-btn ${chartType === 'line' ? 'active' : ''}`}
                title="Line Chart"
              >
                <Activity size={14} />
              </button>
            </div>

            <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* OHLCV Legend Bar */}
        <div className="chart-legend-bar">
          <div className="legend-ohlc">
            <span className="legend-item">
              Time: <strong>{hoveredCandle?.time}</strong>
            </span>
            <span className="legend-item">
              O: <strong className="font-mono">${hoveredCandle?.open.toFixed(2)}</strong>
            </span>
            <span className="legend-item">
              H: <strong className="font-mono">${hoveredCandle?.high.toFixed(2)}</strong>
            </span>
            <span className="legend-item">
              L: <strong className="font-mono">${hoveredCandle?.low.toFixed(2)}</strong>
            </span>
            <span className="legend-item">
              C:{' '}
              <strong
                className={`font-mono ${hoveredCandle?.isUp ? 'text-emerald' : 'text-rose'}`}
              >
                ${hoveredCandle?.close.toFixed(2)}
              </strong>
            </span>
            <span className="legend-item">
              Vol: <strong className="font-mono">{hoveredCandle?.volume} BTC</strong>
            </span>
          </div>

          <div className="legend-indicators">
            <span className="indicator-tag tag-ma7">MA(7): ${hoveredCandle?.close.toFixed(2)}</span>
            <span className="indicator-tag tag-ma25">MA(25): ${(hoveredCandle ? hoveredCandle.close * 0.994 : 0).toFixed(2)}</span>
            <span className="indicator-tag tag-rsi">RSI(14): 61.4</span>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="chart-canvas-container">
          <svg
            className="trading-chart-svg"
            viewBox={`0 0 ${chartWidth} ${chartHeight + volHeight + paddingBottom}`}
            preserveAspectRatio="none"
          >
            {/* Gridlines */}
            {[0.2, 0.4, 0.6, 0.8].map((pct) => {
              const y = chartHeight * pct;
              const priceAtY = maxPrice - pct * priceRange;
              return (
                <g key={pct}>
                  <line
                    x1="0"
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#1a2232"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={chartWidth - paddingRight + 8}
                    y={y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${priceAtY.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Moving Averages */}
            <polyline
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.5"
              strokeOpacity="0.85"
              points={ma7Points}
            />
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.85"
              points={ma25Points}
            />

            {/* Candlesticks or Area/Line */}
            {chartType === 'candle' ? (
              candleData.map((c, i) => {
                const totalCandles = candleData.length;
                const slotWidth = (chartWidth - paddingRight) / totalCandles;
                const x = i * slotWidth + slotWidth / 2;
                const candleWidth = Math.max(3, slotWidth * 0.65);

                const yOpen = getY(c.open);
                const yClose = getY(c.close);
                const yHigh = getY(c.high);
                const yLow = getY(c.low);

                const top = Math.min(yOpen, yClose);
                const height = Math.max(2, Math.abs(yClose - yOpen));
                const color = c.isUp ? '#10b981' : '#f43f5e';

                // Volume bar
                const volY = chartHeight + volHeight - (c.volume / maxVol) * volHeight + 10;
                const volBarH = (c.volume / maxVol) * volHeight;

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(null)}
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
                      x={x - candleWidth / 2}
                      y={top}
                      width={candleWidth}
                      height={height}
                      fill={color}
                      rx="1"
                    />
                    {/* Volume Bar */}
                    <rect
                      x={x - candleWidth / 2}
                      y={volY}
                      width={candleWidth}
                      height={volBarH}
                      fill={color}
                      opacity="0.35"
                    />
                  </g>
                );
              })
            ) : (
              /* Line chart mode */
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                points={candleData
                  .map((c, i) => {
                    const x = (i / (candleData.length - 1)) * (chartWidth - paddingRight);
                    return `${x},${getY(c.close)}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Crosshair indicator on hover */}
            {hoverIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={(hoverIndex / (candleData.length - 1)) * (chartWidth - paddingRight)}
                  y1="0"
                  x2={(hoverIndex / (candleData.length - 1)) * (chartWidth - paddingRight)}
                  y2={chartHeight + volHeight}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1={getY(candleData[hoverIndex].close)}
                  x2={chartWidth - paddingRight}
                  y2={getY(candleData[hoverIndex].close)}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Quick Execution Bar at Bottom of Chart */}
        <div className="chart-footer-actions">
          <div className="footer-signals">
            <span className="signal-label">Engine Signal:</span>
            <span className="pill pill-green font-mono">STRONG BUY (Score: 8.8/10)</span>
            <span className="text-muted text-xs">Spread: 0.01% • 24h Vol: High</span>
          </div>

          <div className="footer-order-buttons">
            <button className="btn-sm btn-secondary">Add to Watchlist</button>
            <button className="btn-sm btn-sell">Short {asset.pair.split('/')[0]}</button>
            <button className="btn-sm btn-buy">Long {asset.pair.split('/')[0]}</button>
          </div>
        </div>
      </div>
    </div>
  );
};
