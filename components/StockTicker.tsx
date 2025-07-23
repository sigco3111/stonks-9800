
import React from 'react';
import { Stock } from '../types';

interface StockTickerProps {
  stocks: Stock[];
}

const StockTicker: React.FC<StockTickerProps> = ({ stocks }) => {
  const topMovers = stocks.slice(0, 10);

  const TickerItem: React.FC<{stock: Stock}> = ({ stock }) => {
    const isUp = stock.change >= 0;
    const color = isUp ? 'text-green-400' : 'text-red-500';
    const sign = isUp ? '▲' : '▼';
    return (
      <span className={`mx-4 whitespace-nowrap ${color}`}>
        {stock.symbol} {stock.price.toFixed(2)} {sign} {Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
      </span>
    );
  }

  return (
    <div className="bg-black/50 py-1 relative flex overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
            {topMovers.map((stock, i) => <TickerItem key={`${stock.symbol}-${i}`} stock={stock} />)}
        </div>
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap">
            {topMovers.map((stock, i) => <TickerItem key={`${stock.symbol}-${i}-2`} stock={stock} />)}
        </div>
    </div>
  );
};

// Add marquee animation to tailwind config. For this project, it's injected via style
// This is a common pattern when you don't have access to tailwind.config.js
const style = document.createElement('style');
style.innerHTML = `
@keyframes marquee {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-100%); }
}
@keyframes marquee2 {
    0% { transform: translateX(100%); }
    100% { transform: translateX(0%); }
}
.animate-marquee {
    animation: marquee 30s linear infinite;
}
.animate-marquee2 {
    animation: marquee2 30s linear infinite;
}
`;
document.head.appendChild(style);


export default StockTicker;
