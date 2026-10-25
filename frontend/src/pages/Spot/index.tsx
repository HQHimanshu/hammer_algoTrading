import React, { useState } from 'react';
import { ArrowDownUp } from 'lucide-react';

export const SpotPage: React.FC = () => {
  const [payAmount, setPayAmount] = useState('1000');
  const [receiveAmount, setReceiveAmount] = useState('0.01483');

  const handlePayAmountChange = (val: string) => {
    setPayAmount(val);
    const num = parseFloat(val) || 0;
    setReceiveAmount((num / 67420.5).toFixed(5));
  };

  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Spot Market</h2>
          <p className="section-description">Instant order routing, depth matching, and smart order routing (SOR).</p>
        </div>
      </div>

      <div className="cards-grid-two">
        <div className="panel-card">
          <div className="panel-header">
            <h3>Quick Swap & Spot Order</h3>
            <span className="badge-tag">Zero Fees</span>
          </div>

          <div className="swap-card">
            <div className="swap-input-group">
              <label>You Pay (USDT)</label>
              <div className="input-with-symbol">
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => handlePayAmountChange(e.target.value)}
                  className="swap-input"
                />
                <span className="token-tag">USDT</span>
              </div>
            </div>

            <div className="swap-divider">
              <button className="swap-btn-icon">
                <ArrowDownUp size={16} />
              </button>
            </div>

            <div className="swap-input-group">
              <label>You Receive (BTC)</label>
              <div className="input-with-symbol">
                <input
                  type="text"
                  value={receiveAmount}
                  readOnly
                  className="swap-input"
                />
                <span className="token-tag">BTC</span>
              </div>
            </div>

            <button className="btn-action btn-buy mt-4">Execute Spot Buy</button>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header">
            <h3>Live Order Book (Spot BTC/USDT)</h3>
            <span className="badge-tag text-emerald">Spread: 0.10</span>
          </div>

          <div className="orderbook-preview">
            <div className="ob-side asks">
              <div className="ob-row"><span className="text-rose">67,422.50</span><span>1.42 BTC</span></div>
              <div className="ob-row"><span className="text-rose">67,421.80</span><span>0.85 BTC</span></div>
              <div className="ob-row"><span className="text-rose">67,421.00</span><span>2.10 BTC</span></div>
            </div>
            <div className="ob-mid font-bold text-center py-2">$67,420.50 (Last Price)</div>
            <div className="ob-side bids">
              <div className="ob-row"><span className="text-emerald">67,420.00</span><span>3.40 BTC</span></div>
              <div className="ob-row"><span className="text-emerald">67,419.50</span><span>1.12 BTC</span></div>
              <div className="ob-row"><span className="text-emerald">67,418.00</span><span>4.95 BTC</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
