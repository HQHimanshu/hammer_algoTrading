import React, { useState } from 'react';
import {
  Zap,
  Shield,
  Bot,
  Smartphone,
  Layers,
  ArrowRight,
  Code,
  Cpu,
  BarChart2,
  CheckCircle2,
  X,
  Play,
  TrendingUp,
} from 'lucide-react';
import type { NavigationId } from '../../types/navigation';

interface HomePageProps {
  onNavigate?: (tab: NavigationId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // Centerpiece 3D interactive tab state
  const [activeCenterpieceTab, setActiveCenterpieceTab] = useState<'fee' | 'latency' | 'quant'>('fee');
  const [selectedPillar, setSelectedPillar] = useState<number>(0);
  const [strategyFilter, setStrategyFilter] = useState<'all' | 'delta-neutral' | 'trend' | 'hft'>('all');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [hoveredCoin, setHoveredCoin] = useState<string | null>(null);
  const [terminalStatus, setTerminalStatus] = useState<'running' | 'paused' | 'stopped'>('running');

  // Interactive moving crypto elements inside the 3D Glass "H"
  const glassHCoins = [
    {
      id: 'btc',
      name: 'Bitcoin',
      ticker: 'BTC',
      price: '$67,840.20',
      change: '+2.84%',
      top: '22%',
      left: '26%',
      floatAnim: 'coinFloatA',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.75)',
      symbolText: '₿',
    },
    {
      id: 'eth1',
      name: 'Ethereum',
      ticker: 'ETH',
      price: '$3,524.50',
      change: '+3.18%',
      top: '43%',
      left: '26%',
      floatAnim: 'coinFloatB',
      color: '#60a5fa',
      glow: 'rgba(96, 165, 250, 0.75)',
      symbolText: 'Ξ',
    },
    {
      id: 'sol1',
      name: 'Solana',
      ticker: 'SOL',
      price: '$185.10',
      change: '+5.42%',
      top: '64%',
      left: '26%',
      floatAnim: 'coinFloatC',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.8)',
      symbolText: '◎',
    },
    {
      id: 'gem',
      name: 'Alpha Gem',
      ticker: 'ALPHA',
      price: 'Zero Slip',
      change: '100Hz',
      top: '45%',
      left: '39%',
      floatAnim: 'coinFloatD',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.8)',
      symbolText: '💎',
    },
    {
      id: 'sol2',
      name: 'Solana Perps',
      ticker: 'SOL-P',
      price: '$185.10',
      change: '+5.42%',
      top: '45%',
      left: '51%',
      floatAnim: 'coinFloatA',
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.75)',
      symbolText: '◎',
    },
    {
      id: 'doge',
      name: 'Dogecoin',
      ticker: 'DOGE',
      price: '$0.1420',
      change: '+4.10%',
      top: '46%',
      left: '63%',
      floatAnim: 'coinFloatB',
      color: '#eab308',
      glow: 'rgba(234, 179, 8, 0.8)',
      symbolText: 'Ð',
    },
    {
      id: 'eth2',
      name: 'Ether Options',
      ticker: 'ETH-OPT',
      price: '$3,524.50',
      change: '+3.18%',
      top: '28%',
      left: '73%',
      floatAnim: 'coinFloatC',
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.8)',
      symbolText: 'Ξ',
    },
    {
      id: 'pepe',
      name: 'Pepe Scalper',
      ticker: 'PEPE',
      price: '$0.0000098',
      change: '+7.20%',
      top: '63%',
      left: '73%',
      floatAnim: 'coinFloatD',
      color: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.85)',
      symbolText: '🐸',
    },
  ];

  // Navigate handler helper
  const handleNav = (tab: NavigationId) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  // Centerpiece configurations for 3D showcase
  const centerpieceData = {
    fee: {
      zeroValue: '0',
      textLabel: 'fee',
      subText: 'ZERO HIDDEN COMMISSION',
      pillars: [
        { title: 'OPTIONS', val: '0 Fee', sub: '(On OTM Expiry & Straddles)' },
        { title: 'FUTURES', val: '0 Exit Fee', sub: '(Via Scalper & Maker Pass)' },
        { title: 'SPOT & ALGO', val: '0 Entry Fee', sub: '(Zero Spread Markup)' },
      ],
    },
    latency: {
      zeroValue: '0.8',
      textLabel: 'ms',
      subText: 'ULTRA-LOW LATENCY PIPELINE',
      pillars: [
        { title: 'WEBSOCKET 2.0', val: '< 0.8ms', sub: '(Direct Fiber Co-location)' },
        { title: 'ORDER ROUTER', val: '0.2ms', sub: '(In-Memory Matching)' },
        { title: 'TICK TO TRADE', val: '1.1ms', sub: '(End-to-End Execution)' },
      ],
    },
    quant: {
      zeroValue: '100%',
      textLabel: 'algo',
      subText: 'AUTONOMOUS QUANT ENGINE',
      pillars: [
        { title: 'BACKTESTING', val: '10 Yrs', sub: '(Tick-by-Tick Precision)' },
        { title: 'RISK SHIELD', val: '0 Slippage', sub: '(Real-time Circuit Breaker)' },
        { title: 'DEPLOYMENT', val: '1-Click', sub: '(Python SDK & No-Code)' },
      ],
    },
  };

  const currentCenterpiece = centerpieceData[activeCenterpieceTab];

  // Algorithmic strategies data
  const strategies = [
    {
      id: 'vol-arb',
      name: 'Hammer Volatility Arbitrage',
      category: 'delta-neutral',
      pair: 'BTC / ETH Options',
      apy: '+44.2%',
      winRate: '86.4%',
      sharpe: '3.12',
      tag: 'Delta Neutral',
      desc: 'Exploits implied volatility mispricings across crypto derivative strikes with automatic delta hedging.',
    },
    {
      id: 'iron-condor',
      name: 'Delta Neutral Iron Condor',
      category: 'delta-neutral',
      pair: 'BTC & ETH Options & Perps',
      apy: '+32.8%',
      winRate: '91.2%',
      sharpe: '2.94',
      tag: 'Options Greeks',
      desc: 'Systematically collects theta decay within defined volatility corridors with dynamic wing adjustment.',
    },
    {
      id: 'momentum-v4',
      name: 'Momentum Trend Breakout v4',
      category: 'trend',
      pair: 'SOL / USDT Futures',
      apy: '+58.6%',
      winRate: '74.5%',
      sharpe: '2.65',
      tag: 'Trend Scalp',
      desc: 'High-probability trend continuation triggers with trailing multi-target stop-loss safeguards.',
    },
    {
      id: 'grid-hft',
      name: 'Ultra-Fast Market Maker Grid',
      category: 'hft',
      pair: 'ETH / USDT Perps',
      apy: '+38.4%',
      winRate: '94.8%',
      sharpe: '3.40',
      tag: 'Sub-ms HFT',
      desc: 'Sub-millisecond bid-ask liquidity capture providing rebate capture and zero directional bias.',
    },
  ];

  const filteredStrategies = strategyFilter === 'all'
    ? strategies
    : strategies.filter((s) => s.category === strategyFilter);

  return (
    <div className="entrance-page-root">
      {/* ================= HERO SECTION (Exact Reference Layout in B&W) ================= */}
      <section className="bw-hero-wrapper">
        <div className="bw-hero-backdrop-glow"></div>

        <div className="bw-hero-grid">
          {/* Hero Left Column */}
          <div className="bw-hero-left">
            <div className="bw-badge-india">
              <span className="bw-flag-dot" role="img" aria-label="India flag">🇮🇳</span>
              <span>Made for INDIA</span>
              <span className="bw-badge-sub">• High-Frequency Quant F&amp;O</span>
            </div>

            <h1 className="bw-hero-title">
              Trade Futures &amp; Options<br />
              <span className="bw-highlight">on Bitcoin and Ether</span>
            </h1>

            <p className="bw-hero-desc">
              Elevate your crypto F&amp;O trading with 24/7 open markets,
              efficient margining, sub-millisecond execution and seamless INR settlement.
            </p>

            <div className="bw-hero-cta-group">
              <button
                className="bw-cta-primary"
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthModalOpen(true);
                }}
              >
                <span className="cta-sheen-sweep"></span>
                <span className="cta-glow-pulse"></span>
                <div className="cta-btn-text-wrap">
                  <span className="cta-btn-main">Sign Up</span>
                  <span className="cta-btn-sub">0 INR DEPOSIT FEE</span>
                </div>
                <div className="cta-icon-circle">
                  <ArrowRight size={18} />
                </div>
              </button>

              <button
                className="bw-cta-secondary"
                type="button"
                onClick={() => handleNav('algo-trading')}
              >
                <span className="cta-secondary-glow"></span>
                <div className="cta-terminal-indicator">
                  <span className="cta-ping-dot"></span>
                  <Bot size={18} className="cta-bot-icon" />
                </div>
                <div className="cta-btn-text-wrap">
                  <span className="cta-btn-main">Explore Algo Terminal</span>
                  <span className="cta-btn-sub">SUB-MS PYTHON ENGINE</span>
                </div>
                <span className="cta-kbd-chip">&gt;_ CLI</span>
              </button>
            </div>

            <div className="bw-trade-on-go">
              <span className="bw-trade-label">Trade On the Go!</span>
              <div className="bw-app-badges">
                <button
                  className="bw-app-badge"
                  type="button"
                  onClick={() => setIsMobileModalOpen(true)}
                >
                  <Smartphone size={14} />
                  <span>Google Play</span>
                </button>
                <button
                  className="bw-app-badge"
                  type="button"
                  onClick={() => setIsMobileModalOpen(true)}
                >
                  <Smartphone size={14} />
                  <span>App Store</span>
                </button>
                <button
                  className="bw-app-badge"
                  type="button"
                  onClick={() => handleNav('algo-trading')}
                >
                  <Code size={14} />
                  <span>Python SDK</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hero Right Column: 3D Showcase Centerpiece */}
          <div className="bw-showcase-container">
            {/* Interactive Showcase Tabs */}
            <div className="bw-showcase-toggle-tabs">
              <button
                className={`bw-tab-btn ${activeCenterpieceTab === 'fee' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveCenterpieceTab('fee')}
              >
                0 Fee Architecture
              </button>
              <button
                className={`bw-tab-btn ${activeCenterpieceTab === 'latency' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveCenterpieceTab('latency')}
              >
                Sub-ms Latency
              </button>
              <button
                className={`bw-tab-btn ${activeCenterpieceTab === 'quant' ? 'active' : ''}`}
                type="button"
                onClick={() => setActiveCenterpieceTab('quant')}
              >
                100% Quant Auto
              </button>
            </div>

            {/* 3D Centerpiece Visual Stage: 3D Transparent Glass Letter "H" with Animated Moving Elements */}
            <div className="bw-3d-stage">
              {/* Green Atmospheric Glow Aura */}
              <div className="glass-h-glow-aura"></div>

              {/* Floating Live Signal Chips */}
              <div className="glass-h-chip glass-h-chip-topleft">
                <span className="wbg-stat-dot"></span>
                <span>Sub-ms Latency: 0.8ms</span>
              </div>

              <div className="glass-h-chip glass-h-chip-topright">
                <Shield size={14} color="#10b981" />
                <span>Zero Slippage Guard</span>
              </div>

              <div className="glass-h-chip glass-h-chip-bottomright">
                <TrendingUp size={14} color="#10b981" />
                <span>Alpha Engine: +44.2%</span>
              </div>

              {/* 3D Glass Letter "H" Render Container with Moving Elements Layer */}
              <div className="glass-h-render-container">
                <img
                  src="/hammer_glass_h_crypto.jpg"
                  alt="Hammer 3D Glass H with Crypto Coins & Grass Pedestal"
                  className="glass-h-image"
                />

                {/* Vertical ascending quantum energy sparks inside the glass chamber */}
                <div className="h-quantum-spark h-spark-1"></div>
                <div className="h-quantum-spark h-spark-2"></div>
                <div className="h-quantum-spark h-spark-3"></div>
                <div className="h-quantum-spark h-spark-4"></div>
                <div className="h-quantum-spark h-spark-5"></div>

                {/* Horizontal scanline laser across the H crossbar */}
                <div className="h-crossbar-pulse-beam"></div>

                {/* Animated Moving Crypto Tokens Floating Inside the Glass "H" */}
                {glassHCoins.map((coin) => {
                  const isHovered = hoveredCoin === coin.id;

                  return (
                    <div
                      key={coin.id}
                      className={`h-moving-coin ${coin.floatAnim} ${isHovered ? 'hovered' : ''}`}
                      style={{
                        top: coin.top,
                        left: coin.left,
                        '--coin-color': coin.color,
                        '--coin-glow': coin.glow,
                      } as React.CSSProperties}
                      onMouseEnter={() => setHoveredCoin(coin.id)}
                      onMouseLeave={() => setHoveredCoin(null)}
                    >
                      {/* Animated Token Disc */}
                      <div className="coin-disc">
                        <span className="coin-symbol-text">{coin.symbolText}</span>
                        <div className="coin-shimmer"></div>
                      </div>

                      {/* Tooltip Pill displaying Live Stats */}
                      <div className={`coin-stats-tooltip ${isHovered ? 'visible' : ''}`}>
                        <span className="coin-tooltip-name">{coin.name}</span>
                        <span className="coin-tooltip-price">{coin.price}</span>
                        <span className="coin-tooltip-change">{coin.change}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Pillars Below Centerpiece (Green, Orange, Red Buttons/Pills) */}
            <div className="bw-three-pillars">
              {currentCenterpiece.pillars.map((pillar, idx) => {
                const colorTheme = idx === 0 ? 'pillar-green' : idx === 1 ? 'pillar-orange' : 'pillar-red';
                const buttonText = idx === 0 ? 'Trade Options' : idx === 1 ? 'Trade Futures' : 'Launch Algo';
                const tagText = idx === 0 ? 'ZERO COMMISSION' : idx === 1 ? 'MAKER REBATE' : 'ZERO SPREAD';
                const targetTab: NavigationId = idx === 0 ? 'options' : idx === 1 ? 'futures' : 'algo-trading';

                return (
                  <div
                    key={idx}
                    className={`bw-pillar-card ${colorTheme} ${selectedPillar === idx ? 'active' : ''}`}
                    onClick={() => setSelectedPillar(idx)}
                  >
                    <div className="pillar-top-badge-row">
                      <span className={`pillar-tag-badge badge-${colorTheme}`}>
                        <span className="pillar-pulse-dot"></span>
                        {tagText}
                      </span>
                    </div>

                    <div className="bw-pillar-title">{pillar.title}</div>
                    <div className="bw-pillar-val">{pillar.val}</div>
                    <div className="bw-pillar-sub">{pillar.sub}</div>

                    <button
                      className={`pillar-card-btn btn-${colorTheme}`}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNav(targetTab);
                      }}
                    >
                      <span>{buttonText}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ================= REALTIME LIVE TICKER MARQUEE ================= */}
      <div className="bw-ticker-strip">
        <div className="bw-ticker-track">
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">BTC/USDT</span>
            <span className="bw-ticker-price">$67,840.20</span>
            <span className="bw-ticker-change up">+2.84%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">ETH/USDT</span>
            <span className="bw-ticker-price">$3,524.50</span>
            <span className="bw-ticker-change up">+3.18%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">SOL/USDT</span>
            <span className="bw-ticker-price">$185.10</span>
            <span className="bw-ticker-change up">+5.42%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">XRP/USD</span>
            <span className="bw-ticker-price">$0.5420</span>
            <span className="bw-ticker-change up">+1.80%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">ADA/USD</span>
            <span className="bw-ticker-price">$0.3520</span>
            <span className="bw-ticker-change up">+2.15%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">DODGE/USDT</span>
            <span className="bw-ticker-price">$0.1420</span>
            <span className="bw-ticker-change up">+4.10%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">PEPE/USDT</span>
            <span className="bw-ticker-price">$0.0000098</span>
            <span className="bw-ticker-change up">+7.20%</span>
          </div>
          {/* Duplicate loop items for smooth marquee loop */}
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">BTC/USDT</span>
            <span className="bw-ticker-price">$67,840.20</span>
            <span className="bw-ticker-change up">+2.84%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">ETH/USDT</span>
            <span className="bw-ticker-price">$3,524.50</span>
            <span className="bw-ticker-change up">+3.18%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">XRP/USD</span>
            <span className="bw-ticker-price">$0.5420</span>
            <span className="bw-ticker-change up">+1.80%</span>
          </div>
        </div>
      </div>

      {/* ================= SHOWCASE 1: HIGH FREQUENCY ARCHITECTURE ================= */}
      <section className="bw-section">
        <div className="bw-section-header">
          <div className="bw-section-pill">
            <Zap size={13} />
            Institutional Grade Infrastructure
          </div>
          <h2 className="bw-section-title">Engineered for Sub-Millisecond Alpha</h2>
          <p className="bw-section-desc">
            Direct colocation, memory-mapped order routing, and automated risk circuit breakers
            built specifically for professional algorithmic traders.
          </p>
        </div>

        <div className="bw-features-grid">
          <div className="bw-feature-card">
            <div className="bw-feature-icon">
              <Zap size={22} />
            </div>
            <h3 className="bw-feature-name">Sub-Millisecond Execution</h3>
            <p className="bw-feature-text">
              Direct WebSocket 2.0 streaming pipeline and memory-mapped matching engine for sub-millisecond tick-to-trade speed.
            </p>
            <div className="bw-feature-stat">
              <span>LATENCY BENCHMARK</span>
              <span>0.84ms</span>
            </div>
          </div>

          <div className="bw-feature-card">
            <div className="bw-feature-icon">
              <Layers size={22} />
            </div>
            <h3 className="bw-feature-name">Dynamic Options Greeks</h3>
            <p className="bw-feature-text">
              Real-time portfolio Delta, Gamma, Theta, and Vega auto-hedging with synthetic futures collars.
            </p>
            <div className="bw-feature-stat">
              <span>GREEKS REFRESH</span>
              <span>100Hz Live</span>
            </div>
          </div>

          <div className="bw-feature-card">
            <div className="bw-feature-icon">
              <Shield size={22} />
            </div>
            <h3 className="bw-feature-name">Autonomous Risk Shield</h3>
            <p className="bw-feature-text">
              Automated max drawdown limits, emergency kill-switch, and multi-exchange slippage control.
            </p>
            <div className="bw-feature-stat">
              <span>SLIPPAGE GUARD</span>
              <span>&lt; 0.02%</span>
            </div>
          </div>

          <div className="bw-feature-card">
            <div className="bw-feature-icon">
              <Cpu size={22} />
            </div>
            <h3 className="bw-feature-name">Multi-Asset Unified Margin</h3>
            <p className="bw-feature-text">
              Cross-margin across Indian Index F&amp;O and global crypto synthetics with seamless INR bank settlement.
            </p>
            <div className="bw-feature-stat">
              <span>MARGIN UTILIZATION</span>
              <span>Up to 98%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SHOWCASE 2: QUANT STRATEGY LEADERBOARD ================= */}
      <section className="bw-section" style={{ paddingTop: 0 }}>
        <div className="bw-section-header">
          <div className="bw-section-pill">
            <BarChart2 size={13} />
            Live Strategy Marketplace
          </div>
          <h2 className="bw-section-title">Battle-Tested Quantitative Strategies</h2>
          <p className="bw-section-desc">
            Deploy pre-built institutional algorithms in one click or customize risk parameters to your trading profile.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            <button
              className={`bw-tab-btn ${strategyFilter === 'all' ? 'active' : ''}`}
              type="button"
              onClick={() => setStrategyFilter('all')}
            >
              All Strategies
            </button>
            <button
              className={`bw-tab-btn ${strategyFilter === 'delta-neutral' ? 'active' : ''}`}
              type="button"
              onClick={() => setStrategyFilter('delta-neutral')}
            >
              Delta Neutral
            </button>
            <button
              className={`bw-tab-btn ${strategyFilter === 'trend' ? 'active' : ''}`}
              type="button"
              onClick={() => setStrategyFilter('trend')}
            >
              Trend Following
            </button>
            <button
              className={`bw-tab-btn ${strategyFilter === 'hft' ? 'active' : ''}`}
              type="button"
              onClick={() => setStrategyFilter('hft')}
            >
              High-Frequency
            </button>
          </div>
        </div>

        <div className="bw-strategies-grid">
          {filteredStrategies.map((strat) => (
            <div key={strat.id} className="bw-strat-card">
              <div className="bw-strat-top">
                <div>
                  <div className="bw-strat-name">{strat.name}</div>
                  <div className="bw-strat-pair">{strat.pair}</div>
                </div>
                <span className="bw-strat-pill">{strat.tag}</span>
              </div>

              <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.5 }}>
                {strat.desc}
              </p>

              <div className="bw-strat-stats">
                <div className="bw-strat-stat-item">
                  <span className="bw-strat-stat-lbl">30D APY</span>
                  <span className="bw-strat-stat-val" style={{ color: '#ffffff' }}>{strat.apy}</span>
                </div>
                <div className="bw-strat-stat-item">
                  <span className="bw-strat-stat-lbl">Win Rate</span>
                  <span className="bw-strat-stat-val">{strat.winRate}</span>
                </div>
                <div className="bw-strat-stat-item">
                  <span className="bw-strat-stat-lbl">Sharpe</span>
                  <span className="bw-strat-stat-val">{strat.sharpe}</span>
                </div>
              </div>

              <button
                className="bw-strat-btn"
                type="button"
                onClick={() => handleNav('algo-trading')}
              >
                <Play size={14} />
                Deploy in Terminal
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ================= SHOWCASE 3: INTERACTIVE TERMINAL & CODE ================= */}
      <section className="bw-section" style={{ paddingTop: 0 }}>
        <div className="bw-terminal-split">
          {/* Left Side: Python Quant Code */}
          <div className="bw-terminal-card">
            <div className="bw-terminal-header">
              <div className="bw-window-dots">
                <span className="bw-wdot wdot-red" title="Close Script"></span>
                <span className="bw-wdot wdot-orange" title="Pause Execution"></span>
                <span className="bw-wdot wdot-green" title="Run Script"></span>
              </div>
              <div className="bw-term-title-wrap">
                <span className="bw-terminal-file">hammer_alpha_engine.py</span>
                <span className="bw-kbd">Python 3.11</span>
              </div>
              <div className="bw-card-traffic-actions">
                <button
                  className={`traffic-action-btn btn-green-action ${terminalStatus === 'running' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setTerminalStatus('running')}
                  title="Execute High-Frequency Algorithm"
                >
                  <Play size={10} /> RUN
                </button>
                <button
                  className={`traffic-action-btn btn-orange-action ${terminalStatus === 'paused' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setTerminalStatus('paused')}
                  title="Pause Order Flow"
                >
                  PAUSE
                </button>
                <button
                  className={`traffic-action-btn btn-red-action ${terminalStatus === 'stopped' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setTerminalStatus('stopped')}
                  title="Kill Switch / Emergency Stop"
                >
                  RESET
                </button>
              </div>
            </div>
            <pre className="bw-code-block">
              <code>
                <span className="bw-code-comment"># Institutional Delta-Neutral Arbitrage Model</span>{'\n'}
                <span className="bw-code-keyword">import</span> hammer_quant <span className="bw-code-keyword">as</span> hq{'\n'}
                <span className="bw-code-keyword">from</span> hammer.risk <span className="bw-code-keyword">import</span> ZeroSlipRouter{'\n\n'}
                <span className="bw-code-keyword">class</span> <span className="bw-code-func">VolArbitrageStrategy</span>(hq.Strategy):{'\n'}
                {'    '}<span className="bw-code-keyword">def</span> <span className="bw-code-func">__init__</span>(self, pair=<span className="bw-code-string">"BTC-PERP"</span>):{'\n'}
                {'        '}self.router = ZeroSlipRouter(max_slip_bps=<span className="bw-code-keyword">2</span>){'\n'}
                {'        '}self.delta_target = <span className="bw-code-keyword">0.00</span>{'\n\n'}
                {'    '}<span className="bw-code-keyword">async def</span> <span className="bw-code-func">on_tick</span>(self, tick):{'\n'}
                {'        '}iv = tick.implied_volatility{'\n'}
                {'        '}<span className="bw-code-keyword">if</span> iv &gt; tick.hv_30d * <span className="bw-code-keyword">1.25</span>:{'\n'}
                {'            '}order = <span className="bw-code-keyword">await</span> self.router.execute_straddle({'\n'}
                {'                '}side=<span className="bw-code-string">"SHORT_VEGA"</span>,{'\n'}
                {'                '}delta_hedge=<span className="bw-code-keyword">True</span>,{'\n'}
                {'                '}urgency=<span className="bw-code-string">"SUB_MS"</span>{'\n'}
                {'            '}){'\n'}
                {'            '}hq.logger.info(<span className="bw-code-string">f"Filled: &#123;order.id&#125; in 0.8ms"</span>)
              </code>
            </pre>
          </div>

          {/* Right Side: Realtime Execution Stream */}
          <div className="bw-terminal-card">
            <div className="bw-terminal-header">
              <div className="bw-window-dots">
                <span className="bw-wdot wdot-red" title="Disconnect Feed"></span>
                <span className="bw-wdot wdot-orange" title="Throttle Stream"></span>
                <span className="bw-wdot wdot-green" title="Full Speed 100Hz"></span>
              </div>
              <span>Live WebSocket Stream • 100Hz</span>
              <div className="bw-card-traffic-actions">
                <span className="stream-badge-pulse">
                  <span className="stream-dot-green"></span>
                  LIVE 100Hz
                </span>
              </div>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '2px solid #ffffff' }}>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>[EXEC 12:28:44.102]</span> BTC-28MAR-68000-C
                </div>
                <span style={{ color: '#ffffff' }}>FILLED @ $2,410.00 (0.7ms)</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '2px solid #a1a1aa' }}>
                <div>
                  <span style={{ color: '#a1a1aa', fontWeight: 700 }}>[HEDGE 12:28:44.103]</span> BTC-PERP Delta Rebalance
                </div>
                <span style={{ color: '#ffffff' }}>+0.42 BTC @ $67,842.10</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '2px solid #ffffff' }}>
                <div>
                  <span style={{ color: '#ffffff', fontWeight: 700 }}>[SIGNAL 12:28:44.890]</span> ETH Gamma Scalper
                </div>
                <span style={{ color: '#e4e4e7' }}>TARGET HIT: +$420.50 PnL</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '2px solid #52525b' }}>
                <div>
                  <span style={{ color: '#71717a', fontWeight: 700 }}>[RISK GUARD]</span> Circuit Breaker Status
                </div>
                <span style={{ color: '#ffffff' }}>NOMINAL (0.01% DD)</span>
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#71717a' }}>TOTAL 24H REALIZED GAIN</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>+$3,418.20 (28W / 4L)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= SHOWCASE 4: EXCHANGE CONNECTIVITY ================= */}
      <section className="bw-section" style={{ paddingTop: 0 }}>
        <div className="bw-section-header" style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#a1a1aa' }}>
            SEAMLESS CONNECTIVITY TO LEADING GLOBAL &amp; INDIAN BROKERS
          </h3>
        </div>
        <div className="bw-exchanges-strip">
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Delta Exchange</span>
          </div>
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Zerodha Kite</span>
          </div>
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Upstox Pro</span>
          </div>
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Binance Futures</span>
          </div>
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Bybit Algo</span>
          </div>
          <div className="bw-exchange-item">
            <CheckCircle2 size={16} color="#ffffff" />
            <span>Angel One SmartAPI</span>
          </div>
        </div>
      </section>

      {/* ================= BOTTOM CTA BANNER ================= */}
      <div className="bw-cta-banner">
        <h2 className="bw-cta-banner-title">Start Automating Your Trading Edge Today</h2>
        <p className="bw-cta-banner-desc">
          Join thousands of quantitative traders running automated strategies across
          crypto derivatives and Indian indices with zero latency bottlenecks.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button
            className="bw-cta-primary"
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setIsAuthModalOpen(true);
            }}
          >
            Create Free Account
            <ArrowRight size={18} />
          </button>
          <button
            className="bw-cta-secondary"
            type="button"
            onClick={() => handleNav('algo-trading')}
          >
            Launch Instant Demo
          </button>
        </div>
      </div>

      {/* ================= COMPREHENSIVE FOOTER ================= */}
      <footer className="bw-footer">
        <div className="bw-footer-inner">
          <div className="bw-footer-col">
            <div className="bw-brand-link" style={{ marginBottom: '14px' }}>
              <img src="/hammer_logo.png" alt="Hammer Logo" className="bw-header-logo-img" />
              <span className="bw-brand-tag-pill">QUANT TRADING PLATFORM</span>
            </div>
            <p style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.6, maxWidth: '280px' }}>
              Institutional grade algorithmic trading platform for crypto futures, options,
              and Indian market derivatives.
            </p>
          </div>

          <div className="bw-footer-col">
            <h4>Markets &amp; F&amp;O</h4>
            <ul>
              <li><a href="#futures" onClick={(e) => { e.preventDefault(); handleNav('futures'); }}>Bitcoin Futures</a></li>
              <li><a href="#options" onClick={(e) => { e.preventDefault(); handleNav('options'); }}>Ether Options</a></li>
              <li><a href="#perps" onClick={(e) => { e.preventDefault(); handleNav('futures'); }}>Delta Perpetuals</a></li>
              <li><a href="#spot" onClick={(e) => { e.preventDefault(); handleNav('spot'); }}>Spot Exchange</a></li>
            </ul>
          </div>

          <div className="bw-footer-col">
            <h4>Algorithmic Hub</h4>
            <ul>
              <li><a href="#algo" onClick={(e) => { e.preventDefault(); handleNav('algo-trading'); }}>Strategy Marketplace</a></li>
              <li><a href="#backtest" onClick={(e) => { e.preventDefault(); handleNav('algo-trading'); }}>Backtesting Lab</a></li>
              <li><a href="#sdk" onClick={(e) => { e.preventDefault(); handleNav('algo-trading'); }}>Python SDK Docs</a></li>
              <li><a href="#risk" onClick={(e) => { e.preventDefault(); handleNav('risk-monitor'); }}>Risk Parameters</a></li>
            </ul>
          </div>

          <div className="bw-footer-col">
            <h4>Resources</h4>
            <ul>
              <li><a href="#docs" onClick={(e) => { e.preventDefault(); handleNav('trade-history'); }}>API Documentation</a></li>
              <li><a href="#status" onClick={(e) => { e.preventDefault(); handleNav('risk-monitor'); }}>System Status</a></li>
              <li><a href="#fees" onClick={(e) => { e.preventDefault(); setActiveCenterpieceTab('fee'); }}>Fee Schedule (0 Fee)</a></li>
              <li><a href="#security" onClick={(e) => { e.preventDefault(); handleNav('risk-monitor'); }}>Security &amp; Vault</a></li>
            </ul>
          </div>

          <div className="bw-footer-col">
            <h4>Compliance</h4>
            <ul>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#risk">Risk Disclosure</a></li>
              <li><a href="#aml">AML &amp; KYC Standards</a></li>
            </ul>
          </div>
        </div>

        <div className="bw-footer-bottom">
          <span>&copy; {new Date().getFullYear()} Hammer AlgoTrading. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', display: 'inline-block' }}></span>
            Colocated Node: Mumbai (DC-2) • Latency 0.8ms • 99.99% Uptime
          </span>
        </div>
      </footer>

      {/* ================= MODAL: AUTH / SIGN UP / DEMO ACCESS ================= */}
      {isAuthModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsAuthModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#090a0d',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '16px',
              padding: '36px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
              }}
              onClick={() => setIsAuthModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src="/hammer_logo.png" alt="Hammer Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
              <span className="bw-brand-tag-pill">QUANT TRADING</span>
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              {authMode === 'signup' ? 'Create Your Quant Account' : 'Welcome Back'}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#a1a1aa', marginBottom: '24px', lineHeight: 1.5 }}>
              Access institutional futures, options, and automated algo execution.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="trader@hedgefund.com"
                  defaultValue="algo.trader@hammer.io"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                className="bw-btn-signup"
                type="button"
                style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                onClick={() => {
                  setIsAuthModalOpen(false);
                  handleNav('algo-trading');
                }}
              >
                {authMode === 'signup' ? 'Sign Up & Launch Terminal' : 'Log In to Terminal'}
              </button>

              <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '12px', color: '#71717a' }}>
                OR
              </div>

              <button
                className="bw-strat-btn"
                type="button"
                style={{ width: '100%' }}
                onClick={() => {
                  setIsAuthModalOpen(false);
                  handleNav('algo-trading');
                }}
              >
                <Zap size={14} />
                Instant 1-Click Sandbox Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MOBILE APP DOWNLOAD ================= */}
      {isMobileModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsMobileModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#090a0d',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '16px',
              padding: '36px',
              maxWidth: '420px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
              }}
              onClick={() => setIsMobileModalOpen(false)}
            >
              <X size={20} />
            </button>

            <Smartphone size={40} color="#ffffff" style={{ margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              Trade F&amp;O On the Go
            </h3>
            <p style={{ fontSize: '13.5px', color: '#a1a1aa', marginBottom: '24px' }}>
              Scan the QR code to install the Hammer Mobile Quant Terminal on iOS or Android.
            </p>

            <div
              style={{
                width: '170px',
                height: '170px',
                background: '#ffffff',
                borderRadius: '12px',
                margin: '0 auto 24px auto',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Sleek SVG QR Code Representation */}
              <svg width="146" height="146" viewBox="0 0 100 100" fill="#000000">
                <rect x="10" y="10" width="25" height="25" fill="#000" />
                <rect x="15" y="15" width="15" height="15" fill="#fff" />
                <rect x="19" y="19" width="7" height="7" fill="#000" />

                <rect x="65" y="10" width="25" height="25" fill="#000" />
                <rect x="70" y="15" width="15" height="15" fill="#fff" />
                <rect x="74" y="19" width="7" height="7" fill="#000" />

                <rect x="10" y="65" width="25" height="25" fill="#000" />
                <rect x="15" y="70" width="15" height="15" fill="#fff" />
                <rect x="19" y="74" width="7" height="7" fill="#000" />

                <rect x="42" y="15" width="8" height="8" fill="#000" />
                <rect x="52" y="25" width="6" height="6" fill="#000" />
                <rect x="42" y="38" width="18" height="6" fill="#000" />
                <rect x="45" y="55" width="10" height="10" fill="#000" />
                <rect x="65" y="45" width="12" height="6" fill="#000" />
                <rect x="78" y="58" width="12" height="12" fill="#000" />
                <rect x="40" y="75" width="15" height="15" fill="#000" />
                <rect x="60" y="75" width="8" height="15" fill="#000" />
              </svg>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="bw-app-badge"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsMobileModalOpen(false)}
              >
                App Store (iOS)
              </button>
              <button
                className="bw-app-badge"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setIsMobileModalOpen(false)}
              >
                Google Play (Android)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
