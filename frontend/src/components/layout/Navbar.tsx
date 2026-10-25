import React from 'react';
import {
  Home,
  TrendingUp,
  CandlestickChart,
  Layers,
  ArrowLeftRight,
  Bot,
  Wallet,
  ShieldCheck,
  History,
  Terminal,
  Activity,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { MAIN_NAVIGATION } from '../../navigation/navConfig';
import type { NavigationId } from '../../types/navigation';

interface NavbarProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId) => void;
  onOpenChart?: () => void;
}

const iconMap = {
  Home,
  TrendingUp,
  CandlestickChart,
  Layers,
  ArrowLeftRight,
  Bot,
  Wallet,
  ShieldCheck,
  History,
};

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenChart }) => {
  return (
    <header className="navbar-container">
      {/* Top Navbar Row */}
      <div className="navbar-top">
        {/* Brand / Logo */}
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('home')}>
          <img src="/hammer_logo.png" alt="Hammer Logo" className="app-navbar-logo-img" />
          <div className="engine-status">
            <span className="status-dot"></span>
            <span className="status-text">LIVE</span>
          </div>
        </div>

        {/* Navigation Items in Horizontal Bar */}
        <nav className="navbar-links" aria-label="Main Navigation">
          {MAIN_NAVIGATION.map((item) => {
            const Icon = iconMap[item.iconName];
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`navbar-tab ${isActive ? 'active' : ''}`}
                type="button"
                title={`${item.label} - ${item.subtitle}`}
              >
                <Icon size={16} className="navbar-tab-icon" />
                <span className="navbar-tab-label">{item.label}</span>
                {item.badge && (
                  <span className={`navbar-badge badge-${item.badgeColor || 'emerald'}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Right Utility Actions */}
        <div className="navbar-actions">
          {/* Live Market Ticker */}
          <div
            className="navbar-ticker clickable"
            onClick={onOpenChart}
            title="Click to view BTC/USDT live chart"
          >
            <span className="ticker-label">BTC/USDT</span>
            <span className="ticker-val">$67,420.50</span>
            <span className="ticker-delta positive">+2.84%</span>
          </div>

          {/* Engine Latency */}
          <div className="navbar-latency" title="System Engine Latency">
            <Activity size={13} className="latency-icon text-emerald" />
            <span className="latency-text">1.2ms</span>
          </div>

          {/* Search Shortcut */}
          <div className="navbar-search">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="navbar-search-input"
            />
          </div>

          {/* Notification Button */}
          <button className="icon-btn" title="Alerts & System Logs" type="button">
            <Bell size={16} />
            <span className="badge-dot"></span>
          </button>

          {/* Trader Profile */}
          <div className="user-profile-compact">
            <div className="user-avatar-small">H</div>
            <ChevronDown size={13} className="user-chevron" />
          </div>
        </div>
      </div>
    </header>
  );
};
