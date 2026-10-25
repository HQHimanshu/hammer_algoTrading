import type { NavItemConfig } from '../types/navigation';

export const MAIN_NAVIGATION: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home',
    subtitle: 'Trading overview',
    iconName: 'Home',
  },
  {
    id: 'markets',
    label: 'Markets',
    subtitle: 'Live market prices',
    iconName: 'TrendingUp',
  },
  {
    id: 'futures',
    label: 'Futures',
    subtitle: 'Derivatives trading',
    iconName: 'CandlestickChart',
  },
  {
    id: 'options',
    label: 'Options',
    subtitle: 'Options contracts',
    iconName: 'Layers',
  },
  {
    id: 'spot',
    label: 'Spot',
    subtitle: 'Spot market',
    iconName: 'ArrowLeftRight',
  },
  {
    id: 'algo-trading',
    label: 'Algo Trading',
    subtitle: 'Automated strategy engine',
    badge: 'Core',
    badgeColor: 'emerald',
    iconName: 'Bot',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    subtitle: 'Positions and PnL',
    iconName: 'Wallet',
  },
  {
    id: 'risk-monitor',
    label: 'Risk Monitor',
    subtitle: 'Capital protection',
    iconName: 'ShieldCheck',
  },
  {
    id: 'trade-history',
    label: 'Trade History',
    subtitle: 'Orders and execution logs',
    iconName: 'History',
  },
];
