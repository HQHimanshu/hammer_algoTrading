import React from 'react';
import { Search, Bell, Shield, ChevronDown } from 'lucide-react';

interface HeaderProps {
  pageTitle: string;
  pageSubtitle: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, pageSubtitle }) => {
  return (
    <header className="app-header">
      <div className="header-breadcrumbs">
        <h1 className="header-title">{pageTitle}</h1>
        <span className="header-divider">/</span>
        <span className="header-subtitle">{pageSubtitle}</span>
      </div>

      <div className="header-actions">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search symbols, strategies, orders (Ctrl+K)..."
            className="search-input"
          />
        </div>

        <div className="market-ticker-pill">
          <span className="ticker-label">BTC/USDT</span>
          <span className="ticker-price">$67,420.50</span>
          <span className="ticker-change positive">+2.84%</span>
        </div>

        <button className="icon-btn" title="Risk Level: Low">
          <Shield size={18} className="shield-icon" />
        </button>

        <button className="icon-btn" title="Alerts & Notifications">
          <Bell size={18} />
          <span className="badge-dot"></span>
        </button>

        <div className="user-profile">
          <div className="user-avatar">H</div>
          <div className="user-details">
            <span className="user-name">Algorithmic Trader</span>
            <span className="user-role">FinGrad Execution</span>
          </div>
          <ChevronDown size={14} className="user-chevron" />
        </div>
      </div>
    </header>
  );
};
