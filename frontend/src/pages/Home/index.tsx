import React, { useState } from 'react';
import {
  TrendingUp,
  Zap,
  Shield,
  Bot,
  Terminal,
  Search,
  Smartphone,
  Sun,
  Grid,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  Code,
  Lock,
  Cpu,
  BarChart2,
  CheckCircle2,
  X,
  Play,
  Share2,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      pair: 'NIFTY & BTC F&O',
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
      {/* ================= TOP NAVIGATION (Delta Exchange Style) ================= */}
      <header className="bw-navbar">
        <div className="bw-nav-left">
          <div className="bw-brand-link" onClick={() => handleNav('home')}>
            <div className="bw-logo-icon">
              <Terminal size={18} strokeWidth={2.5} />
            </div>
            <div className="bw-brand-text">
              <span className="bw-brand-title">Hammer.</span>
              <span className="bw-brand-tag">QUANT | INDIA</span>
            </div>
          </div>

          <nav className="bw-nav-links">
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('markets')}
            >
              Markets
            </button>
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('futures')}
            >
              Futures
            </button>
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('options')}
            >
              Options
            </button>
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('algo-trading')}
            >
              <span className="bw-pill-new">NEW</span>
              AlgoHub
              <ChevronDown size={13} />
            </button>
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('portfolio')}
            >
              Portfolio
            </button>
            <button
              className="bw-nav-item"
              type="button"
              onClick={() => handleNav('risk-monitor')}
            >
              Risk Guard
            </button>
          </nav>
        </div>

        <div className="bw-nav-right">
          <div
            className="bw-search-box"
            onClick={() => handleNav('algo-trading')}
            title="Search algorithms, pairs, instruments"
          >
            <Search size={14} />
            <span>Search</span>
            <span className="bw-kbd">/</span>
          </div>

          <button
            className="bw-btn-login"
            type="button"
            onClick={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
          >
            Log In
          </button>

          <button
            className="bw-btn-signup"
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setIsAuthModalOpen(true);
            }}
          >
            Sign Up
          </button>

          <button
            className="bw-icon-action"
            type="button"
            onClick={() => setIsMobileModalOpen(true)}
            title="Mobile Trading App"
          >
            <Smartphone size={16} />
          </button>

          <button
            className="bw-icon-action"
            type="button"
            title="Monochrome High-Contrast Theme Active"
          >
            <Sun size={16} />
          </button>

          <button
            className="bw-icon-action"
            type="button"
            onClick={() => handleNav('algo-trading')}
            title="Launch Trading Desk"
          >
            <Grid size={16} />
          </button>
        </div>
      </header>

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
                Sign Up
                <ArrowRight size={18} />
              </button>

              <button
                className="bw-cta-secondary"
                type="button"
                onClick={() => handleNav('algo-trading')}
              >
                <Bot size={18} />
                Explore Algo Terminal
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

            {/* 3D Centerpiece Visual Stage */}
            <div className="bw-3d-stage">
              {/* Floating 3D Chrome Coins */}
              <div className="bw-floating-coin bw-coin-btc" title="Bitcoin Futures">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="11" fill="url(#btcGlow)" stroke="#ffffff" strokeWidth="1.2" />
                  <path
                    d="M13.5 8.5C14.5 8.5 15.2 7.8 15.2 6.8C15.2 5.8 14.5 5.2 13.5 5.2H10V8.5H13.5ZM13.8 12.2C15 12.2 15.8 11.4 15.8 10.2C15.8 9.1 14.9 8.3 13.8 8.3H10V12.2H13.8ZM12.2 3.5V5.2H13.5V3.5H12.2ZM10.5 3.5V5.2H11.8V3.5H10.5ZM12.2 13.8V15.5H13.5V13.8H12.2ZM10.5 13.8V15.5H11.8V13.8H10.5ZM8.5 5.2V13.8H14.2C15.8 13.8 17.2 12.6 17.2 11C17.2 9.8 16.4 8.8 15.2 8.4C16.1 8 16.6 7.1 16.6 6.1C16.6 4.7 15.4 3.7 13.8 3.7H8.5V5.2Z"
                    fill="#0a0a0c"
                  />
                  <defs>
                    <linearGradient id="btcGlow" x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="#d4d4d8" />
                      <stop offset="100%" stopColor="#71717a" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="bw-floating-coin bw-coin-eth" title="Ether Options">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L4.5 12.5L12 16L19.5 12.5L12 2Z" fill="#ffffff" />
                  <path d="M12 16L4.5 12.5L12 22L19.5 12.5L12 16Z" fill="#a1a1aa" opacity="0.85" />
                  <path d="M12 2L12 16L19.5 12.5L12 2Z" fill="#e4e4e7" />
                </svg>
              </div>

              <div className="bw-floating-coin bw-coin-sol" title="Solana High Speed">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="12" fill="#18181b" />
                  <path d="M6 7H18L16 9H4L6 7Z" fill="#ffffff" />
                  <path d="M8 11H20L18 13H6L8 11Z" fill="#d4d4d8" />
                  <path d="M6 15H18L16 17H4L6 15Z" fill="#a1a1aa" />
                </svg>
              </div>

              {/* 3D Chrome Zero / Metrics Centerpiece Cluster */}
              <div className="bw-3d-zero-cluster">
                <div className="bw-3d-zero-wrap">
                  <svg className="bw-3d-zero-svg" viewBox="0 0 170 220" fill="none">
                    <defs>
                      <linearGradient id="chrome3d" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="25%" stopColor="#f4f4f5" />
                        <stop offset="50%" stopColor="#a1a1aa" />
                        <stop offset="75%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#3f3f46" />
                      </linearGradient>
                      <linearGradient id="bevelRim" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#71717a" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0.9" />
                      </linearGradient>
                      <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="12" dy="18" stdDeviation="16" floodColor="#000000" floodOpacity="0.8" />
                      </filter>
                    </defs>

                    {/* 3D Extrusion Back Layer */}
                    <path
                      d="M85 30C122 30 148 58 148 110C148 162 122 190 85 190C48 190 22 162 22 110C22 58 48 30 85 30ZM85 64C66 64 54 82 54 110C54 138 66 156 85 156C104 156 116 138 116 110C116 82 104 64 85 64Z"
                      fill="#18181b"
                      transform="translate(8, 12)"
                    />

                    {/* 3D Extrusion Bevel Mid Layer */}
                    <path
                      d="M85 30C122 30 148 58 148 110C148 162 122 190 85 190C48 190 22 162 22 110C22 58 48 30 85 30ZM85 64C66 64 54 82 54 110C54 138 66 156 85 156C104 156 116 138 116 110C116 82 104 64 85 64Z"
                      fill="url(#bevelRim)"
                      transform="translate(4, 6)"
                    />

                    {/* Front Chrome Face */}
                    <path
                      d="M85 24C122 24 148 52 148 104C148 156 122 184 85 184C48 184 22 156 22 104C22 52 48 24 85 24ZM85 58C66 58 54 76 54 104C54 132 66 150 85 150C104 150 116 132 116 104C116 76 104 58 85 58Z"
                      fill="url(#chrome3d)"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />

                    {/* Specular Gleam Highlight */}
                    <path
                      d="M48 54C60 40 78 32 94 32C84 32 66 40 54 54C42 68 38 88 38 106C38 88 42 68 48 54Z"
                      fill="#ffffff"
                      opacity="0.6"
                    />
                  </svg>
                </div>

                <div className="bw-3d-text-wrap">
                  <span className="bw-3d-text-fee">{currentCenterpiece.textLabel}</span>
                  <span className="bw-3d-text-sub">{currentCenterpiece.subText}</span>
                </div>
              </div>
            </div>

            {/* 3 Pillars Below Centerpiece (Matching Reference Orange Boxes, but in Luxury B&W) */}
            <div className="bw-three-pillars">
              {currentCenterpiece.pillars.map((pillar, idx) => (
                <div
                  key={idx}
                  className={`bw-pillar-card ${selectedPillar === idx ? 'active' : ''}`}
                  onClick={() => setSelectedPillar(idx)}
                >
                  <div className="bw-pillar-title">{pillar.title}</div>
                  <div className="bw-pillar-val">{pillar.val}</div>
                  <div className="bw-pillar-sub">{pillar.sub}</div>
                </div>
              ))}
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
            <span className="bw-ticker-symbol">NIFTY 50</span>
            <span className="bw-ticker-price">24,852.10</span>
            <span className="bw-ticker-change up">+0.68%</span>
          </div>
          <div className="bw-ticker-item">
            <span className="bw-ticker-symbol">BANKNIFTY</span>
            <span className="bw-ticker-price">51,320.00</span>
            <span className="bw-ticker-change up">+0.94%</span>
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
            <span className="bw-ticker-symbol">NIFTY 50</span>
            <span className="bw-ticker-price">24,852.10</span>
            <span className="bw-ticker-change up">+0.68%</span>
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
                <span className="bw-wdot"></span>
                <span className="bw-wdot"></span>
                <span className="bw-wdot"></span>
              </div>
              <span>hammer_alpha_engine.py</span>
              <span className="bw-kbd">Python 3.11</span>
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
                <span className="bw-wdot"></span>
                <span className="bw-wdot"></span>
                <span className="bw-wdot"></span>
              </div>
              <span>Live WebSocket Stream • 100Hz</span>
              <span style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }}></span>
                ONLINE
              </span>
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
              <div className="bw-logo-icon">
                <Terminal size={18} strokeWidth={2.5} />
              </div>
              <div className="bw-brand-text">
                <span className="bw-brand-title">Hammer.</span>
                <span className="bw-brand-tag">QUANT TRADING PLATFORM</span>
              </div>
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
              <li><a href="#nifty" onClick={(e) => { e.preventDefault(); handleNav('markets'); }}>Nifty 50 Straddles</a></li>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div className="bw-logo-icon" style={{ width: '28px', height: '28px' }}>
                <Terminal size={16} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#ffffff' }}>Hammer Quant</span>
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
