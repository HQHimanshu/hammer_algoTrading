import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Search,
  ChevronDown,
  Smartphone,
  Sun,
  Moon,
  Grid,
  BarChart2,
  TrendingUp,
  Cpu,
  Shield,
  Briefcase,
  History,
  LogOut,
  User,
  ExternalLink,
} from 'lucide-react';
import type { NavigationId } from '../../types/navigation';

interface NavbarProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId) => void;
  onOpenSearch?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onOpenMobile?: () => void;
  onToggleTheme?: () => void;
  theme?: 'dark' | 'light';
  currentUser?: string | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
  onOpenAuth,
  onOpenMobile,
  onToggleTheme,
  theme = 'dark',
  currentUser,
  onLogout,
}) => {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAlgoDropdownOpen, setIsAlgoDropdownOpen] = useState(false);
  const gridMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="bw-navbar">
      {/* Brand & Left Navigation Links */}
      <div className="bw-nav-left">
        <div
          className="bw-brand-link"
          onClick={() => onSelectTab('home')}
          title="Hammer Quant Trading"
        >
          <div className="bw-logo-icon">
            <Terminal size={18} strokeWidth={2.5} />
          </div>
          <div className="bw-brand-text">
            <span className="bw-brand-title">Hammer.</span>
            <span className="bw-brand-tag">QUANT | INDIA</span>
          </div>
        </div>

        <nav className="bw-nav-links" aria-label="Main Navigation">
          <button
            className={`bw-nav-item ${activeTab === 'markets' ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectTab('markets')}
          >
            Markets
          </button>
          <button
            className={`bw-nav-item ${activeTab === 'futures' ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectTab('futures')}
          >
            Futures
          </button>
          <button
            className={`bw-nav-item ${activeTab === 'options' ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectTab('options')}
          >
            Options
          </button>

          {/* AlgoHub with Dropdown Indicator */}
          <div style={{ position: 'relative' }}>
            <button
              className={`bw-nav-item ${activeTab === 'algo-trading' ? 'active' : ''}`}
              type="button"
              onClick={() => onSelectTab('algo-trading')}
            >
              <span className="bw-pill-new">NEW</span>
              AlgoHub
              <ChevronDown size={13} />
            </button>
          </div>

          <button
            className={`bw-nav-item ${activeTab === 'portfolio' ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectTab('portfolio')}
          >
            Portfolio
          </button>
          <button
            className={`bw-nav-item ${activeTab === 'risk-monitor' ? 'active' : ''}`}
            type="button"
            onClick={() => onSelectTab('risk-monitor')}
          >
            Risk Guard
          </button>
        </nav>
      </div>

      {/* Right Controls matching exact reference with circular buttons */}
      <div className="bw-nav-right">
        {/* Search Bar - opens global command palette */}
        <div
          className="bw-search-box"
          onClick={() => (onOpenSearch ? onOpenSearch() : onSelectTab('markets'))}
          title="Press / or click to search pairs, algorithms, and desks"
          role="button"
          tabIndex={0}
        >
          <Search size={14} />
          <span>Search</span>
          <span className="bw-kbd">/</span>
        </div>

        {/* Authentication State */}
        {currentUser ? (
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="bw-nav-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '20px',
                padding: '5px 12px',
              }}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#fff',
                }}
              >
                H
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {currentUser.includes('@') ? currentUser.split('@')[0] : currentUser}
              </span>
              <ChevronDown size={12} color="#a1a1aa" />
            </button>

            {isUserMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '200px',
                  backgroundColor: '#0c0d12',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
                  padding: '6px',
                  zIndex: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '11px', color: '#71717a' }}>Logged in as</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser}
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e4e4e7',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onSelectTab('portfolio');
                  }}
                >
                  <Briefcase size={14} color="#a1a1aa" /> Portfolio Balance
                </button>

                <button
                  type="button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              className="bw-btn-login"
              type="button"
              onClick={() => (onOpenAuth ? onOpenAuth('login') : undefined)}
              title="Log In to Quant Trading"
            >
              Log In
            </button>

            <button
              className="bw-btn-signup"
              type="button"
              onClick={() => (onOpenAuth ? onOpenAuth('signup') : undefined)}
              title="Create Account / Open Terminal"
            >
              Sign Up
            </button>
          </>
        )}

        {/* Circular Action Button 1: Mobile App Download */}
        <button
          className="bw-icon-action circular-part"
          type="button"
          onClick={() => (onOpenMobile ? onOpenMobile() : onSelectTab('chart'))}
          title="Mobile Trading App & QR Access"
          aria-label="Mobile Trading App"
        >
          <Smartphone size={16} />
        </button>

        {/* Circular Action Button 2: Theme Switcher */}
        <button
          className="bw-icon-action circular-part"
          type="button"
          onClick={() => (onToggleTheme ? onToggleTheme() : undefined)}
          title={theme === 'dark' ? 'Switch to Contrast Light Theme' : 'Switch to Obsidian Dark Theme'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Circular Action Button 3: Grid Launcher & Trading Desk Workspace */}
        <div ref={gridMenuRef} style={{ position: 'relative' }}>
          <button
            className={`bw-icon-action circular-part ${isGridMenuOpen ? 'active' : ''}`}
            type="button"
            onClick={() => setIsGridMenuOpen((prev) => !prev)}
            title="Trading Desks & Institutional Workspace"
            aria-label="Trading Desk Launcher"
            style={{
              backgroundColor: isGridMenuOpen ? 'rgba(255, 255, 255, 0.15)' : undefined,
              borderColor: isGridMenuOpen ? 'rgba(255, 255, 255, 0.4)' : undefined,
            }}
          >
            <Grid size={16} />
          </button>

          {/* Quick Launcher Dropdown */}
          {isGridMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '280px',
                backgroundColor: '#0c0d12',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                borderRadius: '14px',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.85), 0 0 20px rgba(255, 255, 255, 0.04)',
                padding: '10px',
                zIndex: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  color: '#71717a',
                  padding: '4px 8px 8px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Hammer Quant Desks</span>
                <span style={{ fontSize: '9px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 5px', borderRadius: '3px' }}>
                  v2.4
                </span>
              </div>

              {/* Launcher Items */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'chart' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                className="bw-launcher-item"
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onSelectTab('chart');
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>TradingView Terminal</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Full-Page Chart & Depth Book</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'markets' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                className="bw-launcher-item"
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onSelectTab('markets');
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Live Markets & Feed</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Crypto & Indian F&O Tickers</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'algo-trading' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                className="bw-launcher-item"
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onSelectTab('algo-trading');
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>AlgoHub Marketplace</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Delta-Neutral & HFT Bots</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'risk-monitor' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                className="bw-launcher-item"
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onSelectTab('risk-monitor');
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Risk Guard & VaR</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Circuit Breakers & Health</div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: activeTab === 'trade-history' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                }}
                className="bw-launcher-item"
                onClick={() => {
                  setIsGridMenuOpen(false);
                  onSelectTab('trade-history');
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <History size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Order History</div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>Execution Fills & Logs</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
