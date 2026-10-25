import React from 'react';
import { TradingViewTerminal } from './TradingViewTerminal';

export interface ChartAsset {
  pair: string;
  price: string;
  change: string;
  high: string;
  low: string;
  volume: string;
  positive: boolean;
}

interface ChartModalProps {
  asset: ChartAsset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({ asset, isOpen, onClose }) => {
  if (!isOpen || !asset) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="chart-modal-dialog tv-full-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <TradingViewTerminal
          initialPair={asset.pair.replace('/', '')}
          onClose={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
