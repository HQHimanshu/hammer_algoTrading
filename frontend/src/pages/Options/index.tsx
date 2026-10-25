import React from 'react';

export const OptionsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header-block">
        <div>
          <h2 className="section-title">Options Contracts</h2>
          <p className="section-description">Multi-leg option chains, volatility surfaces, and Greek sensitivity matrix.</p>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-header">
          <h3>Option Chain (BTC-29MAR26)</h3>
          <span className="badge-tag">IV: 54.2%</span>
        </div>

        <div className="table-responsive">
          <table className="custom-table text-center">
            <thead>
              <tr>
                <th colSpan={4} className="border-right text-emerald">CALLS</th>
                <th>STRIKE</th>
                <th colSpan={4} className="border-left text-rose">PUTS</th>
              </tr>
              <tr>
                <th>Bid</th>
                <th>Ask</th>
                <th>IV</th>
                <th className="border-right">Delta</th>
                <th className="font-bold text-amber">Price</th>
                <th className="border-left">Delta</th>
                <th>IV</th>
                <th>Bid</th>
                <th>Ask</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>$3,840</td>
                <td>$3,890</td>
                <td>52.1%</td>
                <td className="border-right text-emerald">0.68</td>
                <td className="font-bold bg-dark-row">$66,000</td>
                <td className="border-left text-rose">-0.32</td>
                <td>51.9%</td>
                <td>$2,410</td>
                <td>$2,450</td>
              </tr>
              <tr>
                <td>$3,120</td>
                <td>$3,180</td>
                <td>53.4%</td>
                <td className="border-right text-emerald">0.52</td>
                <td className="font-bold bg-dark-row">$67,000 (ATM)</td>
                <td className="border-left text-rose">-0.48</td>
                <td>53.2%</td>
                <td>$2,820</td>
                <td>$2,860</td>
              </tr>
              <tr>
                <td>$2,540</td>
                <td>$2,590</td>
                <td>55.1%</td>
                <td className="border-right text-emerald">0.39</td>
                <td className="font-bold bg-dark-row">$68,000</td>
                <td className="border-left text-rose">-0.61</td>
                <td>54.8%</td>
                <td>$3,290</td>
                <td>$3,340</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
