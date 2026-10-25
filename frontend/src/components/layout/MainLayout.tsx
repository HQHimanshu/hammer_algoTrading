import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import type { NavigationId } from '../../types/navigation';
import { ChartModal, type ChartAsset } from '../common/ChartModal';
import { SearchCommandModal } from '../common/SearchCommandModal';
import { AuthModal } from '../common/AuthModal';
import { MobileAppModal } from '../common/MobileAppModal';

interface MainLayoutProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId, pair?: string) => void;
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Global keyboard shortcut '/' or 'Ctrl+K' / 'Cmd+K' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleAuthSuccess = (email: string) => {
    setCurrentUser(email);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const navbarElement = (
    <Navbar
      activeTab={activeTab}
      onSelectTab={onSelectTab}
      onOpenSearch={() => setIsSearchOpen(true)}
      onOpenAuth={handleOpenAuth}
      onOpenMobile={() => setIsMobileOpen(true)}
      onToggleTheme={toggleTheme}
      theme={theme}
      currentUser={currentUser}
      onLogout={handleLogout}
    />
  );

  return (
    <div className={`app-container-horizontal ${theme === 'light' ? 'theme-light' : ''}`}>
      {navbarElement}

      <main className={activeTab === 'chart' ? 'content-body-fullscreen-chart' : 'content-body-horizontal'}>
        {children}
      </main>

      {/* Global Command Palette / Search Modal */}
      <SearchCommandModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(tab, pair) => onSelectTab(tab, pair)}
      />

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Global Mobile QR App Modal */}
      <MobileAppModal
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Global Chart Modal */}
      <ChartModal
        asset={globalChartAsset}
        isOpen={!!globalChartAsset}
        onClose={() => setGlobalChartAsset(null)}
      />
    </div>
  );
};
