import React from 'react';
import { Stock, ConditionalOrder } from '../types';
import TerminalWindow from './TerminalWindow';

interface ConditionalOrdersProps {
  orders: ConditionalOrder[];
  stocks: Stock[];
  onCancelOrder: (orderId: string) => void;
}

const ConditionalOrders: React.FC<ConditionalOrdersProps> = ({ orders, stocks, onCancelOrder }) => {
  const stocksMap = new Map(stocks.map(s => [s.symbol, s.price]));
  
  return (
    <TerminalWindow title="대기 중인 주문">
      <div className="h-[120px] overflow-y-auto">
        {orders.length > 0 ? (
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-black/80">
              <tr>
                <th className="p-1">종목</th>
                <th className="p-1">구분</th>
                <th className="p-1 text-right">수량</th>
                <th className="p-1 text-right">조건</th>
                <th className="p-1 text-right">현재가</th>
                <th className="p-1 text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const currentPrice = stocksMap.get(order.symbol);
                
                let actionText = '';
                let conditionText = '';
                let typeColor = '';

                switch(order.action) {
                    case 'BUY_LONG': 
                        actionText = '매수'; typeColor = 'text-green-400'; conditionText = '이하';
                        break;
                    case 'SELL_LONG':
                        actionText = '매도'; typeColor = 'text-red-500'; conditionText = '이상';
                        break;
                    case 'SELL_SHORT':
                        actionText = '공매도'; typeColor = 'text-red-500'; conditionText = '이상';
                        break;
                    case 'BUY_COVER':
                        actionText = '숏 커버'; typeColor = 'text-green-400'; conditionText = '이하';
                        break;
                }
                
                return (
                  <tr key={order.id} className="border-t border-green-800/50">
                    <td className="p-1 font-bold">{order.symbol}</td>
                    <td className={`p-1 font-bold ${typeColor}`}>{actionText}</td>
                    <td className="p-1 text-right text-cyan-300">{order.quantity}</td>
                    <td className="p-1 text-right text-yellow-400">${order.triggerPrice.toFixed(2)} {conditionText}</td>
                    <td className="p-1 text-right">${currentPrice?.toFixed(2) ?? '...'}</td>
                    <td className="p-1 text-center">
                      <button 
                        onClick={() => onCancelOrder(order.id)}
                        className="px-2 py-0.5 border border-red-500/50 text-red-400 hover:bg-red-500/20"
                        aria-label={`Cancel order for ${order.symbol}`}
                      >
                        취소
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-full text-green-500/70 p-4 text-center">
            대기 중인 지정가 주문이 없습니다.
          </div>
        )}
      </div>
    </TerminalWindow>
  );
};

export default ConditionalOrders;