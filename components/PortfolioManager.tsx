import React, { useMemo } from 'react';
import { Stock, PortfolioItem, Bond, PortfolioBond } from '../types';
import TerminalWindow from './TerminalWindow';
import { AVAILABLE_BONDS } from '../constants';

interface PortfolioManagerProps {
  stocks: Stock[];
  portfolio: Record<string, PortfolioItem>;
  onStockSelect: (stock: Stock) => void;
  ownedBonds: PortfolioBond[];
  onBondSelect: (bond: Bond) => void;
  currentBondPrices: Record<string, number>;
}

interface AggregatedBondInfo {
    bond: Bond;
    quantity: number;
    avgPurchasePrice: number;
    totalCost: number;
}

const bondDetailsMap = new Map(AVAILABLE_BONDS.map(b => [b.id, b]));

const PortfolioManager: React.FC<PortfolioManagerProps> = ({ stocks, portfolio, onStockSelect, ownedBonds, onBondSelect, currentBondPrices }) => {
  const ownedStocks = stocks
    .filter(stock => portfolio[stock.symbol]?.quantity > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
  
  const shortedStocks = stocks
    .filter(stock => portfolio[stock.symbol]?.shortQuantity > 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const aggregatedBonds = useMemo<AggregatedBondInfo[]>(() => {
    const bondMap: Record<string, { quantity: number, totalCost: number }> = {};
    
    ownedBonds.forEach(pBond => {
        if (!bondMap[pBond.bondId]) {
            bondMap[pBond.bondId] = { quantity: 0, totalCost: 0 };
        }
        bondMap[pBond.bondId].quantity += pBond.quantity;
        bondMap[pBond.bondId].totalCost += pBond.quantity * pBond.purchasePrice;
    });
    
    return Object.entries(bondMap).map(([bondId, data]) => {
        const bond = bondDetailsMap.get(bondId)!;
        return {
            bond,
            quantity: data.quantity,
            totalCost: data.totalCost,
            avgPurchasePrice: data.quantity > 0 ? data.totalCost / data.quantity : 0,
        };
    }).sort((a, b) => a.bond.name.localeCompare(b.bond.name));
  }, [ownedBonds]);

  return (
    <TerminalWindow title="자산 관리">
      <div className="h-[300px] overflow-y-auto">
        <h3 className="text-lg text-green-300 text-glow pl-1">보유 주식 (롱 포지션)</h3>
        {ownedStocks.length > 0 ? (
          <table className="w-full text-left text-sm mb-4">
            <thead className="sticky top-0 bg-black/80">
              <tr>
                <th className="p-1">종목</th>
                <th className="p-1 text-right">보유량</th>
                <th className="p-1 text-right">평단가</th>
                <th className="p-1 text-right">현재가</th>
                <th className="p-1 text-right">수익률</th>
                <th className="p-1 text-right">평가금액</th>
                <th className="p-1 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {ownedStocks.map(stock => {
                const portfolioItem = portfolio[stock.symbol];
                const value = portfolioItem.quantity * stock.price;
                const profitPercent = portfolioItem.averagePrice > 0 ? ((stock.price - portfolioItem.averagePrice) / portfolioItem.averagePrice) * 100 : 0;
                
                const profitColorClass = profitPercent > 0 ? 'text-green-400' : profitPercent < 0 ? 'text-red-500' : 'text-yellow-400';
                const profitSign = profitPercent > 0 ? '+' : '';

                return (
                  <tr 
                    key={stock.symbol} 
                    className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer"
                    onClick={() => onStockSelect(stock)}
                  >
                    <td className="p-1 font-bold">{stock.symbol}</td>
                    <td className="p-1 text-right text-cyan-300">{portfolioItem.quantity}</td>
                    <td className="p-1 text-right">${portfolioItem.averagePrice.toFixed(2)}</td>
                    <td className={`p-1 text-right ${stock.change >= 0 ? 'text-green-400' : 'text-red-500'}`}>${stock.price.toFixed(2)}</td>
                    <td className={`p-1 text-right font-bold ${profitColorClass}`}>{profitSign}{profitPercent.toFixed(2)}%</td>
                    <td className="p-1 text-right text-yellow-400">${value.toFixed(2)}</td>
                    <td className="p-1 text-center">
                      <button onClick={() => onStockSelect(stock)} className="px-2 py-0.5 border border-green-500/50 text-green-400 hover:bg-green-500/20">거래</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-green-500/70 p-2 text-center text-sm">보유 주식이 없습니다.</div>
        )}

        <h3 className="text-lg text-red-400 text-glow pl-1">공매도 포지션</h3>
        {shortedStocks.length > 0 ? (
          <table className="w-full text-left text-sm mb-4">
             <thead className="sticky top-0 bg-black/80">
              <tr>
                <th className="p-1">종목</th>
                <th className="p-1 text-right">보유량</th>
                <th className="p-1 text-right">평단가</th>
                <th className="p-1 text-right">현재가</th>
                <th className="p-1 text-right">수익률</th>
                <th className="p-1 text-right">평가손익</th>
                <th className="p-1 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {shortedStocks.map(stock => {
                const portfolioItem = portfolio[stock.symbol];
                // For short positions, profit is made when the current price is lower than the average short price.
                const profit = (portfolioItem.averageShortPrice - stock.price) * portfolioItem.shortQuantity;
                const profitPercent = portfolioItem.averageShortPrice > 0 ? ((portfolioItem.averageShortPrice - stock.price) / portfolioItem.averageShortPrice) * 100 : 0;
                
                const profitColorClass = profitPercent > 0 ? 'text-green-400' : profitPercent < 0 ? 'text-red-500' : 'text-yellow-400';
                const profitSign = profitPercent > 0 ? '+' : '';

                return (
                  <tr 
                    key={stock.symbol} 
                    className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer"
                    onClick={() => onStockSelect(stock)}
                  >
                    <td className="p-1 font-bold">{stock.symbol}</td>
                    <td className="p-1 text-right text-cyan-300">{portfolioItem.shortQuantity}</td>
                    <td className="p-1 text-right">${portfolioItem.averageShortPrice.toFixed(2)}</td>
                    <td className={`p-1 text-right ${stock.change >= 0 ? 'text-green-400' : 'text-red-500'}`}>${stock.price.toFixed(2)}</td>
                    <td className={`p-1 text-right font-bold ${profitColorClass}`}>{profitSign}{profitPercent.toFixed(2)}%</td>
                    <td className={`p-1 text-right font-bold ${profitColorClass}`}>${profit.toFixed(2)}</td>
                    <td className="p-1 text-center">
                      <button onClick={() => onStockSelect(stock)} className="px-2 py-0.5 border border-green-500/50 text-green-400 hover:bg-green-500/20">거래</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-green-500/70 p-2 text-center text-sm">공매도 포지션이 없습니다.</div>
        )}

        <h3 className="text-lg text-cyan-300 text-glow pl-1">보유 채권</h3>
        {aggregatedBonds.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/80">
              <tr>
                <th className="p-1">채권명</th>
                <th className="p-1 text-right">보유량</th>
                <th className="p-1 text-right">평단가</th>
                <th className="p-1 text-right">현재가</th>
                <th className="p-1 text-right">수익률</th>
                <th className="p-1 text-right">평가금액</th>
                <th className="p-1 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {aggregatedBonds.map(aggBond => {
                const currentPrice = currentBondPrices[aggBond.bond.id] || aggBond.bond.price;
                const currentValue = aggBond.quantity * currentPrice;
                const profitPercent = aggBond.avgPurchasePrice > 0 ? ((currentPrice - aggBond.avgPurchasePrice) / aggBond.avgPurchasePrice) * 100 : 0;
                const profitColor = profitPercent > 0 ? 'text-green-400' : profitPercent < 0 ? 'text-red-500' : 'text-yellow-400';
                const profitSign = profitPercent > 0 ? '+' : '';

                return (
                  <tr key={aggBond.bond.id} className="border-t border-green-800/50 hover:bg-green-500/20 cursor-pointer" onClick={() => onBondSelect(aggBond.bond)}>
                    <td className="p-1 font-bold">{aggBond.bond.name}</td>
                    <td className="p-1 text-right text-cyan-300">{aggBond.quantity}</td>
                    <td className="p-1 text-right">${aggBond.avgPurchasePrice.toFixed(2)}</td>
                    <td className={`p-1 text-right ${profitColor}`}>${currentPrice.toFixed(2)}</td>
                    <td className={`p-1 text-right font-bold ${profitColor}`}>{profitSign}{profitPercent.toFixed(2)}%</td>
                    <td className="p-1 text-right text-yellow-400">${currentValue.toFixed(2)}</td>
                    <td className="p-1 text-center">
                      <button onClick={() => onBondSelect(aggBond.bond)} className="px-2 py-0.5 border border-green-500/50 text-green-400 hover:bg-green-500/20">거래</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-green-500/70 p-2 text-center text-sm">보유 채권이 없습니다.</div>
        )}
      </div>
    </TerminalWindow>
  );
};

export default PortfolioManager;