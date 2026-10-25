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

            {/* 3D Centerpiece Visual Stage: White + Black + Green Dynamic Scene */}
            <div className="bw-3d-stage">
              {/* Floating Live Signal Chip */}
              <div className="wbg-floating-stat-chip">
                <span className="wbg-stat-dot"></span>
                <span>Sub-ms Quant Stream Active</span>
              </div>

              <svg className="wbg-scene-svg" viewBox="0 0 540 380" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  {/* Radial Green Ambient Aura */}
                  <radialGradient id="greenAtmosphere" cx="60%" cy="45%" r="65%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#059669" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#05070a" stopOpacity="0" />
                  </radialGradient>

                  {/* 3D Green Cylinder Beam Shading */}
                  <linearGradient id="greenBeamCylinder" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#064e3b" />
                    <stop offset="25%" stopColor="#047857" />
                    <stop offset="55%" stopColor="#10b981" />
                    <stop offset="85%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#a7f3d0" />
                  </linearGradient>

                  {/* Green Beam Specular Ridge */}
                  <linearGradient id="beamRidgeLight" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.9" />
                    <stop offset="60%" stopColor="#34d399" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>

                  {/* Mini Avatar Green Trail */}
                  <linearGradient id="miniBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#065f46" />
                    <stop offset="40%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#6ee7b7" />
                  </linearGradient>

                  {/* Bitcoin Outer Rim Gradient */}
                  <linearGradient id="btcGoldCountric" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="25%" stopColor="#eab308" />
                    <stop offset="55%" stopColor="#ca8a04" />
                    <stop offset="85%" stopColor="#a16207" />
                    <stop offset="100%" stopColor="#713f12" />
                  </linearGradient>

                  {/* Bitcoin 3D Thickness Edge */}
                  <linearGradient id="btcEdge3d" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#a16207" />
                    <stop offset="40%" stopColor="#713f12" />
                    <stop offset="70%" stopColor="#451a03" />
                    <stop offset="100%" stopColor="#1c1917" />
                  </linearGradient>

                  {/* Bitcoin Basin Gradient */}
                  <radialGradient id="btcBasinGrad" cx="45%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="40%" stopColor="#eab308" />
                    <stop offset="80%" stopColor="#b45309" />
                    <stop offset="100%" stopColor="#78350f" />
                  </radialGradient>

                  {/* Obsidian Ethereum Rim */}
                  <linearGradient id="ethObsidianRim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="30%" stopColor="#334155" />
                    <stop offset="70%" stopColor="#1e293b" />
                    <stop offset="100%" stopColor="#0f172a" />
                  </linearGradient>

                  {/* Obsidian Ethereum Face */}
                  <radialGradient id="ethObsidianFace" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                  </radialGradient>

                  {/* ETH Crystal Facet Gradients */}
                  <linearGradient id="ethFacetTop" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <linearGradient id="ethFacetLeft" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                  <linearGradient id="ethFacetRight" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                  <linearGradient id="ethFacetBottom" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  {/* Volumetric Beam Blur & Shadows */}
                  <filter id="beamGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="16" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="coinHeavyShadow" x="-30%" y="-30%" width="170%" height="170%">
                    <feDropShadow dx="-10" dy="24" stdDeviation="18" floodColor="#000000" floodOpacity="0.9" />
                  </filter>
                </defs>

                {/* Ambient Green Atmospheric Radiance */}
                <rect x="0" y="0" width="540" height="380" fill="url(#greenAtmosphere)" />

                {/* Background Floating Token 1: USDC (Blurred) */}
                <g className="wbg-usdc-coin" opacity="0.65" style={{ filter: 'blur(1.6px)' }}>
                  <ellipse cx="230" cy="52" rx="22" ry="19" transform="rotate(-15 230 52)" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
                  <ellipse cx="230" cy="52" rx="17" ry="14" transform="rotate(-15 230 52)" fill="#2563eb" />
                  <text x="230" y="58" fill="#ffffff" fontSize="17" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">$</text>
                </g>

                {/* Background Floating Token 2: Solana (Blurred) */}
                <g className="wbg-sol-coin" opacity="0.55" style={{ filter: 'blur(2px)' }}>
                  <circle cx="485" cy="85" r="18" fill="#18181b" stroke="#34d399" strokeWidth="1.2" />
                  <rect x="475" y="77" width="20" height="3" rx="1.5" fill="#34d399" transform="rotate(-12 485 78)" />
                  <rect x="476" y="83" width="20" height="3" rx="1.5" fill="#a855f7" transform="rotate(-12 485 84)" />
                  <rect x="474" y="89" width="20" height="3" rx="1.5" fill="#10b981" transform="rotate(-12 485 90)" />
                </g>

                {/* Background Trader Avatar Shooting on Mini Green Beam (From Reference Image) */}
                <g className="wbg-avatar-group">
                  {/* Mini beam trail shooting upwards-right */}
                  <polygon points="120,135 125,122 250,55 245,68" fill="url(#miniBeamGrad)" opacity="0.85" />
                  <line x1="125" y1="122" x2="250" y2="55" stroke="#86efac" strokeWidth="1.5" opacity="0.9" />

                  {/* Avatar Circle Badge */}
                  <circle cx="122" cy="128" r="14" fill="#090d14" stroke="#ffffff" strokeWidth="2" />
                  {/* Avatar Silhouette */}
                  <circle cx="122" cy="125" r="4.5" fill="#10b981" />
                  <path d="M114 137C114 133 117.5 131 122 131C126.5 131 130 133 130 137" fill="#34d399" />
                </g>

                {/* THE GIANT GREEN BEAM CYLINDER (Shooting from behind Bitcoin towards top-right) */}
                <g className="wbg-floating-group">
                  {/* Deep Green Ambient Emission under beam */}
                  <path
                    d="M 285 110 L 545 15 L 565 75 L 435 295 Z"
                    fill="#10b981"
                    opacity="0.3"
                    filter="url(#beamGlow)"
                  />

                  {/* Solid 3D Cylinder Body */}
                  <path
                    d="M 286 112 L 540 22 L 565 65 L 442 278 Z"
                    fill="url(#greenBeamCylinder)"
                  />

                  {/* Specular White-Green Ridge along top beam edge */}
                  <line
                    x1="286"
                    y1="112"
                    x2="540"
                    y2="22"
                    stroke="url(#beamRidgeLight)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Ambient cylinder shadow boundary */}
                  <path
                    d="M 442 278 L 565 65 L 560 85 L 430 300 Z"
                    fill="#022c22"
                    opacity="0.85"
                  />
                </g>

                {/* GIANT 3D BITCOIN COIN (Matching Reference Image) */}
                <g className="wbg-floating-group" filter="url(#coinHeavyShadow)">
                  {/* 3D Extruded Coin Edge (Thickness) */}
                  <path
                    d="M 252 232 C 238 185 272 132 328 114 C 384 96 441 120 455 167 L 444 185 C 430 138 373 114 317 132 C 261 150 227 203 241 250 Z"
                    fill="url(#btcEdge3d)"
                  />
                  {/* Lower Coin Edge Rim highlight */}
                  <ellipse
                    cx="342"
                    cy="204"
                    rx="106"
                    ry="92"
                    transform="rotate(-18 342 204)"
                    fill="#451a03"
                  />

                  {/* Outer Beveled Metallic Rim */}
                  <ellipse
                    cx="348"
                    cy="194"
                    rx="106"
                    ry="92"
                    transform="rotate(-18 348 194)"
                    fill="url(#btcGoldCountric)"
                    stroke="#fef08a"
                    strokeWidth="2.5"
                  />

                  {/* Concentric Inner Bevel Ring (Ridge from reference) */}
                  <ellipse
                    cx="348"
                    cy="194"
                    rx="97"
                    ry="84"
                    transform="rotate(-18 348 194)"
                    fill="none"
                    stroke="#78350f"
                    strokeWidth="2"
                  />
                  <ellipse
                    cx="348"
                    cy="194"
                    rx="93"
                    ry="80"
                    transform="rotate(-18 348 194)"
                    fill="url(#btcBasinGrad)"
                    stroke="#ca8a04"
                    strokeWidth="1.5"
                  />

                  {/* Specular Glare Arc on Upper Coin Rim */}
                  <path
                    d="M 270 155 C 300 120 365 110 415 125"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  {/* 3D Embossed White Bitcoin Symbol (₿) */}
                  <g transform="translate(348 194) rotate(-18) translate(-348 -194)">
                    {/* Dark Depth Shadow under ₿ */}
                    <path
                      d="M336 142 V153 H342 V142 H348 V153 H352 C362 153 369 158 369 166 C369 171 366 175 361 178 C368 181 372 187 372 195 C372 206 364 213 352 213 H348 V224 H342 V213 H336 V224 H330 V213 H318 V142 H330 V153 H336 V142 Z M332 163 V177 H350 C356 177 360 174 360 170 C360 166 356 163 350 163 Z M332 187 V203 H352 C358 203 363 199 363 195 C363 191 358 187 352 187 Z"
                      fill="#451a03"
                      transform="translate(4 6)"
                    />
                    {/* 3D Extruded Wall under White ₿ */}
                    <path
                      d="M336 142 V153 H342 V142 H348 V153 H352 C362 153 369 158 369 166 C369 171 366 175 361 178 C368 181 372 187 372 195 C372 206 364 213 352 213 H348 V224 H342 V213 H336 V224 H330 V213 H318 V142 H330 V153 H336 V142 Z M332 163 V177 H350 C356 177 360 174 360 170 C360 166 356 163 350 163 Z M332 187 V203 H352 C358 203 363 199 363 195 C363 191 358 187 352 187 Z"
                      fill="#d4d4d8"
                      transform="translate(1.5 2.5)"
                    />
                    {/* Front Pure White Embossed ₿ Face */}
                    <path
                      d="M336 142 V153 H342 V142 H348 V153 H352 C362 153 369 158 369 166 C369 171 366 175 361 178 C368 181 372 187 372 195 C372 206 364 213 352 213 H348 V224 H342 V213 H336 V224 H330 V213 H318 V142 H330 V153 H336 V142 Z M332 163 V177 H350 C356 177 360 174 360 170 C360 166 356 163 350 163 Z M332 187 V203 H352 C358 203 363 199 363 195 C363 191 358 187 352 187 Z"
                      fill="#ffffff"
                      stroke="#f8fafc"
                      strokeWidth="0.5"
                    />
                  </g>
                </g>

                {/* FOREGROUND OBSIDIAN BLACK ETHEREUM COIN (Matching Reference Image) */}
                <g className="wbg-eth-group" filter="url(#coinHeavyShadow)">
                  {/* Heavy Bottom Thickness */}
                  <ellipse
                    cx="115"
                    cy="295"
                    rx="88"
                    ry="76"
                    transform="rotate(-16 115 295)"
                    fill="#020617"
                  />

                  {/* Outer Beveled Graphite Rim */}
                  <ellipse
                    cx="118"
                    cy="288"
                    rx="88"
                    ry="76"
                    transform="rotate(-16 118 288)"
                    fill="url(#ethObsidianRim)"
                    stroke="#64748b"
                    strokeWidth="2"
                  />

                  {/* Concentric Step Ring */}
                  <ellipse
                    cx="118"
                    cy="288"
                    rx="80"
                    ry="69"
                    transform="rotate(-16 118 288)"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />

                  {/* Inner Obsidian Matte Basin */}
                  <ellipse
                    cx="118"
                    cy="288"
                    rx="76"
                    ry="65"
                    transform="rotate(-16 118 288)"
                    fill="url(#ethObsidianFace)"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />

                  {/* Metallic Platinum Specular Rim Arc */}
                  <path
                    d="M 55 260 C 80 230 135 225 175 240"
                    stroke="#e2e8f0"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.75"
                  />

                  {/* 3D Faceted Diamond Ethereum Crystal (Ξ) */}
                  <g transform="translate(118 288) rotate(-16) translate(-118 -288)">
                    {/* Shadow underneath crystal */}
                    <path
                      d="M118 244 L88 288 L118 304 L148 288 Z M118 309 L88 293 L118 332 L148 293 Z"
                      fill="#020617"
                      transform="translate(3 5)"
                      opacity="0.9"
                    />

                    {/* Top Diamond Facet: Crisp Pure White */}
                    <polygon points="118,244 88,288 118,272" fill="url(#ethFacetTop)" />
                    {/* Top Right Facet: Bright Silver */}
                    <polygon points="118,244 118,272 148,288" fill="url(#ethFacetLeft)" />
                    {/* Mid Left Facet */}
                    <polygon points="88,288 118,272 118,304" fill="url(#ethFacetRight)" />
                    {/* Mid Right Facet */}
                    <polygon points="118,272 148,288 118,304" fill="url(#ethFacetBottom)" />

                    {/* Bottom Lower Crystal Pyramid */}
                    <polygon points="118,309 88,293 118,332" fill="url(#ethFacetLeft)" />
                    <polygon points="118,309 148,293 118,332" fill="url(#ethFacetBottom)" />
                  </g>
                </g>
              </svg>
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
