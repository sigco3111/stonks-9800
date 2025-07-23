import React, { useState, useMemo, useEffect } from 'react';
import { Stock, ConditionalOrder, PortfolioItem, LogMessage, OrderAction, StockPricePoint } from '../types';
import TerminalWindow from './TerminalWindow';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface TradeModalProps {
  stock: Stock;
  cash: number;
  portfolioItem: PortfolioItem;
  history: StockPricePoint[];
  onBuy: (symbol: string, quantity: number, price: number) => boolean;
  onSell: (symbol: string, quantity: number, price: number) => boolean;
  onShort: (symbol: string, quantity: number, price: number) => boolean;
  onCover: (symbol: string, quantity: number, price: number) => boolean;
  onClose: () => void;
  addLog: (msg: string, status: LogMessage['status']) => void;
  addOrder: (order: Omit<ConditionalOrder, 'id' | 'status' | 'createdAt'>) => void;
}

const ChartTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-green-500 p-2 text-green-400 text-sm">
        <p className="label mb-1">{`시간 : ${label}`}</p>
        {payload.map((p: any) => (
            p.value !== undefined && (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {`${p.name} : ${p.dataKey === 'volume' ? (p.value/1000).toFixed(1) + 'k' : '$' + p.value.toFixed(2)}`}
                </p>
            )
        ))}
      </div>
    );
  }
  return null;
};

const formatBigNumber = (num?: number): string => {
    if (num === undefined) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
};

const QuantityControl: React.FC<{
  quantity: number;
  setQuantity: (fn: (q: number) => number) => void;
  max: number;
}> = ({ quantity, setQuantity, max }) => {
  const adjustQuantity = (amount: number) => {
    setQuantity(q => Math.max(0, Math.min(q + amount, max)));
  };

  return (
    <div className="flex items-center justify-center my-2 gap-1 text-lg">
      <button onClick={() => adjustQuantity(-100)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">-100</button>
      <button onClick={() => adjustQuantity(-10)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">-10</button>
      <button onClick={() => adjustQuantity(-1)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">-</button>
      <span className="px-4 py-1 border-y border-green-500/50 w-28 text-center text-yellow-400 text-glow">{quantity}</span>
      <button onClick={() => adjustQuantity(1)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">+</button>
      <button onClick={() => adjustQuantity(10)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">+10</button>
      <button onClick={() => adjustQuantity(100)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">+100</button>
      <button onClick={() => setQuantity(() => max)} className="px-2 py-1 border border-green-500/50 hover:bg-green-500/20">MAX</button>
    </div>
  );
}

const calculateMA = (data: StockPricePoint[], period: number): (number | undefined)[] => {
    if (data.length < period) return data.map(() => undefined);
    
    const result: (number | undefined)[] = Array(period - 1).fill(undefined);
    let sum = data.slice(0, period).reduce((acc, val) => acc + val.price, 0);
    result.push(sum / period);
    
    for (let i = period; i < data.length; i++) {
      sum = sum - data[i - period].price + data[i].price;
      result.push(sum / period);
    }
    return result;
}


const TradeModal: React.FC<TradeModalProps> = ({ stock, cash, portfolioItem, onBuy, onSell, onShort, onCover, onClose, addLog, addOrder, history }) => {
    const ownedShares = portfolioItem?.quantity || 0;
    const shortedShares = portfolioItem?.shortQuantity || 0;

    const [orderMode, setOrderMode] = useState<'MARKET' | 'LIMIT'>('MARKET');
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    
    const [quantity, setQuantity] = useState(0);
    const [triggerPrice, setTriggerPrice] = useState(stock.price);

    const chartData = useMemo(() => {
        if (!history || history.length === 0) return [];
        
        const ma5 = calculateMA(history, 5);
        const ma20 = calculateMA(history, 20);

        return history.map((point, index) => ({
            ...point,
            ma5: ma5[index],
            ma20: ma20[index],
        }));
    }, [history]);

    useEffect(() => {
      setQuantity(0);
    }, [tradeType]);

    useEffect(() => {
        setTriggerPrice(stock.price);
    }, [stock.price, tradeType]);

    const currentAction: OrderAction = useMemo(() => {
      if (tradeType === 'BUY') {
        return shortedShares > 0 ? 'BUY_COVER' : 'BUY_LONG';
      } else { // SELL
        return ownedShares > 0 ? 'SELL_LONG' : 'SELL_SHORT';
      }
    }, [tradeType, ownedShares, shortedShares]);

    const maxQuantity = useMemo(() => {
        const price = orderMode === 'LIMIT' ? triggerPrice : stock.price;
        if (price <= 0) return 0;

        switch (currentAction) {
            case 'BUY_LONG':
                return Math.floor(cash / price);
            case 'SELL_LONG':
                return ownedShares;
            case 'SELL_SHORT':
                // Arbitrary rule: max short value is cash balance. Can be changed for margin rules.
                return Math.floor(cash / price);
            case 'BUY_COVER':
                return Math.min(shortedShares, Math.floor(cash / price));
            default:
                return 0;
        }
    }, [currentAction, cash, stock.price, triggerPrice, ownedShares, shortedShares, orderMode]);

    useEffect(() => {
      if (quantity > maxQuantity) {
        setQuantity(maxQuantity);
      }
    }, [quantity, maxQuantity]);


    const handleConfirm = () => {
        if (quantity <= 0) {
            addLog('수량을 지정해야 합니다.', '경고');
            return;
        }

        if (orderMode === 'MARKET') {
            let success = false;
            let logMsg = '';
            let logStatus: LogMessage['status'] = '거래';

            switch (currentAction) {
                case 'BUY_LONG':
                    if (success = onBuy(stock.symbol, quantity, stock.price)) {
                        logMsg = `시장가 매수: ${stock.symbol} ${quantity}주 @ $${stock.price.toFixed(2)}`;
                    } else { logMsg = '매수 실패: 잔액 부족'; logStatus = '경고'; }
                    break;
                case 'SELL_LONG':
                    if (success = onSell(stock.symbol, quantity, stock.price)) {
                        logMsg = `시장가 매도: ${stock.symbol} ${quantity}주 @ $${stock.price.toFixed(2)}`;
                    } else { logMsg = '매도 실패: 보유 수량 부족'; logStatus = '경고'; }
                    break;
                case 'SELL_SHORT':
                     if (success = onShort(stock.symbol, quantity, stock.price)) {
                        logMsg = `공매도: ${stock.symbol} ${quantity}주 @ $${stock.price.toFixed(2)}`;
                    } else { logMsg = '공매도 실패'; logStatus = '경고'; }
                    break;
                case 'BUY_COVER':
                     if (success = onCover(stock.symbol, quantity, stock.price)) {
                        logMsg = `숏 커버: ${stock.symbol} ${quantity}주 @ $${stock.price.toFixed(2)}`;
                    } else { logMsg = '숏 커버 실패: 잔액 또는 수량 부족'; logStatus = '경고'; }
                    break;
            }
            addLog(logMsg, logStatus);
            if (success) onClose();
        } else { // LIMIT order
            if(triggerPrice <= 0) {
              addLog('지정가는 0보다 커야 합니다.', '경고');
              return;
            }
            addOrder({
                symbol: stock.symbol,
                action: currentAction,
                quantity,
                triggerPrice,
            });
            onClose();
        }
    };
    
    const totalCost = (quantity * (orderMode === 'MARKET' ? stock.price : triggerPrice)).toFixed(2);
    
    const buyButtonLabel = currentAction === 'BUY_COVER' ? '숏 커버' : '매수';
    const sellButtonLabel = currentAction === 'SELL_SHORT' ? '공매도' : '매도';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 crt-scanlines" role="dialog" aria-modal="true" aria-labelledby="trade-modal-title">
          <TerminalWindow title={`거래 터미널: ${stock.symbol}`} className="w-full max-w-4xl">
            <div className="flex justify-between items-center">
                <h2 id="trade-modal-title" className="text-xl">{stock.symbol} 현재가: <span className="text-yellow-400">${stock.price.toFixed(2)}</span></h2>
                <button onClick={onClose} className="text-red-500 text-glow font-bold text-2xl px-2 hover:bg-red-500/20" aria-label="Close trading window">X</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                <div>
                  <h3 className="text-lg text-glow mb-2 text-center">가격 기록 (최근 100틱)</h3>
                  <div style={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid stroke="#00ff41" strokeOpacity={0.2} strokeDasharray="3 3"/>
                        <XAxis dataKey="time" stroke="#00ff41" tick={{ fill: '#00ff41' }} />
                        <YAxis 
                          yAxisId="left"
                          stroke="#00ff41" 
                          tick={{ fill: '#00ff41' }} 
                          domain={[dataMin => dataMin * 0.98, dataMax => dataMax * 1.02]}
                          tickFormatter={(val) => `$${Number(val).toFixed(2)}`}
                          width={80}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#00ff41"
                          strokeOpacity={0.5}
                          tick={{ fill: '#00ff41', fillOpacity: 0.7 }}
                          tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                          width={40}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{stroke: '#00ff41', strokeWidth: 1, strokeDasharray: "3 3"}}/>
                        <Legend wrapperStyle={{ fontFamily: 'VT323, monospace', fontSize: '14px', paddingTop: '20px' }} />
                        <Bar yAxisId="right" dataKey="volume" name="거래량" fill="#00ff41" fillOpacity={0.3} barSize={10}/>
                        <Line yAxisId="left" type="monotone" dataKey="price" name="가격" stroke="#39FF14" strokeWidth={2} dot={false} connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="ma5" name="5-tick MA" stroke="#00ffff" strokeWidth={1} dot={false} connectNulls />
                        <Line yAxisId="left" type="monotone" dataKey="ma20" name="20-tick MA" stroke="#f080f0" strokeWidth={1} dot={false} connectNulls />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg text-glow mb-2 text-center">기업 정보</h3>
                  <div className="bg-black/40 border border-green-500/30 p-2 grid grid-cols-2 gap-x-4 gap-y-2 text-base h-[180px]">
                    <div className="flex justify-between border-b border-green-800/50"><span>섹터:</span> <span className="text-green-300">{stock.sector}</span></div>
                    <div className="flex justify-between border-b border-green-800/50"><span>배당/주:</span> <span className="text-blue-400">{stock.dividendPerShare ? `$${stock.dividendPerShare.toFixed(2)}` : 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-green-800/50"><span>시가총액:</span> <span className="text-yellow-400">{formatBigNumber(stock.marketCap)}</span></div>
                    <div className="flex justify-between border-b border-green-800/50"><span>PER:</span> <span className="text-purple-400">{stock.per && stock.per > 0 ? stock.per.toFixed(2) : 'N/A'}</span></div>
                    <div className="flex justify-between border-b border-green-800/50"><span>연매출:</span> <span className="text-yellow-400">{formatBigNumber(stock.financials.revenue)}</span></div>
                    <div className="flex justify-between border-b border-green-800/50"><span>EPS:</span> <span className="text-purple-400">${stock.financials.earningsPerShare.toFixed(2)}</span></div>
                    <div className="col-span-2 flex justify-between border-b border-green-800/50"><span>발행 주식 수:</span> <span className="text-cyan-400">{`${(stock.financials.totalShares / 1_000_000).toFixed(2)}M`}</span></div>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 my-2 text-center border-y-2 border-green-500/50 py-2">
                <div><p>보유 현금</p><p className="text-green-400 text-glow text-lg">${cash.toFixed(2)}</p></div>
                <div><p>보유 주식(롱)</p><p className="text-cyan-400 text-glow text-lg">{ownedShares} 주</p></div>
                <div><p>보유 주식(숏)</p><p className="text-red-400 text-glow text-lg">{shortedShares} 주</p></div>
            </div>
            
            <div className="flex justify-center border-b-2 border-green-500/50 text-center">
                <button onClick={() => setOrderMode('MARKET')} className={`w-1/2 p-1 text-base ${orderMode === 'MARKET' ? 'bg-green-500/20 font-bold' : 'hover:bg-green-500/10'}`}>시장가 주문</button>
                <button onClick={() => setOrderMode('LIMIT')} className={`w-1/2 p-1 text-base ${orderMode === 'LIMIT' ? 'bg-green-500/20 font-bold' : 'hover:bg-green-500/10'}`}>지정가 주문</button>
            </div>
            
            <div className="flex justify-center border-2 border-t-0 border-green-500/50">
                <button onClick={() => setTradeType('BUY')} className={`w-1/2 p-2 text-2xl ${tradeType === 'BUY' ? 'bg-green-500 text-black font-bold' : 'hover:bg-green-500/20'}`}>{buyButtonLabel}</button>
                <button onClick={() => setTradeType('SELL')} className={`w-1/2 p-2 text-2xl ${tradeType === 'SELL' ? 'bg-red-500 text-black font-bold' : 'hover:bg-red-500/20'}`}>{sellButtonLabel}</button>
            </div>

            <div className="text-center p-2 border-x border-b border-green-800/50">
                 {orderMode === 'LIMIT' && (
                    <div className="text-center my-2">
                        <label className="text-xl mr-2">{tradeType === 'BUY' ? '매수 지정가' : '매도 지정가'}: $</label>
                        <input type="number" value={triggerPrice.toFixed(2)} onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)} className="bg-black border border-green-500/50 text-yellow-400 text-glow w-28 p-1 text-center text-xl" step="0.01"/>
                    </div>
                )}
                <p className="my-1 text-xl">수량 (최대: {maxQuantity})</p>
                <QuantityControl quantity={quantity} setQuantity={setQuantity} max={maxQuantity} />
                <p className="mt-2 text-xl">예상 금액: <span className="text-yellow-400 text-glow">${totalCost}</span></p>
            </div>

            <div className="mt-4 flex justify-center gap-4">
                <button 
                    onClick={handleConfirm}
                    disabled={quantity <= 0}
                    className="w-52 p-3 text-2xl font-bold border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed"
                >
                    {orderMode === 'MARKET' ? '주문 확인' : '지정가 주문 제출'}
                </button>
            </div>
          </TerminalWindow>
        </div>
    )
}

export default TradeModal;