import React from 'react';
import TerminalWindow from './TerminalWindow';
import { Bond } from '../types';
import { AVAILABLE_BONDS } from '../constants';

interface BondsManagerProps {
  onBondSelect: (bond: Bond) => void;
  currentBondPrices: Record<string, number>;
}

const BondsManager: React.FC<BondsManagerProps> = ({ onBondSelect, currentBondPrices }) => {

  return (
    <TerminalWindow title="채권 시장">
      <div className="h-[150px] overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-black/80">
            <tr>
              <th className="p-1">채권명</th>
              <th className="p-1 text-right">현재가</th>
              <th className="p-1 text-right">표면이율(연)</th>
              <th className="p-1 text-right">만기(게임시간)</th>
            </tr>
          </thead>
          <tbody>
            {AVAILABLE_BONDS.map(bond => {
                const currentPrice = currentBondPrices[bond.id] || bond.price;
                const priceDiff = currentPrice - bond.price;
                const priceColor = priceDiff > 0 ? 'text-green-400' : priceDiff < 0 ? 'text-red-500' : 'text-yellow-400';
              
                return (
                  <tr key={bond.id} className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer" onClick={() => onBondSelect(bond)}>
                    <td className="p-1 font-bold">{bond.name}</td>
                    <td className={`p-1 text-right font-bold ${priceColor}`}>${currentPrice.toFixed(2)}</td>
                    <td className="p-1 text-right text-yellow-400">{(bond.interestRate * 100).toFixed(2)}%</td>
                    <td className="p-1 text-right">{bond.maturityInSeconds}s</td>
                  </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </TerminalWindow>
  );
};
export default BondsManager;