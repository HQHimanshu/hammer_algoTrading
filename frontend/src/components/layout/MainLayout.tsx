import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import type { NavigationId } from '../../types/navigation';
import { ChartModal, type ChartAsset } from '../common/ChartModal';
import { SearchCommandModal } from '../common/SearchCommandModal';
import { AuthModal } from '../common/AuthModal';
import { MobileAppModal } from '../common/MobileAppModal';
import { TradeMindCopilotModal } from '../common/TradeMindCopilotModal';

interface MainLayoutProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId, pair?: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [globalChartAsset, setGlobalChartAsset] = useState<ChartAsset | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
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

      {/* Floating TradeMind AI Copilot Trigger */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="floating-copilot-btn"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '30px',
          backgroundColor: '#0a0a0c',
          color: '#ffffff',
          border: '1px solid #3f3f46',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 12px rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '13px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#ffffff';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#3f3f46';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        title="Open TradeMind AI Copilot"
      >
        <span
          style={{
            display: 'inline-flex',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }}
        />
        <span>TradeMind™ AI Copilot</span>
      </button>

      {/* TradeMind AI Copilot Modal */}
      <TradeMindCopilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};
