import React, { useState } from 'react';
import { Navbar } from './Navbar';
import type { NavigationId } from '../../types/navigation';
import { MAIN_NAVIGATION } from '../../navigation/navConfig';
import { ChartModal, type ChartAsset } from '../common/ChartModal';

interface MainLayoutProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId) => void;
  children: React.ReactNode;
}

const defaultBtcAsset: ChartAsset = {
  pair: 'BTC/USDT',
  price: '$67,420.50',
  change: '+2.84%',
  high: '$68,120.00',
  low: '$65,340.00',
  volume: '$1.42B',
  positive: true,
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [globalChartAsset, setGlobalChartAsset] = useState<ChartAsset | null>(null);
  const currentNav = MAIN_NAVIGATION.find((n) => n.id === activeTab) || MAIN_NAVIGATION[0];

  return (
    <div className="app-container-horizontal">
      <Navbar
        activeTab={activeTab}
        onSelectTab={onSelectTab}
        onOpenChart={() => setGlobalChartAsset(defaultBtcAsset)}
      />
      
      {/* Sub-header Bar for Active Route Context */}
      <div className="sub-navbar">
        <div className="sub-navbar-content">
          <div className="breadcrumb-group">
            <span className="breadcrumb-root">Hammer Trading</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">{currentNav.label}</span>
            <span className="breadcrumb-desc">— {currentNav.subtitle}</span>
          </div>
          {currentNav.badge && (
            <span className="pill pill-green font-mono">{currentNav.badge} Engine Active</span>
          )}
        </div>
      </div>

      <main className="content-body-horizontal">{children}</main>

      {/* Global Chart Modal */}
      <ChartModal
        asset={globalChartAsset}
        isOpen={!!globalChartAsset}
        onClose={() => setGlobalChartAsset(null)}
      />
    </div>
  );
};
