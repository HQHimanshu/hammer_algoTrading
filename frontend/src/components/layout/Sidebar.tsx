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
  Activity,
  Terminal,
  BarChart2,
} from 'lucide-react';
import { MAIN_NAVIGATION } from '../../navigation/navConfig';
import type { NavigationId } from '../../types/navigation';

interface SidebarProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId) => void;
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
  BarChart2,
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  return (
    <aside className="sidebar">
      <div className="brand-header" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }} onClick={() => onSelectTab('home')}>
        <img src="/hammer_logo.png" alt="Hammer Logo" className="app-sidebar-logo-img" />
        <span className="brand-status">
          <span className="status-dot"></span> Live Terminal
        </span>
      </div>

      <div className="nav-section-title">MAIN NAVIGATION</div>

      <nav className="nav-list">
        {MAIN_NAVIGATION.map((item) => {
          const Icon = iconMap[item.iconName];
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              type="button"
            >
              <div className="nav-icon-container">
                <Icon size={20} className="nav-icon" />
              </div>
              <div className="nav-text-container">
                <span className="nav-label">{item.label}</span>
                <span className="nav-subtitle">{item.subtitle}</span>
              </div>
              {item.badge && (
                <span className={`nav-badge badge-${item.badgeColor || 'emerald'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-health">
          <div className="health-header">
            <Activity size={16} />
            <span>Engine Latency</span>
            <span className="health-ping">1.2ms</span>
          </div>
          <div className="health-bar">
            <div className="health-fill"></div>
          </div>
        </div>
      </div>
    </aside>
  );
};
