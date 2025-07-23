
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMockStockData } from './hooks/useMockStockData';
import { usePortfolio } from './hooks/usePortfolio';
import BootScreen from './components/BootScreen';
import StockTicker from './components/StockTicker';
import StockTable from './components/StockTable';
import PortfolioChart from './components/PortfolioChart';
import SystemLog from './components/SystemLog';
import NewsFeed from './components/NewsFeed';
import TradeModal from './components/TradeModal';
import PortfolioManager from './components/PortfolioManager';
import ConditionalOrders from './components/ConditionalOrders';
import BondsManager from './components/BondsManager';
import BondTradeModal from './components/BondTradeModal';
import ConfirmModal from './components/ConfirmModal';
import AITradersStatus from './components/AITradersStatus';
import AITraderDetailModal from './components/AITraderDetailModal';
import { Stock, PortfolioData, LogMessage, ConditionalOrder, SavedGameState, Bond, AITrader } from './types';
import { AVAILABLE_BONDS } from './constants';

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

const SAVE_GAME_KEY = 'stonks9800_save';

const Game: React.FC<{ onReset: () => void }> = ({ onReset }) => {
  const [isBooting, setIsBooting] = useState(true);
  const [tradeModalStock, setTradeModalStock] = useState<Stock | null>(null);
  const [tradeModalBond, setTradeModalBond] = useState<Bond | null>(null);
  const [detailAITrader, setDetailAITrader] = useState<AITrader | null>(null);
  const [isResetConfirmVisible, setIsResetConfirmVisible] = useState(false);
  // 텍스트 불빛 효과를 위한 상태 추가
  const [isTextGlowEnabled, setIsTextGlowEnabled] = useState(true);
  
  const isPaused = tradeModalStock !== null || tradeModalBond !== null || detailAITrader !== null;

  const savedData = useMemo(() => JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || 'null') as SavedGameState | null, []);

  // 저장된 text-glow 설정 불러오기
  useEffect(() => {
    if (savedData?.isTextGlowEnabled !== undefined) {
      setIsTextGlowEnabled(savedData.isTextGlowEnabled);
    }
  }, [savedData]);

  const initialLogs: LogMessage[] = [
    { time: getCurrentTime(), msg: '시스템 초기화 완료', status: '정상' },
    { time: getCurrentTime(), msg: '[STONKS-NET] 연결됨', status: '정상' },
    { time: getCurrentTime(), msg: '데이터 스트림 핸드셰이크', status: '정상' },
  ];

  if (savedData) {
      initialLogs.push({ time: getCurrentTime(), msg: '저장된 세션 데이터를 불러왔습니다', status: '정보' });
  }

  const { stocks, aiTraders, processedEvent, aiTradeLog, priceHistory, interestRate, inflationRate, gdpGrowth, unemploymentRate } = useMockStockData({ isPaused, savedData });
  const { cash, portfolio, bonds, buyStock, sellStock, shortStock, coverStock, addCash, buyBond, sellBond, redeemMaturedBonds } = usePortfolio(savedData ?? undefined);
  
  const [logs, setLogs] = useState<LogMessage[]>(initialLogs);
  const [news, setNews] = useState<LogMessage[]>([]);
  
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioData[]>([]);
  const [timeCounter, setTimeCounter] = useState(0);

  const [orders, setOrders] = useState<ConditionalOrder[]>(savedData?.orders ?? []);

  const addLog = useCallback((msg: string, status: LogMessage['status']) => {
    setLogs(prev => [...prev.slice(-20), { time: getCurrentTime(), msg, status }]);
  }, []);
  
  useEffect(() => {
    if (aiTradeLog) {
      setLogs(prev => [...prev.slice(-20), aiTradeLog]);
    }
  }, [aiTradeLog]);


  const currentBondPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    AVAILABLE_BONDS.forEach(bond => {
        const price_sensitivity_factor = 10;
        const rateDelta = bond.interestRate - interestRate;
        const price = bond.price * (1 + rateDelta * price_sensitivity_factor);
        prices[bond.id] = Math.max(price, 1.0);
    });
    return prices;
  }, [interestRate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (processedEvent) {
      const newNewsItem = { time: getCurrentTime(), msg: processedEvent.title, status: '이벤트' as const };
      setNews(prev => [...prev.slice(-20), newNewsItem]);
    }
  }, [processedEvent]);

  const totalAssets = useMemo(() => {
    const stockValue = stocks.reduce((acc: number, stock) => {
        const portfolioItem = portfolio[stock.symbol];
        if (!portfolioItem) return acc;
        
        const longValue = stock.price * (portfolioItem.quantity || 0);
        const shortLiability = stock.price * (portfolioItem.shortQuantity || 0);
        
        return acc + longValue - shortLiability;
    }, 0);
    const bondValue = bonds.reduce((acc: number, portfolioBond) => {
      const currentPrice = currentBondPrices[portfolioBond.bondId] || portfolioBond.purchasePrice;
      return acc + (portfolioBond.quantity * currentPrice);
    }, 0);
    return cash + stockValue + bondValue;
  }, [stocks, portfolio, cash, bonds, currentBondPrices]);

  useEffect(() => {
      const saveInterval = setInterval(() => {
          if (!isBooting && !isPaused) {
              try {
                  // 현재 게임 상태 구성
                  const gameState: SavedGameState = {
                      cash,
                      portfolio,
                      orders: orders.filter(o => o.status === 'PENDING'),
                      bonds,
                      aiTraders,
                      isTextGlowEnabled,
                  };
                  
                  // 디버깅을 위해 로그 추가
                  console.log('게임 상태 자동 저장:', JSON.stringify({
                      cash,
                      portfolioSize: Object.keys(portfolio).length,
                      bondsCount: bonds.length,
                      pendingOrders: orders.filter(o => o.status === 'PENDING').length,
                      aiTradersCount: aiTraders?.length ?? 0,
                      isTextGlowEnabled
                  }));

                  localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(gameState));
              } catch (error) {
                  console.error('게임 상태 저장 중 오류 발생:', error);
              }
          }
      }, 5000);
      return () => clearInterval(saveInterval);
  }, [cash, portfolio, orders, bonds, isBooting, aiTraders, isPaused, isTextGlowEnabled]);
  
  useEffect(() => {
    if (stocks.length > 0 && !isBooting) {
        setPortfolioHistory(prevHistory => {
            const newHistory = [...prevHistory, { time: `${timeCounter}s`, value: totalAssets }];
            return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });
    }
  }, [totalAssets, timeCounter, isBooting, stocks.length]);
  
  useEffect(() => {
    if(isBooting || isPaused) return;
    const interval = setInterval(() => {
        setTimeCounter(prev => prev + 2);
    }, 2000);
    return () => clearInterval(interval);
  }, [isBooting, isPaused]);

  useEffect(() => {
    if (isBooting || isPaused) return;

    const dividendInterval = setInterval(() => {
        let totalDividend = 0;
        const dividendStocks = stocks.filter(s => s.dividendPerShare && s.dividendPerShare > 0);

        for (const stock of dividendStocks) {
            const item = portfolio[stock.symbol];
            if (item && item.quantity > 0) {
                const dividendAmount = item.quantity * stock.dividendPerShare!;
                totalDividend += dividendAmount;
            }
        }

        if (totalDividend > 0) {
            addCash(totalDividend);
            addLog(`분기 배당금 지급 완료. 총액: $${totalDividend.toFixed(2)}`, '정보');
        }
    }, 90000);

    return () => clearInterval(dividendInterval);
  }, [isBooting, isPaused, stocks, portfolio, addCash, addLog]);

  const addOrder = useCallback((order: Omit<ConditionalOrder, 'id' | 'status' | 'createdAt'>) => {
    const newOrder: ConditionalOrder = {
        ...order,
        id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'PENDING',
        createdAt: getCurrentTime(),
    };
    setOrders(prev => [...prev, newOrder]);
    
    let actionText = '';
    let conditionText = '';
    switch(order.action) {
        case 'BUY_LONG': actionText = '매수'; conditionText = '이하'; break;
        case 'SELL_LONG': actionText = '매도'; conditionText = '이상'; break;
        case 'SELL_SHORT': actionText = '공매도'; conditionText = '이상'; break;
        case 'BUY_COVER': actionText = '숏 커버'; conditionText = '이하'; break;
    }
    addLog(`지정가 ${actionText} 주문: ${order.symbol} ${order.quantity}주 @ $${order.triggerPrice.toFixed(2)} ${conditionText}`, '주문');
  }, [addLog]);

  const cancelOrder = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    if(order){
        addLog(`주문 취소: ${order.symbol} ${order.quantity}주`, '정보');
    }
  }, [addLog, orders]);

  useEffect(() => {
      if (isBooting || stocks.length === 0) return;

      const pendingOrders = orders.filter(o => o.status === 'PENDING');
      if (pendingOrders.length === 0) return;
      
      const stocksMap = new Map(stocks.map(s => [s.symbol, s]));
      let ordersUpdated = false;

      const updatedOrders = orders.map(order => {
          if (order.status !== 'PENDING') return order;

          const stock = stocksMap.get(order.symbol);
          if (!stock) return order;

          let conditionMet = false;
          const isBuyAction = order.action === 'BUY_LONG' || order.action === 'BUY_COVER';
          if (isBuyAction && stock.price <= order.triggerPrice) {
              conditionMet = true;
          } else if (!isBuyAction && stock.price >= order.triggerPrice) {
              conditionMet = true;
          }

          if (conditionMet) {
              ordersUpdated = true;
              let tradeSuccess = false;
              let reason = '';
              let executedActionText = '';

              switch(order.action) {
                case 'BUY_LONG':
                    tradeSuccess = buyStock(order.symbol, order.quantity, stock.price);
                    if (!tradeSuccess) reason = '잔액 부족';
                    executedActionText = '매수';
                    break;
                case 'SELL_LONG':
                    tradeSuccess = sellStock(order.symbol, order.quantity, stock.price);
                    if (!tradeSuccess) reason = '보유 수량 부족';
                    executedActionText = '매도';
                    break;
                case 'SELL_SHORT':
                    tradeSuccess = shortStock(order.symbol, order.quantity, stock.price);
                    if (!tradeSuccess) reason = '공매도 실패';
                    executedActionText = '공매도';
                    break;
                case 'BUY_COVER':
                    tradeSuccess = coverStock(order.symbol, order.quantity, stock.price);
                    if (!tradeSuccess) reason = '잔액 또는 수량 부족';
                    executedActionText = '숏 커버';
                    break;
              }

              if (tradeSuccess) {
                  addLog(`주문 실행: ${executedActionText} ${order.symbol} ${order.quantity}주 @ $${stock.price.toFixed(2)}`, '거래');
                  return { ...order, status: 'EXECUTED' as const };
              } else {
                  addLog(`주문 실패 (${reason}): ${order.symbol} ${order.quantity}주`, '경고');
                  return { ...order, status: 'FAILED' as const };
              }
          }
          return order;
      });

      if (ordersUpdated) {
          setOrders(updatedOrders);
      }
  }, [stocks, orders, buyStock, sellStock, shortStock, coverStock, addLog, isBooting]);
  
    useEffect(() => {
        if (isBooting || isPaused || bonds.length === 0) return;

        const bondDetailsMap = new Map(AVAILABLE_BONDS.map(b => [b.id, b]));
        const now = timeCounter;
        const maturedInstances = bonds.filter(portfolioBond => {
            const detail = bondDetailsMap.get(portfolioBond.bondId);
            return detail && now >= portfolioBond.purchaseTime + detail.maturityInSeconds;
        });

        if (maturedInstances.length > 0) {
            let totalPayout = 0;
            const maturedInstanceIds: string[] = [];

            maturedInstances.forEach(instance => {
                const detail = bondDetailsMap.get(instance.bondId);
                if (!detail) return;

                const principal = instance.quantity * instance.purchasePrice;
                const years = detail.maturityInSeconds / 60;
                const interest = principal * detail.interestRate * years;
                const payout = principal + interest;

                totalPayout += payout;
                maturedInstanceIds.push(instance.instanceId);

                addLog(`채권 만기: ${detail.name} ${instance.quantity}개. $${payout.toFixed(2)} 지급.`, '정보');
            });

            if (maturedInstanceIds.length > 0) {
                redeemMaturedBonds(maturedInstanceIds, totalPayout);
            }
        }
    }, [timeCounter, isBooting, isPaused, bonds, redeemMaturedBonds, addLog]);

  // 텍스트 불빛 효과 토글 핸들러
  const toggleTextGlow = () => {
    setIsTextGlowEnabled(prev => {
      const newValue = !prev;
      try {
        // 기존 저장된 데이터 불러오기
        const savedData = JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || 'null') as SavedGameState | null;
        
        // 기존 데이터가 있으면 업데이트, 없으면 새로 생성
        const updatedData: SavedGameState = {
          ...(savedData || {}),
          cash,
          portfolio,
          orders: orders.filter(o => o.status === 'PENDING'),
          bonds,
          aiTraders,
          isTextGlowEnabled: newValue
        } as SavedGameState;

        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(updatedData));
        
        // 디버깅을 위한 로그
        console.log('text-glow 설정 변경 및 저장:', newValue);
      } catch (error) {
        console.error('text-glow 설정 저장 중 오류 발생:', error);
      }
      return newValue;
    });
  };

  if (isBooting) {
    return <BootScreen />;
  }

  const handleStockSelect = (stock: Stock) => setTradeModalStock(stock);
  const handleCloseStockModal = () => setTradeModalStock(null);
  const handleBondSelect = (bond: Bond) => setTradeModalBond(bond);
  const handleCloseBondModal = () => setTradeModalBond(null);
  const handleAITraderSelect = (aiTrader: AITrader) => setDetailAITrader(aiTrader);
  const handleCloseAIDetailModal = () => setDetailAITrader(null);

  const handleResetGame = () => setIsResetConfirmVisible(true);
  const executeResetGame = () => onReset();
  const cancelResetGame = () => setIsResetConfirmVisible(false);

  return (
    <div className={`relative min-h-screen w-full p-2 md:p-4 text-sm md:text-base lg:text-lg crt-scanlines ${isTextGlowEnabled ? "" : "no-text-glow"}`}>
      <header className="flex justify-between items-center border-2 border-green-500/50 p-2 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl md:text-4xl text-glow">트레이더: STONKS-9800</h1>
        </div>
        {isPaused && <span className="text-2xl text-yellow-400 text-glow animate-pulse">PAUSED</span>}
        <div className="text-right grid grid-cols-2 gap-x-4">
          <span>기준 금리:</span><span className="text-purple-400 text-glow text-left">{(interestRate * 100).toFixed(2)}%</span>
          <span>인플레이션:</span><span className="text-orange-400 text-glow text-left">{(inflationRate * 100).toFixed(2)}%</span>
          <span>GDP 성장률:</span><span className="text-teal-400 text-glow text-left">{(gdpGrowth * 100).toFixed(2)}%</span>
          <span>실업률:</span><span className="text-red-400 text-glow text-left">{(unemploymentRate * 100).toFixed(2)}%</span>

          <span className="col-span-2 border-t border-green-500/30 my-1"></span>
          
          <span>보유 현금:</span><span className="text-green-400 text-glow text-left">${cash.toFixed(2)}</span>
          <span>총 자산:</span><span className="text-yellow-400 text-glow text-left">${totalAssets.toFixed(2)}</span>
        </div>
      </header>

      <div className="w-full border-2 border-green-500/50 mb-4 overflow-hidden">
        <StockTicker stocks={stocks} />
      </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <StockTable stocks={stocks} portfolio={portfolio} onStockSelect={handleStockSelect} />
          <PortfolioManager stocks={stocks} portfolio={portfolio} onStockSelect={handleStockSelect} ownedBonds={bonds} onBondSelect={handleBondSelect} currentBondPrices={currentBondPrices} />
          <ConditionalOrders orders={orders.filter(o => o.status === 'PENDING')} stocks={stocks} onCancelOrder={cancelOrder} />
          <BondsManager onBondSelect={handleBondSelect} currentBondPrices={currentBondPrices} />
        </div>
        <div className="flex flex-col gap-4">
          <PortfolioChart data={portfolioHistory} />
          <NewsFeed news={news} />
          <SystemLog logs={logs} />
          <AITradersStatus aiTraders={aiTraders} stocks={stocks} onAITraderSelect={handleAITraderSelect} />
        </div>
      </main>
      
      <footer className="w-full border-t-2 border-green-500/50 mt-4 pt-2 flex justify-between items-center text-green-500/70">
        <span>(c) 1998 SIGCO 산업. 모든 권리 보유. 터미널 ID: {`0x${(Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase()}`}</span>
        <div className="flex gap-2">
          <button 
            onClick={toggleTextGlow} 
            className={`border px-2 py-1 ${isTextGlowEnabled ? 'border-yellow-400 text-yellow-400' : 'border-gray-500 text-gray-500'}`}
          >
            text-glow
          </button>
          <button onClick={handleResetGame} className="border border-red-500/50 text-red-500 px-2 py-1 hover:bg-red-500/30">게임 초기화</button>
        </div>
      </footer>

      {tradeModalStock && (
        <TradeModal stock={tradeModalStock} cash={cash} portfolioItem={portfolio[tradeModalStock.symbol]} onBuy={buyStock} onSell={sellStock} onShort={shortStock} onCover={coverStock} onClose={handleCloseStockModal} addLog={addLog} addOrder={addOrder} history={priceHistory[tradeModalStock.symbol] || []} />
      )}

      {tradeModalBond && (
        <BondTradeModal bond={tradeModalBond} currentPrice={currentBondPrices[tradeModalBond.id] || 0} cash={cash} portfolioBonds={bonds.filter(b => b.bondId === tradeModalBond.id)} onBuy={(bondId, quantity, price) => buyBond(bondId, quantity, price, timeCounter)} onSell={sellBond} onClose={handleCloseBondModal} addLog={addLog} />
      )}

      {detailAITrader && (
        <AITraderDetailModal trader={detailAITrader} stocks={stocks} onClose={handleCloseAIDetailModal} />
      )}

      {isResetConfirmVisible && (
        <ConfirmModal title="게임 초기화 확인" message="정말로 모든 진행 상황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다." onConfirm={executeResetGame} onCancel={cancelResetGame} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [gameKey, setGameKey] = useState(0);

  const triggerReset = () => {
    localStorage.removeItem(SAVE_GAME_KEY);
    setGameKey(prevKey => prevKey + 1);
  };

  return <Game key={gameKey} onReset={triggerReset} />;
};

export default App;