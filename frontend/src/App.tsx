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
import { TradingViewTerminal } from './components/common/TradingViewTerminal';
import './index.css';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationId>('home');
  const [selectedPair, setSelectedPair] = useState('BTCUSD');

  const handleOpenPairChart = (pairSymbol: string = 'BTCUSD') => {
    let clean = pairSymbol.replace('/', '');
    if (clean.includes('NIFTY') || clean.includes('BANK')) clean = 'BTCUSD';
    setSelectedPair(clean);
    setActiveTab('chart');
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onNavigate={setActiveTab} />;
      case 'chart':
        return <TradingViewTerminal initialPair={selectedPair} isModal={false} />;
      case 'markets':
        return <MarketsPage onSelectChart={handleOpenPairChart} />;
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

  const handleNavigate = (tab: NavigationId, pair?: string) => {
    if (pair) {
      let clean = pair.replace('/', '');
      if (clean.includes('NIFTY') || clean.includes('BANK')) clean = 'BTCUSD';
      setSelectedPair(clean);
    }
    setActiveTab(tab);
  };

  return (
    <MainLayout activeTab={activeTab} onSelectTab={handleNavigate}>
      {renderActivePage()}
    </MainLayout>
  );
}

export default App;
