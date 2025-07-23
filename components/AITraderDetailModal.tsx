
import React, { useMemo } from 'react';
import { AITrader, Stock } from '../types';
import TerminalWindow from './TerminalWindow';

interface AITraderDetailModalProps {
  trader: AITrader;
  stocks: Stock[];
  onClose: () => void;
}

const formatCash = (amount: number) => {
    if (Math.abs(amount) >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (Math.abs(amount) >= 1e3) return `$${(amount / 1e3).toFixed(1)}k`;
    return `$${amount.toFixed(2)}`;
};

const AITraderDetailModal: React.FC<AITraderDetailModalProps> = ({ trader, stocks, onClose }) => {
  const stocksMap = useMemo(() => new Map(stocks.map(s => [s.symbol, s.price])), [stocks]);

  const portfolioDetails = useMemo(() => {
    return Object.entries(trader.portfolio)
      .map(([symbol, item]) => {
        if (item.quantity === 0) return null;
        const currentPrice = stocksMap.get(symbol) || 0;
        const currentValue = item.quantity * currentPrice;
        const profitPercent = item.averagePrice > 0 ? ((currentPrice - item.averagePrice) / item.averagePrice) * 100 : 0;
        return {
          symbol,
          ...item,
          currentPrice,
          currentValue,
          profitPercent,
        };
      })
      .filter(item => item !== null)
      .sort((a, b) => b!.currentValue - a!.currentValue);
  }, [trader.portfolio, stocksMap]);

  const stockValue = portfolioDetails.reduce((acc, item) => acc + item!.currentValue, 0);
  const totalAssets = trader.cash + stockValue;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 crt-scanlines" role="dialog" aria-modal="true" aria-labelledby="ai-detail-modal-title">
      <TerminalWindow title={`AI 트레이더 상세 정보: ${trader.name}`} className="w-full max-w-3xl">
        <div className="flex justify-between items-center">
          <h2 id="ai-detail-modal-title" className="text-xl text-orange-400">{trader.name}</h2>
          <button onClick={onClose} className="text-red-500 text-glow font-bold text-2xl px-2 hover:bg-red-500/20" aria-label="Close AI detail window">X</button>
        </div>

        <div className="grid grid-cols-3 gap-2 my-2 text-center border-y-2 border-green-500/50 py-2">
            <div><p>전략</p><p className="text-purple-400 text-glow text-lg">{trader.strategy}</p></div>
            <div><p>위험 계수</p><p className="text-red-400 text-glow text-lg">{trader.riskFactor}</p></div>
            <div><p>상태</p><p className={`${trader.cooldown > 0 ? 'text-yellow-400 animate-pulse' : 'text-green-400'} text-glow text-lg`}>{trader.cooldown > 0 ? `쿨다운(${trader.cooldown})` : '대기'}</p></div>
        </div>

        <div className="grid grid-cols-3 gap-2 my-2 text-center border-b-2 border-green-500/50 pb-2">
            <div><p>총 자산</p><p className="text-yellow-400 text-glow text-lg">{formatCash(totalAssets)}</p></div>
            <div><p>보유 현금</p><p className="text-green-400 text-glow text-lg">{formatCash(trader.cash)}</p></div>
            <div><p>주식 평가액</p><p className="text-cyan-400 text-glow text-lg">{formatCash(stockValue)}</p></div>
        </div>
        
        <h3 className="text-lg text-green-300 text-glow pl-1 mt-4">보유 포트폴리오</h3>
        <div className="h-[280px] overflow-y-auto mt-2">
            {portfolioDetails.length > 0 ? (
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-black/80">
                        <tr>
                            <th className="p-1">종목</th>
                            <th className="p-1 text-right">보유량</th>
                            <th className="p-1 text-right">평단가</th>
                            <th className="p-1 text-right">현재가</th>
                            <th className="p-1 text-right">평가금액</th>
                            <th className="p-1 text-right">수익률</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolioDetails.map(item => {
                            if (!item) return null;
                            const profitColorClass = item.profitPercent > 0 ? 'text-green-400' : item.profitPercent < 0 ? 'text-red-500' : 'text-yellow-400';
                            const profitSign = item.profitPercent > 0 ? '+' : '';

                            return (
                                <tr key={item.symbol} className="border-t border-green-800/50">
                                    <td className="p-1 font-bold">{item.symbol}</td>
                                    <td className="p-1 text-right text-cyan-300">{item.quantity}</td>
                                    <td className="p-1 text-right">${item.averagePrice.toFixed(2)}</td>
                                    <td className={`p-1 text-right ${stocks.find(s=>s.symbol === item.symbol)!.change >= 0 ? 'text-green-400':'text-red-500'}`}>${item.currentPrice.toFixed(2)}</td>
                                    <td className="p-1 text-right text-yellow-400">{formatCash(item.currentValue)}</td>
                                    <td className={`p-1 text-right font-bold ${profitColorClass}`}>{profitSign}{item.profitPercent.toFixed(2)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="text-green-500/70 p-2 text-center text-sm h-full flex items-center justify-center">보유 주식이 없습니다.</div>
            )}
        </div>
      </TerminalWindow>
    </div>
  );
};

export default AITraderDetailModal;
