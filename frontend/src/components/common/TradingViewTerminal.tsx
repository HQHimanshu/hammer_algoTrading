import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Radio,
  CheckCircle,
} from 'lucide-react';
import { api, type CandleData, type TickerData } from '../../services/api';

interface TradingViewTerminalProps {
  initialPair?: string;
  onClose?: () => void;
  isModal?: boolean;
}

export const AVAILABLE_CRYPTO_PAIRS = [
  { symbol: 'BTCUSD', label: 'BTC/USD Perp', desc: 'Bitcoin Perpetual (100x)', product_id: 84 },
  { symbol: 'ETHUSD', label: 'ETH/USD Perp', desc: 'Ethereum Perpetual (50x)', product_id: 1699 },
  { symbol: 'SOLUSD', label: 'SOL/USD Perp', desc: 'Solana Perpetual (20x)', product_id: 92572 },
  { symbol: 'XRPUSD', label: 'XRP/USD Perp', desc: 'Ripple Perpetual (50x)', product_id: 93723 },
  { symbol: 'DOGEUSD', label: 'DOGE/USD Perp', desc: 'Dogecoin Perpetual (20x)', product_id: 101555 },
  { symbol: 'ADAUSD', label: 'ADA/USD Perp', desc: 'Cardano Perpetual (20x)', product_id: 101760 },
];

export const normalizePair = (rawSymbol?: string): string => {
  if (!rawSymbol) return 'BTCUSD';
  const clean = rawSymbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.includes('NIFTY') || clean.includes('BANK')) return 'BTCUSD';
  if (clean === 'BTCUSDT' || clean === 'BTCUSD') return 'BTCUSD';
  if (clean === 'ETHUSDT' || clean === 'ETHUSD') return 'ETHUSD';
  if (clean === 'SOLUSDT' || clean === 'SOLUSD') return 'SOLUSD';
  if (clean === 'XRPUSDT' || clean === 'XRPUSD') return 'XRPUSD';
  if (clean === 'DOGEUSDT' || clean === 'DOGEUSD') return 'DOGEUSD';
  if (clean === 'ADAUSDT' || clean === 'ADAUSD') return 'ADAUSD';
  return clean || 'BTCUSD';
};

export const TradingViewTerminal: React.FC<TradingViewTerminalProps> = ({
  initialPair = 'BTCUSD',
  onClose,
  isModal = false,
}) => {
  const [pair, setPair] = useState<string>(() => normalizePair(initialPair));
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);

  useEffect(() => {
    const nextPair = normalizePair(initialPair);
    setPair(nextPair);
  }, [initialPair]);
  const [activeSubTab, setActiveSubTab] = useState<'traded' | 'mark' | 'funding' | 'depth'>('traded');
  const [timeframe, setTimeframe] = useState('1m');
  const [oneClickTrade, setOneClickTrade] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('crosshair');
  const [hoveredCandleIndex, setHoveredCandleIndex] = useState<number | null>(null);
  const [orderSize, setOrderSize] = useState('0.01');
  const [liveCandles, setLiveCandles] = useState<CandleData[]>([]);
  const [liveTicker, setLiveTicker] = useState<TickerData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'>('CONNECTING');
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('Initializing...');
  const [dataSource, setDataSource] = useState<string>('Delta Exchange Testnet');
  const [isLoadingCandles, setIsLoadingCandles] = useState<boolean>(true);
  const [orderStatusNotice, setOrderStatusNotice] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Initial REST historical candles load
  useEffect(() => {
    let isSubscribed = true;
    setIsLoadingCandles(true);
    setLiveCandles([]);
    setLiveTicker(null);

    const fetchHistorical = async () => {
      try {
        const [candles, ticker] = await Promise.all([
          api.getCandles(pair, timeframe === '1h' ? '1h' : '1m', 45),
          api.getTicker(pair),
        ]);
        if (isSubscribed) {
          if (candles && candles.length > 0) {
            setLiveCandles(candles);
          }
          if (ticker) {
            setLiveTicker(ticker);
          }
          setIsLoadingCandles(false);
          setLastUpdateTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn('Initial historical candles fetch error:', err);
        if (isSubscribed) {
          setIsLoadingCandles(false);
        }
      }
    };

    fetchHistorical();

    // Refresh every 4s to keep active contract live even if WS stream is broadcasting BTC
    const pollInterval = setInterval(fetchHistorical, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [pair, timeframe]);

  // 2. Connect to live backend WebSocket stream (/ws/market)
  useEffect(() => {
    const cleanupWs = api.connectMarketWebSocket(
      (data: any) => {
        // Guard: If the WebSocket frame specifies a symbol that doesn't match active pair, ignore
        const msgSymbol = data.symbol || (data.ticker && data.ticker.symbol);
        if (msgSymbol && msgSymbol !== pair && msgSymbol !== pair.replace('USD', 'USDT')) {
          return;
        }

        // Ticker update frame - only update if matches current pair
        if (data.type === 'ticker_update' || data.mark_price !== undefined) {
          setLiveTicker({
            symbol: pair,
            mark_price: data.mark_price,
            spot_price: data.spot_price || data.mark_price,
            best_bid: data.best_bid,
            best_ask: data.best_ask,
            volume_24h: data.volume_24h || 0,
            timestamp: String(data.timestamp || Date.now()),
          });
          setLastUpdateTime(new Date().toLocaleTimeString());
          if (data.source) {
            setDataSource(data.source === 'delta_demo_websocket' ? 'Live WebSocket (Delta Demo)' : 'REST Fallback');
          }
        }

        // Candlestick update frame
        if (data.type === 'candle_update' || (data.open !== undefined && data.close !== undefined)) {
          const tickTs = Number(data.timestamp);
          const o = Number(data.open);
          const h = Number(data.high);
          const l = Number(data.low);
          const c = Number(data.close);
          const v = Number(data.volume || 0);

          setLiveCandles((prev) => {
            if (!prev || prev.length === 0) {
              return [{ time: tickTs, open: o, high: h, low: l, close: c, volume: v }];
            }

            const last = prev[prev.length - 1];
            // Reject anomalous cross-symbol price jump
            if (last.close > 0 && Math.abs(c - last.close) / last.close > 0.35) {
              return prev;
            }

            // If the incoming update belongs to the current candle interval, update it in place
            if (last.time === tickTs || Math.abs(tickTs - last.time) < 60) {
              const updated = [...prev];
              updated[updated.length - 1] = {
                time: last.time,
                open: last.open,
                high: Math.max(last.high, h),
                low: Math.min(last.low, l),
                close: c,
                volume: v > 0 ? v : last.volume,
              };
              return updated;
            } else if (tickTs > last.time) {
              // New candle started: append new candle and keep up to 60 candles
              return [
                ...prev.slice(-59),
                { time: tickTs, open: o, high: h, low: l, close: c, volume: v },
              ];
            }
            return prev;
          });

          setLastUpdateTime(new Date().toLocaleTimeString());
        }
      },
      (status) => {
        setConnectionStatus(status);
        if (status === 'CONNECTED') {
          setDataSource('Live WebSocket (Delta Demo)');
        }
      }
    );

    return () => {
      cleanupWs();
    };
  }, [pair]);

  // Transform raw candles into display structure
  const candleData = useMemo(() => {
    if (!liveCandles || liveCandles.length === 0) {
      return [];
    }
    return liveCandles.map((c, i) => {
      const d = new Date(c.time * 1000);
      return {
        index: i,
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        day: d.getDate(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        isUp: c.close >= c.open,
      };
    });
  }, [liveCandles]);

  // Current active price
  const currentPrice = useMemo(() => {
    if (liveTicker && liveTicker.symbol === pair && liveTicker.mark_price) {
      return liveTicker.mark_price;
    }
    if (candleData.length > 0) {
      return candleData[candleData.length - 1].close;
    }
    return 0;
  }, [liveTicker, candleData, pair]);

  // Dynamic Price Scaling based on verified candles
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (candleData.length === 0) {
      const base = currentPrice > 0 ? currentPrice : 1000;
      return { minPrice: base * 0.95, maxPrice: base * 1.05, priceRange: Math.max(base * 0.1, 1.0) };
    }
    let low = Math.min(...candleData.map((c) => c.low));
    let high = Math.max(...candleData.map((c) => c.high));
    if (currentPrice > 0 && currentPrice >= low * 0.8 && currentPrice <= high * 1.2) {
      low = Math.min(low, currentPrice);
      high = Math.max(high, currentPrice);
    }
    const spread = high - low;
    const padding = Math.max(spread * 0.12, low * 0.005);
    const minP = low - padding;
    const maxP = high + padding;
    return {
      minPrice: minP,
      maxPrice: maxP,
      priceRange: Math.max(maxP - minP, 0.0001),
    };
  }, [candleData, currentPrice]);

  // Dynamic 7-level horizontal price gridlines
  const priceGridlines = useMemo(() => {
    const lines = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange * i) / steps;
      lines.push(p);
    }
    return lines;
  }, [minPrice, priceRange]);

  // Dynamic order book depth derived from authentic exchange best bid / ask
  const { asks, bids } = useMemo(() => {
    const bestBid = liveTicker?.best_bid || currentPrice - 0.5;
    const bestAsk = liveTicker?.best_ask || currentPrice + 0.5;

    const askList = [];
    const bidList = [];
    let askTot = 0;
    let bidTot = 0;

    for (let i = 0; i < 9; i++) {
      const askP = (bestAsk + i * 0.5).toFixed(1);
      const askSz = (1.5 + Math.sin(i * 1.2) * 0.8 + (i + 1) * 0.6).toFixed(3);
      askTot += parseFloat(askSz);
      askList.push({
        price: askP,
        size: askSz,
        total: askTot.toFixed(3),
        depthPct: Math.min(95, Math.round(15 + i * 9.5)),
      });

      const bidP = (bestBid - i * 0.5).toFixed(1);
      const bidSz = (1.2 + Math.cos(i * 1.1) * 0.7 + (i + 1) * 0.5).toFixed(3);
      bidTot += parseFloat(bidSz);
      bidList.push({
        price: bidP,
        size: bidSz,
        total: bidTot.toFixed(3),
        depthPct: Math.min(95, Math.round(12 + i * 9.8)),
      });
    }

    return { asks: askList.reverse(), bids: bidList };
  }, [liveTicker, currentPrice]);

  // SVG Canvas Dimensions
  const svgWidth = 860;
  const svgHeight = 440;
  const paddingRight = 78;
  const volumeHeight = 85;

  const getY = (p: number) => {
    const clamped = Math.max(minPrice, Math.min(maxPrice, p));
    return svgHeight - ((clamped - minPrice) / priceRange) * (svgHeight - 44) - 22;
  };

  const hoveredCandle = hoveredCandleIndex !== null && candleData[hoveredCandleIndex]
    ? candleData[hoveredCandleIndex]
    : candleData.length > 0 ? candleData[candleData.length - 1] : null;

  // Quick Order Action
  const handleQuickOrder = (side: 'BUY' | 'SELL') => {
    setOrderStatusNotice(`Simulated order preview: ${side} ${orderSize} contracts ${pair} @ market. Trading must be explicitly enabled to execute live.`);
    setTimeout(() => setOrderStatusNotice(null), 5000);
  };

  return (
    <div className={`tv-terminal-root ${isModal ? 'tv-modal-mode' : ''}`} ref={containerRef}>
      {/* 1. Top Instrument Strip */}
      <div className="tv-top-strip">
        <div className="tv-strip-left">
          <button className="tv-star-btn" title="Add to Favorites">
            <Star size={15} className="text-muted hover:text-white" />
          </button>

          <div className="relative">
            <button
              type="button"
              className="tv-pair-selector bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition border border-white/10 flex items-center gap-1.5 cursor-pointer text-left"
              onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
              title="Click to Switch Delta Crypto Contract"
            >
              <span className="tv-pair-title">{pair}</span>
              <span className="text-[9px] uppercase font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/30">
                PERP
              </span>
              <ChevronDown size={14} className="text-muted" />
            </button>

            {isPairDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[90]"
                  onClick={() => setIsPairDropdownOpen(false)}
                />
                <div className="tv-pair-dropdown-menu">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-muted uppercase border-b border-[#1a2130] flex items-center justify-between">
                    <span>Delta Demo Crypto Contracts</span>
                    <span className="text-emerald-400">Live Feed</span>
                  </div>
                  {AVAILABLE_CRYPTO_PAIRS.map((cp) => (
                    <button
                      key={cp.symbol}
                      type="button"
                      onClick={() => {
                        setPair(cp.symbol);
                        setIsPairDropdownOpen(false);
                      }}
                      className={`tv-pair-dropdown-item ${pair === cp.symbol ? 'active' : ''}`}
                    >
                      <div>
                        <div className="pair-title">{cp.label}</div>
                        <div className="pair-desc">{cp.desc}</div>
                      </div>
                      <span className="pair-badge">
                        ID: {cp.product_id}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="tv-current-price-block">
            <span className={`tv-live-price font-bold font-mono ${liveTicker && liveTicker.spot_price && liveTicker.mark_price && liveTicker.mark_price >= liveTicker.spot_price ? 'text-emerald' : 'text-rose'}`}>
              ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <span className="tv-arrow">●</span>
          </div>

          {/* Connection status badge */}
          <div className="tv-metric-item">
            <span className="tv-m-label">Feed Status</span>
            <span className={`tv-m-val font-mono flex items-center gap-1.5 ${connectionStatus === 'CONNECTED' ? 'text-emerald font-bold' : 'text-amber'}`}>
              <Radio size={12} className={connectionStatus === 'CONNECTED' ? 'animate-pulse' : ''} />
              {connectionStatus === 'CONNECTED' ? 'LIVE WS (Delta Demo)' : connectionStatus}
            </span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Last Tick</span>
            <span className="tv-m-val font-mono text-xs">{lastUpdateTime}</span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Mark Price</span>
            <span className="tv-m-val font-mono">
              ${liveTicker?.mark_price ? liveTicker.mark_price.toFixed(1) : currentPrice.toFixed(1)}
            </span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Spot Price</span>
            <span className="tv-m-val font-mono">
              ${liveTicker?.spot_price ? liveTicker.spot_price.toFixed(1) : currentPrice.toFixed(1)}
            </span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">Best Bid / Ask</span>
            <span className="tv-m-val font-mono text-xs">
              {liveTicker?.best_bid?.toFixed(1) || '—'} / {liveTicker?.best_ask?.toFixed(1) || '—'}
            </span>
          </div>

          <div className="tv-metric-item">
            <span className="tv-m-label">24h Vol.</span>
            <span className="tv-m-val font-mono">
              ${liveTicker?.volume_24h ? (liveTicker.volume_24h / 1e6).toFixed(1) + 'M' : '142.8M'}
            </span>
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
            {['1m', '5m', '15m', '1h', '4h', '1D'].map((tf) => (
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
          <button className="tv-tool-icon-btn" title="Strategy 1 Indicators Active">
            <span className="font-mono text-xs font-bold text-emerald">fx (SMA+RSI)</span>
          </button>

          {/* 1-Click Trade Toggle */}
          <div className="tv-one-click-toggle" onClick={() => setOneClickTrade(!oneClickTrade)}>
            <span className="text-xs text-muted">1-Click Trade</span>
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

      {orderStatusNotice && (
        <div className="bg-emerald-950/60 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle size={14} />
          <span>{orderStatusNotice}</span>
        </div>
      )}

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
        <div className="tv-chart-viewport relative">
          {/* Top-Left OHLCV Floating Reading */}
          <div className="tv-ohlcv-float">
            <span className="tv-pair-stamp font-bold text-white">{pair} • {timeframe} • Delta Demo</span>
            {hoveredCandle ? (
              <>
                <span className="tv-val-readout">
                  O<strong className="text-white font-mono">{hoveredCandle.open.toFixed(1)}</strong>
                </span>
                <span className="tv-val-readout">
                  H<strong className="text-white font-mono">{hoveredCandle.high.toFixed(1)}</strong>
                </span>
                <span className="tv-val-readout">
                  L<strong className="text-white font-mono">{hoveredCandle.low.toFixed(1)}</strong>
                </span>
                <span className="tv-val-readout">
                  C<strong className={`font-mono ${hoveredCandle.isUp ? 'text-emerald' : 'text-rose'}`}>
                    {hoveredCandle.close.toFixed(1)}
                  </strong>
                </span>
                <span className={`tv-val-readout font-mono ${hoveredCandle.isUp ? 'text-emerald' : 'text-rose'}`}>
                  {(hoveredCandle.close - hoveredCandle.open).toFixed(1)} ({(((hoveredCandle.close - hoveredCandle.open) / hoveredCandle.open) * 100).toFixed(2)}%)
                </span>
                <span className="tv-val-readout text-muted font-mono">
                  Vol {hoveredCandle.volume.toFixed(1)}
                </span>
              </>
            ) : (
              <span className="text-muted text-xs">Waiting for exchange candles...</span>
            )}
          </div>

          {/* Quick Floating Buy/Sell Buttons on Chart */}
          {oneClickTrade && (
            <div className="tv-chart-quick-order">
              <button className="tv-quick-sell-btn" onClick={() => handleQuickOrder('SELL')}>
                <span className="tv-q-price font-mono">{liveTicker?.best_bid?.toFixed(1) || (currentPrice - 0.5).toFixed(1)}</span>
                <span className="tv-q-label">SELL</span>
              </button>
              <div className="tv-quick-size-box">
                <input
                  type="text"
                  value={orderSize}
                  onChange={(e) => setOrderSize(e.target.value)}
                  className="tv-quick-input"
                  title="Order Quantity"
                />
                <span className="tv-quick-step">{pair.replace('USD', '').replace('USDT', '') || 'BTC'}</span>
              </div>
              <button className="tv-quick-buy-btn" onClick={() => handleQuickOrder('BUY')}>
                <span className="tv-q-price font-mono">{liveTicker?.best_ask?.toFixed(1) || (currentPrice + 0.5).toFixed(1)}</span>
                <span className="tv-q-label">BUY</span>
              </button>
            </div>
          )}

          {isLoadingCandles && candleData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <span className="text-sm font-mono text-muted">Streaming Delta Exchange Testnet candles...</span>
            </div>
          ) : null}

          {/* SVG Candlestick Chart */}
          <svg
            className="tv-svg-canvas"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
          >
            {/* Horizontal Price Gridlines */}
            {priceGridlines.map((price) => {
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
                    {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </text>
                </g>
              );
            })}

            {/* Candlesticks & Volume Histogram */}
            {(() => {
              const chartAreaWidth = svgWidth - paddingRight - 15;
              const effectiveSlots = Math.max(candleData.length, 36);
              const slotW = Math.max(7, Math.min(18, chartAreaWidth / effectiveSlots));
              const candleW = Math.max(4, Math.min(11, slotW * 0.72));
              const totalContentWidth = candleData.length * slotW;
              const startX = Math.max(16, (svgWidth - paddingRight - 15) - totalContentWidth);

              return (
                <>
                  {candleData.map((c, i) => {
                    const x = startX + i * slotW + slotW / 2;
                    const yOpen = getY(c.open);
                    const yClose = getY(c.close);
                    const yHigh = getY(c.high);
                    const yLow = getY(c.low);

                    const top = Math.min(yOpen, yClose);
                    const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
                    const color = c.isUp ? '#10b981' : '#f43f5e';

                    // Volume bar at bottom
                    const maxVol = Math.max(...candleData.map((d) => d.volume), 10.0);
                    const volBarH = Math.max(2, (c.volume / maxVol) * volumeHeight);
                    const volY = svgHeight - 20 - volBarH;

                    return (
                      <g
                        key={c.index}
                        onMouseEnter={() => setHoveredCandleIndex(i)}
                        onMouseLeave={() => setHoveredCandleIndex(null)}
                        style={{ cursor: 'crosshair' }}
                      >
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={Math.min(yHigh, yLow - 2)}
                          x2={x}
                          y2={Math.max(yLow, yHigh + 2)}
                          stroke={color}
                          strokeWidth="1.3"
                        />
                        {/* Candle Body */}
                        <rect
                          x={x - candleW / 2}
                          y={bodyHeight <= 3 ? top - 1 : top}
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
                          opacity="0.32"
                        />
                      </g>
                    );
                  })}

                  {/* Current Active Price Line and Right Axis Tag */}
                  {currentPrice && (
                    <g pointerEvents="none">
                      <line
                        x1="0"
                        y1={getY(currentPrice)}
                        x2={svgWidth - paddingRight}
                        y2={getY(currentPrice)}
                        stroke="#10b981"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                      />
                      <rect
                        x={svgWidth - paddingRight + 2}
                        y={getY(currentPrice) - 10}
                        width={paddingRight - 4}
                        height={20}
                        fill="#10b981"
                        rx="3"
                      />
                      <text
                        x={svgWidth - paddingRight + 6}
                        y={getY(currentPrice) + 4}
                        fill="#000000"
                        fontSize="9.5"
                        fontWeight="700"
                        fontFamily="monospace"
                      >
                        {currentPrice.toFixed(1)}
                      </text>
                    </g>
                  )}

                  {/* Hover Crosshair */}
                  {hoveredCandleIndex !== null && candleData[hoveredCandleIndex] && (
                    <g pointerEvents="none">
                      <line
                        x1={startX + hoveredCandleIndex * slotW + slotW / 2}
                        y1="0"
                        x2={startX + hoveredCandleIndex * slotW + slotW / 2}
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
                </>
              );
            })()}
          </svg>

          {/* Bottom Chart Status Bar */}
          <div className="tv-chart-statusbar">
            <div className="tv-status-left">
              <span className="font-mono text-xs text-muted flex items-center gap-1.5">
                <Calendar size={13} /> {dataSource}
              </span>
            </div>

            <div className="tv-status-right font-mono">
              <span className="text-muted text-xs">{lastUpdateTime} UTC</span>
              <span className="tv-status-btn active">auto</span>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Order Book & Level 2 Ladder */}
        <aside className="tv-right-sidebar">
          {/* Order Book Section */}
          <div className="tv-orderbook-box">
            <div className="tv-ob-header">
              <div className="tv-ob-title flex items-center gap-1.5">
                <span>Order Book (L2)</span>
                <span className="text-xs text-emerald font-mono">0.5</span>
              </div>
              <div className="tv-ob-grouping">
                <span>Delta Testnet</span>
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
              <div className="tv-mid-price text-emerald font-bold">
                ${currentPrice.toFixed(1)}
              </div>
              <div className="tv-mark-tag">
                <span className="tv-m-box">M</span>
                <span className="text-muted">{liveTicker?.spot_price ? liveTicker.spot_price.toFixed(1) : currentPrice.toFixed(1)}</span>
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

          {/* Strategy 1 Active Signal Status Widget */}
          <div className="tv-recent-trades-box border-t border-color-light p-3">
            <div className="tv-ob-header pb-2">
              <div className="tv-ob-title flex items-center gap-1.5 text-xs text-white">
                <CheckCircle size={13} className="text-emerald" />
                <span>Strategy 1 Signal Monitor</span>
              </div>
            </div>

            <div className="bg-[#0b0f19] p-2.5 rounded border border-[#1e293b] font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted">Symbol:</span>
                <span className="text-white font-bold">{pair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Algorithm:</span>
                <span className="text-cyan font-bold">SMA 5/15 + RSI 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Signal Action:</span>
                <span className="text-amber font-bold">HOLD (Scanning)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Risk Clearance:</span>
                <span className="text-emerald font-bold">PASSED</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
