import { useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import type { NavigationId } from './types/navigation';
import {
  HomePage,
  MarketsPage,
  FuturesPage,
  OptionsPage,
  SpotPage,
  AlgoTradingPage,
  PortfolioPage,
  RiskMonitorPage,
  TradeHistoryPage,
} from './pages';
import './index.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationId>('algo-trading');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'markets':
        return <MarketsPage />;
      case 'futures':
        return <FuturesPage />;
      case 'options':
        return <OptionsPage />;
      case 'spot':
        return <SpotPage />;
      case 'algo-trading':
        return <AlgoTradingPage />;
      case 'portfolio':
        return <PortfolioPage />;
      case 'risk-monitor':
        return <RiskMonitorPage />;
      case 'trade-history':
        return <TradeHistoryPage />;
      default:
        return <AlgoTradingPage />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} onSelectTab={setActiveTab}>
      {renderActivePage()}
    </MainLayout>
  );
}

export default App;
