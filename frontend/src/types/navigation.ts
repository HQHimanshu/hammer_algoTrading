export type NavigationId =
  | 'home'
  | 'chart'
  | 'markets'
  | 'futures'
  | 'options'
  | 'spot'
  | 'algo-trading'
  | 'portfolio'
  | 'risk-monitor'
  | 'trade-history';

export interface NavItemConfig {
  id: NavigationId;
  label: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose' | 'indigo';
  iconName:
    | 'Home'
    | 'TrendingUp'
    | 'CandlestickChart'
    | 'Layers'
    | 'ArrowLeftRight'
    | 'Bot'
    | 'Wallet'
    | 'ShieldCheck'
    | 'History'
    | 'BarChart2';
}
