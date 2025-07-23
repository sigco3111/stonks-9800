
import React, { useMemo } from 'react';
import { AITrader, Stock } from '../types';
import TerminalWindow from './TerminalWindow';

interface AITradersStatusProps {
  aiTraders: AITrader[];
  stocks: Stock[];
  onAITraderSelect: (aiTrader: AITrader) => void;
}

const formatCash = (amount: number) => {
    if (Math.abs(amount) >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (Math.abs(amount) >= 1e3) return `$${(amount / 1e3).toFixed(1)}k`;
    return `$${amount.toFixed(2)}`;
};

const AITradersStatus: React.FC<AITradersStatusProps> = ({ aiTraders, stocks, onAITraderSelect }) => {
  const stocksMap = useMemo(() => new Map(stocks.map(s => [s.symbol, s.price])), [stocks]);

  const tradersWithAssets = useMemo(() => {
    return aiTraders.map(ai => {
      const stockValue = Object.entries(ai.portfolio).reduce((acc, [symbol, item]) => {
        const price = stocksMap.get(symbol) || 0;
        return acc + (item.quantity * price);
      }, 0);
      const totalAssets = ai.cash + stockValue;
      return { ...ai, stockValue, totalAssets };
    }).sort((a,b) => b.totalAssets - a.totalAssets);
  }, [aiTraders, stocksMap]);

  return (
    <TerminalWindow title="AI 트레이더 상태">
      <div className="h-[120px] overflow-y-auto text-sm">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-black/80">
            <tr>
              <th className="p-1">이름</th>
              <th className="p-1">전략</th>
              <th className="p-1 text-right">총 자산</th>
              <th className="p-1 text-right">현금</th>
              <th className="p-1 text-right">주식</th>
              <th className="p-1 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {tradersWithAssets.map(ai => {
                const status = ai.cooldown > 0 ? `쿨다운(${ai.cooldown})` : '대기';
                const statusColor = ai.cooldown > 0 ? 'text-yellow-400' : 'text-green-400';
              return (
                <tr 
                   key={ai.id} 
                   className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer"
                   onClick={() => onAITraderSelect(ai)}
                   aria-label={`View details for AI Trader ${ai.name}`}
                 >
                  <td className="p-1 font-bold text-orange-400">{ai.name}</td>
                  <td className="p-1 text-purple-400">{ai.strategy}</td>
                  <td className="p-1 text-right text-yellow-300 font-bold">{formatCash(ai.totalAssets)}</td>
                  <td className="p-1 text-right text-green-300">{formatCash(ai.cash)}</td>
                  <td className="p-1 text-right text-cyan-300">{formatCash(ai.stockValue)}</td>
                  <td className={`p-1 text-center ${statusColor}`}>{status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TerminalWindow>
  );
};

export default AITradersStatus;