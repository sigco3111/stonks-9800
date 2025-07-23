import React from 'react';
import { Stock, PortfolioItem } from '../types';
import TerminalWindow from './TerminalWindow';

interface StockTableProps {
  stocks: Stock[];
  portfolio: Record<string, PortfolioItem>;
  onStockSelect: (stock: Stock) => void;
}

const formatMarketCap = (cap?: number): string => {
    if (cap === undefined) return '-';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
    return `$${cap.toFixed(0)}`;
};


const StockTable: React.FC<StockTableProps> = ({ stocks, portfolio, onStockSelect }) => {
  return (
    <TerminalWindow title="시장 데이터 스트림">
      <div className="h-[280px] overflow-y-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-black/80">
            <tr>
              <th className="p-1">종목</th>
              <th className="p-1 text-right">현재가</th>
              <th className="p-1 text-right">등락률</th>
              <th className="p-1 text-right">보유량</th>
              <th className="p-1 text-right">PER</th>
              <th className="p-1 text-right">시가총액</th>
              <th className="p-1 text-right">거래량</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(stock => {
              const isUp = stock.change >= 0;
              const colorClass = isUp ? 'text-green-400' : 'text-red-500';
              const owned = portfolio[stock.symbol]?.quantity || 0;
              const perDisplay = stock.per && stock.per > 0 ? stock.per.toFixed(2) : 'N/A';

              return (
                <tr 
                  key={stock.symbol} 
                  className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer"
                  onClick={() => onStockSelect(stock)}
                  aria-label={`Select to trade ${stock.symbol}`}
                >
                  <td className="p-1 font-bold">{stock.symbol}</td>
                  <td className={`p-1 text-right font-bold ${colorClass}`}>{stock.price.toFixed(2)}</td>
                  <td className={`p-1 text-right ${colorClass}`}>{stock.changePercent.toFixed(2)}%</td>
                  <td className="p-1 text-right text-cyan-300">{owned}</td>
                  <td className="p-1 text-right text-purple-300">{perDisplay}</td>
                  <td className="p-1 text-right text-blue-400">{formatMarketCap(stock.marketCap)}</td>
                  <td className="p-1 text-right text-green-300/80">{(stock.volume / 1000).toFixed(0)}k</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </TerminalWindow>
  );
};

export default StockTable;