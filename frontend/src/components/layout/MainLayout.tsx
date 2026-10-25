import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { NavigationId } from '../../types/navigation';
import { MAIN_NAVIGATION } from '../../navigation/navConfig';

interface MainLayoutProps {
  activeTab: NavigationId;
  onSelectTab: (tab: NavigationId) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const currentNav = MAIN_NAVIGATION.find((n) => n.id === activeTab) || MAIN_NAVIGATION[0];

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={onSelectTab} />
      <div className="main-content-wrapper">
        <Header pageTitle={currentNav.label} pageSubtitle={currentNav.subtitle} />
        <main className="content-body">{children}</main>
      </div>
    </div>
  );
};
