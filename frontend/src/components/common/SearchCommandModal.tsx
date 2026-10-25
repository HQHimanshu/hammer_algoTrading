import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Cpu, BarChart2, Shield, ArrowRight, CornerDownLeft } from 'lucide-react';
import type { NavigationId } from '../../types/navigation';

interface SearchCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationId, pair?: string) => void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Markets & Pairs' | 'Trading Desks' | 'Quant Algos' | 'Risk & Tools';
  tab: NavigationId;
  pair?: string;
  badge?: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Markets & Pairs
  { id: 'btc', title: 'BTC/USDT Perp', subtitle: 'Bitcoin Perpetual Futures • 100x • $67,420.50', category: 'Markets & Pairs', tab: 'chart', pair: 'BTCUSD', badge: '+2.84%' },
  { id: 'eth', title: 'ETH/USDT Perp', subtitle: 'Ethereum Perpetual Futures • 50x • $3,518.20', category: 'Markets & Pairs', tab: 'chart', pair: 'ETHUSD', badge: '+1.92%' },
  { id: 'sol', title: 'SOL/USDT Perp', subtitle: 'Solana High-Beta Perp • 20x • $181.65', category: 'Markets & Pairs', tab: 'chart', pair: 'SOLUSD', badge: '-1.45%' },
  { id: 'xrp', title: 'XRP/USD Perp', subtitle: 'Ripple Perpetual Contract • 50x • $0.5420', category: 'Markets & Pairs', tab: 'chart', pair: 'XRPUSD', badge: '+1.80%' },
  { id: 'ada', title: 'ADA/USD Perp', subtitle: 'Cardano Perpetual Contract • 20x • $0.3520', category: 'Markets & Pairs', tab: 'chart', pair: 'ADAUSD', badge: '+2.15%' },

  // Trading Desks
  { id: 'desk-chart', title: 'TradingView Terminal', subtitle: 'Full-page multi-timeframe candlestick chart & depth book', category: 'Trading Desks', tab: 'chart', badge: 'PRO' },
  { id: 'desk-markets', title: 'Market Overview & Heatmap', subtitle: 'Global tickers, 24h volume leaders, gainers & losers', category: 'Trading Desks', tab: 'markets' },
  { id: 'desk-futures', title: 'Perpetual Futures Engine', subtitle: 'Cross & isolated margin order entry with leverage sliders', category: 'Trading Desks', tab: 'futures' },
  { id: 'desk-options', title: 'Options Chain & Greeks Desk', subtitle: 'Delta, Gamma, Vega, Theta real-time implied volatility matrix', category: 'Trading Desks', tab: 'options' },

  // Quant Algos
  { id: 'algo-hub', title: 'AlgoHub Strategy Marketplace', subtitle: 'Explore and backtest automated delta-neutral and momentum bots', category: 'Quant Algos', tab: 'algo-trading', badge: 'HOT' },
  { id: 'algo-neutral', title: 'Delta-Neutral Straddle Harvester', subtitle: 'Non-directional options volatility decay engine (86.4% Win Rate)', category: 'Quant Algos', tab: 'algo-trading' },
  { id: 'algo-momentum', title: 'Momentum Trend Breakout v4', subtitle: 'Fast sub-second trend continuation scalper', category: 'Quant Algos', tab: 'algo-trading' },
  { id: 'algo-hft', title: 'Sub-ms Market Maker Grid', subtitle: 'Ultra-low latency liquidity capture with rebate optimization', category: 'Quant Algos', tab: 'algo-trading' },

  // Tools & Risk
  { id: 'tool-portfolio', title: 'Portfolio & Margin Balances', subtitle: 'Real-time equity, PnL analytics, and collateral health', category: 'Risk & Tools', tab: 'portfolio' },
  { id: 'tool-risk', title: 'Risk Guard & Circuit Breaker', subtitle: 'VaR tracking, max drawdown stops, automated risk firewall', category: 'Risk & Tools', tab: 'risk-monitor' },
  { id: 'tool-history', title: 'Trade Execution History', subtitle: 'Audit trail of filled limit orders, slippage, and fill rates', category: 'Risk & Tools', tab: 'trade-history' },
];

export const SearchCommandModal: React.FC<SearchCommandModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = SEARCH_ITEMS.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: SearchItem) => {
    onNavigate(item.tab, item.pair);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#0a0b0e',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            gap: '12px',
          }}
        >
          <Search size={20} color="#a1a1aa" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pairs, trading desks, algorithms, or tools... (Press Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '15px',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#71717a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={16} />
            </button>
          )}
          <span
            style={{
              fontSize: '10px',
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '2px 6px',
              borderRadius: '4px',
              color: '#a1a1aa',
              fontFamily: 'monospace',
            }}
          >
            ESC
          </span>
        </div>

        {/* Quick Results List */}
        <div
          style={{
            maxHeight: '420px',
            overflowY: 'auto',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#71717a',
                fontSize: '14px',
              }}
            >
              No results found for "{query}". Try searching for <strong>BTC</strong>, <strong>Futures</strong>, or <strong>AlgoHub</strong>.
            </div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  backgroundColor: idx === selectedIndex ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                  transition: 'background-color 0.1s ease',
                  border: '1px solid transparent',
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                    }}
                  >
                    {item.category === 'Markets & Pairs' && <TrendingUp size={16} />}
                    {item.category === 'Trading Desks' && <BarChart2 size={16} />}
                    {item.category === 'Quant Algos' && <Cpu size={16} />}
                    {item.category === 'Risk & Tools' && <Shield size={16} />}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
                        {item.title}
                      </span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: item.badge.includes('+')
                              ? 'rgba(16, 185, 129, 0.15)'
                              : item.badge.includes('-')
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(255, 255, 255, 0.12)',
                            color: item.badge.includes('+')
                              ? '#34d399'
                              : item.badge.includes('-')
                              ? '#f87171'
                              : '#ffffff',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#71717a',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}
                  >
                    {item.category}
                  </span>
                  <ArrowRight size={14} color="#71717a" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Tip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            fontSize: '11.5px',
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>Tip: Press <kbd style={{ fontFamily: 'monospace', color: '#e4e4e7' }}>/</kbd> anywhere to open search</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Press</span>
            <CornerDownLeft size={12} />
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
