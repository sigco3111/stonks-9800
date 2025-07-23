import { useState, useEffect, useRef } from 'react';
import { Stock, MarketEvent, StockPricePoint, Financials, AITrader, LogMessage, SavedGameState } from '../types';
import { STOCK_SYMBOLS, DIVIDEND_PAYING_STOCKS, SECTORS, STOCK_SECTORS } from '../constants';

const generateInitialStocks = (): Stock[] => {
  return STOCK_SYMBOLS.map(symbol => {
    const totalShares = (Math.random() * 500 + 100) * 1_000_000; // 100M - 600M shares
    const earningsPerShare = Math.random() * 8 + 1; // $1 - $9 EPS
    const revenue = earningsPerShare * totalShares * (Math.random() * 5 + 1); // Revenue is a multiple of earnings
    
    const initialPER = Math.random() * 15 + 15; // 15-30
    const price = earningsPerShare * initialPER;

    const dividendPerShare = DIVIDEND_PAYING_STOCKS[symbol];
    const sector = STOCK_SECTORS[symbol];
    
    const financials: Financials = {
        revenue,
        earningsPerShare,
        totalShares,
    };
    
    return {
      symbol,
      price,
      change: 0,
      changePercent: 0,
      volume: Math.floor(Math.random() * 2000000) + 500000,
      previousPrice: price,
      sector,
      financials,
      ...(dividendPerShare && { dividendPerShare }),
    };
  });
};

const generateInitialAITraders = (): AITrader[] => [
    { id: 'ai-1', name: 'WOLF-1', strategy: 'MOMENTUM', cash: 2000000, portfolio: {}, riskFactor: 0.25, cooldown: 0 },
    { id: 'ai-2', name: 'OWL-2', strategy: 'VALUE', cash: 5000000, portfolio: {}, riskFactor: 0.15, cooldown: 0 },
    { id: 'ai-3', name: 'BEAR-3', strategy: 'CONTRARIAN', cash: 3000000, portfolio: {}, riskFactor: 0.20, cooldown: 0 },
];

const generateStandardNormal = (): number => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const generateStockParameters = () => {
    return STOCK_SYMBOLS.reduce((acc, symbol) => {
        acc[symbol] = {
            mu: (Math.random() * 0.20) - 0.05, // Annual drift
            sigma: (Math.random() * 0.35) + 0.15, // Annual volatility
        };
        return acc;
    }, {} as Record<string, { mu: number; sigma: number }>);
};

// Define stock correlations (pairs and correlation coefficient rho)
const correlations: { pair: [string, string]; rho: number }[] = [
  { pair: ['MEGA', 'BYTE'], rho: -0.65 }, // Competitors
  { pair: ['AI', 'DATA'], rho: 0.75 },   // Ecosystem partners
  { pair: ['CORE', 'GRID'], rho: 0.6 },  // Infrastructure partners
  { pair: ['NANO', 'PXL'], rho: 0.5 },   // Hardware components
  { pair: ['FLUX', 'VRTX'], rho: 0.55 }, // Related software tech
  { pair: ['CYBR', 'TRON'], rho: -0.4 }, // Competitors
];

const stockEventTemplates = [
  { title: '{symbol}, 획기적 신기술 발표로 주가 급등', impact: 1.15 + (Math.random() * 0.1) }, // 15-25% up
  { title: '{symbol}, 경쟁사 대비 압도적인 분기 실적 공개', impact: 1.10 + (Math.random() * 0.08) }, // 10-18% up
  { title: '정부, {symbol} 소속 산업 육성 정책 발표', impact: 1.12 + (Math.random() * 0.05) }, // 12-17% up
  { title: '{symbol}, 치명적인 보안 결함 발견, 신뢰도 하락', impact: 0.85 - (Math.random() * 0.1) }, // 15-25% down
  { title: '{symbol}의 CEO, 갑작스러운 사임 발표', impact: 0.92 - (Math.random() * 0.07) }, // 8-15% down
  { title: '{symbol}, 대규모 데이터 유출 사고 발생', impact: 0.88 - (Math.random() * 0.1) }, // 12-22% down
  { title: '{symbol}, 시장 예상치를 뛰어넘는 혁신 제품 공개', impact: 1.20 + (Math.random() * 0.1) }, // 20-30% up
  { title: '{symbol} 인수합병 루머 확산', impact: 1.08 + (Math.random() * 0.05) }, // 8-13% up
  { title: '경쟁사 {competitor}의 부진으로 {symbol} 반사 이익 기대', impact: 1.05 + (Math.random() * 0.05) }, // 5-10% up
  { title: '{symbol}, 핵심 기술 특허 소송에서 패소', impact: 0.80 - (Math.random() * 0.1) }, // 20-30% down
];

const financialEventTemplates = [
  { title: '{symbol}, 혁신적인 비용 절감으로 수익성 개선 발표', impact: 1.05, financialsChange: { epsFactor: 1.15, revenueFactor: 1.02 } },
  { title: '{symbol}, 주요 계약 체결로 향후 매출 증대 기대', impact: 1.08, financialsChange: { revenueFactor: 1.20, epsFactor: 1.10 } },
  { title: '{symbol}, 원자재 가격 상승으로 수익성 악화 경고', impact: 0.95, financialsChange: { epsFactor: 0.85 } },
  { title: '{symbol}, 신제품 라인업, 시장에서 외면받으며 매출 전망 하향', impact: 0.92, financialsChange: { revenueFactor: 0.80, epsFactor: 0.75 } },
];

const sectorEventTemplates = [
    { title: '{sector} 섹터, 규제 완화 소식에 전반적 강세', impact: 1.08 + (Math.random() * 0.05) }, // 8-13% up
    { title: '차세대 기술 표준으로 {sector} 섹터 기술 채택', impact: 1.12 + (Math.random() * 0.08) }, // 12-20% up
    { title: '{sector} 섹터, 정부의 대규모 투자 계획 발표', impact: 1.15 + (Math.random() * 0.1) }, // 15-25% up
    { title: '{sector} 섹터에 대한 비관적 전망 보고서 발표', impact: 0.93 - (Math.random() * 0.06) }, // 7-13% down
    { title: '핵심 원자재 공급망 문제로 {sector} 섹터 타격', impact: 0.90 - (Math.random() * 0.08) }, // 10-18% down
];

const rateChangeEventTemplates = {
    hike: '중앙은행, 기준 금리 {changebps}bp 인상 발표. 시장 긴축 우려.',
    cut: '중앙은행, 경기 부양 위해 기준 금리 {changebps}bp 인하 결정.',
};

const economicReportTemplate = '경제 지표 발표: 인플레이션 {inflation}%, GDP 성장률 {gdp}%, 실업률 {unemployment}%';

const INITIAL_INTEREST_RATE = 0.025; // 2.5%
const INTEREST_RATE_SENSITIVITY = 0.5; // How much drift (mu) is affected by rate changes
const MIN_INTEREST_RATE = 0.0025; // 0.25%
const MAX_INTEREST_RATE = 0.08;   // 8.0%
const MARKET_AVERAGE_PER = 25;
const PER_SENSITIVITY = 0.001;

// NEW ECONOMIC INDICATORS
const INITIAL_INFLATION_RATE = 0.02; // 2%
const INITIAL_GDP_GROWTH = 0.015; // 1.5%
const INITIAL_UNEMPLOYMENT_RATE = 0.045; // 4.5%

const INFLATION_SENSITIVITY = 0.4; // How much drift is affected
const GDP_SENSITIVITY = 0.3;
const UNEMPLOYMENT_SENSITIVITY = 0.2;

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

export const useMockStockData = ({ isPaused, savedData }: { isPaused: boolean, savedData?: SavedGameState | null }) => {
  const [stocks, setStocks] = useState<Stock[]>(() => generateInitialStocks());
  const [aiTraders, setAITraders] = useState<AITrader[]>(() => savedData?.aiTraders ?? generateInitialAITraders());
  const [priceHistory, setPriceHistory] = useState<Record<string, StockPricePoint[]>>({});
  const [interestRate, setInterestRate] = useState(INITIAL_INTEREST_RATE);
  const [inflationRate, setInflationRate] = useState(INITIAL_INFLATION_RATE);
  const [gdpGrowth, setGdpGrowth] = useState(INITIAL_GDP_GROWTH);
  const [unemploymentRate, setUnemploymentRate] = useState(INITIAL_UNEMPLOYMENT_RATE);
  const stockParamsRef = useRef(generateStockParameters());
  const pendingEventRef = useRef<MarketEvent | null>(null);
  const [processedEvent, setProcessedEvent] = useState<MarketEvent | null>(null);
  const [aiTradeLog, setAiTradeLog] = useState<LogMessage | null>(null);
  const historyTimeCounterRef = useRef(0);

  // Combined Market Event Generator
  useEffect(() => {
    if (isPaused) return;

    const eventInterval = setInterval(() => {
        if (pendingEventRef.current) return; // Don't generate if one is already pending

        const eventType = Math.random();

        // 1. Rate Change Event (4% chance)
        if (eventType < 0.04) {
            const changeAmount = 0.0025; // 25 basis points
            const isHike = Math.random() > 0.5;
            let newRate = isHike ? interestRate + changeAmount : interestRate - changeAmount;
            newRate = Math.max(MIN_INTEREST_RATE, Math.min(newRate, MAX_INTEREST_RATE));
            
            if (newRate.toFixed(4) !== interestRate.toFixed(4)) {
                const template = isHike ? rateChangeEventTemplates.hike : rateChangeEventTemplates.cut;
                const title = template.replace('{changebps}', `${changeAmount * 10000}`);
                pendingEventRef.current = { title, newRate, impact: 0 };
            }
        }
        // 2. Economic Report Event (6% chance)
        else if (eventType < 0.10) {
            const inflationChange = (Math.random() - 0.5) * 0.005; // +/- 0.25%
            const gdpChange = (Math.random() - 0.5) * 0.008; // +/- 0.4%
            const unemploymentChange = (Math.random() - 0.5) * 0.006; // +/- 0.3%

            const newInflationRate = Math.max(0.005, Math.min(0.08, inflationRate + inflationChange)); // 0.5% to 8%
            const newGdpGrowth = Math.max(-0.02, Math.min(0.05, gdpGrowth + gdpChange)); // -2% to 5%
            const newUnemploymentRate = Math.max(0.02, Math.min(0.10, unemploymentRate + unemploymentChange)); // 2% to 10%

            const title = economicReportTemplate
                .replace('{inflation}', (newInflationRate * 100).toFixed(2))
                .replace('{gdp}', (newGdpGrowth * 100).toFixed(2))
                .replace('{unemployment}', (newUnemploymentRate * 100).toFixed(2));

            pendingEventRef.current = {
                title,
                impact: 0, // No direct impact, affects drift
                newInflationRate,
                newGdpGrowth,
                newUnemploymentRate,
            };
        }
        // 3. Earnings Report Event (20% chance)
        else if (eventType < 0.30) {
            const stock = stocks[Math.floor(Math.random() * stocks.length)];
            if (!stock) return;

            const expectedEps = stock.financials.earningsPerShare;
            const surprise = (Math.random() * 0.30) - 0.15; // -15% to +15%
            const reportedEps = expectedEps * (1 + surprise);

            let title = '';
            if (surprise > 0.07) {
                title = `${stock.symbol} 어닝 서프라이즈! EPS ${reportedEps.toFixed(2)} (예상 ${expectedEps.toFixed(2)})`;
            } else if (surprise < -0.07) {
                title = `${stock.symbol} 어닝 쇼크. EPS ${reportedEps.toFixed(2)} (예상 ${expectedEps.toFixed(2)})`;
            } else {
                title = `${stock.symbol} 분기 실적 발표. EPS ${reportedEps.toFixed(2)} (예상치 부합)`;
            }

            const impact = 1 + (surprise * 0.6); // A 10% surprise gives a 6% price impact
            
            pendingEventRef.current = {
                symbol: stock.symbol,
                title,
                impact,
                financialsChange: {
                    epsFactor: Math.max(0.1, reportedEps / expectedEps),
                    revenueFactor: Math.max(0.1, 1 + (surprise * 0.8)),
                }
            };
        } 
        // 4. General Stock/Sector/Financial Event (30% chance)
        else if (eventType < 0.60) {
            const eventSubType = Math.random();
            if (eventSubType < 0.2) { // Financial event
                const template = financialEventTemplates[Math.floor(Math.random() * financialEventTemplates.length)];
                const symbol = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)];
                const title = template.title.replace('{symbol}', symbol);
                pendingEventRef.current = { symbol, title, impact: template.impact, financialsChange: template.financialsChange };
            } else if (eventSubType < 0.5) { // Sector event
                const sectorKeys = Object.keys(SECTORS) as (keyof typeof SECTORS)[];
                const randomSectorKey = sectorKeys[Math.floor(Math.random() * sectorKeys.length)];
                const template = sectorEventTemplates[Math.floor(Math.random() * sectorEventTemplates.length)];
                const title = template.title.replace('{sector}', SECTORS[randomSectorKey]);
                pendingEventRef.current = { sector: randomSectorKey, title, impact: template.impact };
            } else { // Stock event
                let template = stockEventTemplates[Math.floor(Math.random() * stockEventTemplates.length)];
                const symbol = STOCK_SYMBOLS[Math.floor(Math.random() * STOCK_SYMBOLS.length)];
                let title = template.title.replace('{symbol}', symbol);

                if (title.includes('{competitor}')) {
                    const competitors = STOCK_SYMBOLS.filter(s => s !== symbol);
                    const competitor = competitors[Math.floor(Math.random() * competitors.length)];
                    title = title.replace('{competitor}', competitor);
                }
                pendingEventRef.current = { symbol, title, impact: template.impact };
            }
        }
    }, 15000); // Check for new event every 15 seconds

    return () => clearInterval(eventInterval);
  }, [isPaused, stocks, interestRate, inflationRate, gdpGrowth, unemploymentRate]);

  // Main stock price update loop
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      historyTimeCounterRef.current += 2;
      const currentTime = `${historyTimeCounterRef.current}s`;
      const eventToApply = pendingEventRef.current;
      
      if (eventToApply) {
        if (eventToApply.newRate !== undefined) {
            setInterestRate(eventToApply.newRate);
        }
        if (eventToApply.newInflationRate !== undefined) {
            setInflationRate(eventToApply.newInflationRate);
        }
        if (eventToApply.newGdpGrowth !== undefined) {
            setGdpGrowth(eventToApply.newGdpGrowth);
        }
        if (eventToApply.newUnemploymentRate !== undefined) {
            setUnemploymentRate(eventToApply.newUnemploymentRate);
        }
      }
      
      const randomValues = new Map<string, number>();
      const processedSymbols = new Set<string>();

      correlations.forEach(({ pair, rho }) => {
        const [symbolA, symbolB] = pair;
        const z1 = generateStandardNormal();
        const z2 = generateStandardNormal();
        const x1 = z1;
        const x2 = rho * z1 + Math.sqrt(1 - rho * rho) * z2;
        randomValues.set(symbolA, x1);
        randomValues.set(symbolB, x2);
        processedSymbols.add(symbolA);
        processedSymbols.add(symbolB);
      });
      
      STOCK_SYMBOLS.forEach(symbol => {
          if (!processedSymbols.has(symbol)) {
              randomValues.set(symbol, generateStandardNormal());
          }
      });
      
      let nextAiTradeLog: LogMessage | null = null;

      const updatedAIs = aiTraders.map(ai => {
        if (ai.cooldown > 0) return { ...ai, cooldown: ai.cooldown - 1 };

        let decision: { action: 'BUY' | 'SELL'; symbol: string } | null = null;
        const sortedStocks = [...stocks].sort((a,b) => b.changePercent - a.changePercent);

        switch (ai.strategy) {
            case 'MOMENTUM':
                const bestPerformer = sortedStocks[0];
                if (bestPerformer.changePercent > 1.0) decision = { action: 'BUY', symbol: bestPerformer.symbol };
                else {
                    const ownStocks = Object.keys(ai.portfolio).filter(s => ai.portfolio[s].quantity > 0);
                    const worstOwned = stocks.filter(s => ownStocks.includes(s.symbol)).sort((a,b) => a.changePercent - b.changePercent)[0];
                    if (worstOwned && worstOwned.changePercent < -1.0) decision = { action: 'SELL', symbol: worstOwned.symbol };
                }
                break;
            case 'VALUE':
                const undervalued = stocks.filter(s => s.per && s.per > 0 && s.per < 15 && s.price < ai.cash * ai.riskFactor).sort((a,b) => a.per! - b.per!)[0];
                if (undervalued) decision = { action: 'BUY', symbol: undervalued.symbol };
                else {
                    const ownStocks = Object.keys(ai.portfolio).filter(s => ai.portfolio[s].quantity > 0);
                    const overvalued = stocks.filter(s => ownStocks.includes(s.symbol) && s.per && s.per > 40)[0];
                    if (overvalued) decision = { action: 'SELL', symbol: overvalued.symbol };
                }
                break;
            case 'CONTRARIAN':
                const worstPerformer = sortedStocks[sortedStocks.length - 1];
                if (worstPerformer.changePercent < -1.5) decision = { action: 'BUY', symbol: worstPerformer.symbol };
                else {
                    const ownStocks = Object.keys(ai.portfolio).filter(s => ai.portfolio[s].quantity > 0);
                    const bestOwned = stocks.filter(s => ownStocks.includes(s.symbol)).sort((a,b) => b.changePercent - a.changePercent)[0];
                    if (bestOwned && bestOwned.changePercent > 1.5) decision = { action: 'SELL', symbol: bestOwned.symbol };
                }
                break;
        }

        if (decision) {
            const stock = stocks.find(s => s.symbol === decision!.symbol)!;
            if (decision.action === 'BUY') {
                const investment = ai.cash * ai.riskFactor;
                const quantity = Math.floor(investment / stock.price);
                if (quantity > 0) {
                    ai.cash -= quantity * stock.price;
                    const portfolioItem = ai.portfolio[stock.symbol] || { quantity: 0, averagePrice: 0 };
                    portfolioItem.quantity += quantity;
                    ai.portfolio[stock.symbol] = portfolioItem;
                    nextAiTradeLog = { time: getCurrentTime(), msg: `[AI: ${ai.name}] ${stock.symbol} ${quantity}주 매수`, status: 'AI 거래'};
                    ai.cooldown = Math.floor(Math.random() * 5) + 3;
                }
            } else { // SELL
                const portfolioItem = ai.portfolio[stock.symbol];
                if (portfolioItem && portfolioItem.quantity > 0) {
                    const quantity = Math.floor(portfolioItem.quantity * (ai.riskFactor * 2)); // Sell more aggressively
                    if (quantity > 0) {
                        ai.cash += quantity * stock.price;
                        portfolioItem.quantity -= quantity;
                        nextAiTradeLog = { time: getCurrentTime(), msg: `[AI: ${ai.name}] ${stock.symbol} ${quantity}주 매도`, status: 'AI 거래'};
                        ai.cooldown = Math.floor(Math.random() * 5) + 3;
                    }
                }
            }
        }
        return ai;
      });
      
      setAITraders(updatedAIs);
      if(nextAiTradeLog) {
          setAiTradeLog(nextAiTradeLog);
      }

      const newStocksData: { stock: Stock, tickVolume: number }[] = [];

      setStocks(prevStocks => {
        const newStocks = prevStocks.map(stock => {
          const params = stockParamsRef.current[stock.symbol];
          const dt = 1 / 252; // Time step (1 trading day)
          const Z = randomValues.get(stock.symbol)!; 
          const { mu, sigma } = params;
          
          const per_adjustment = stock.per && stock.per > 0 ? (MARKET_AVERAGE_PER - stock.per) * PER_SENSITIVITY : 0;
          
          const interest_rate_effect = (interestRate - INITIAL_INTEREST_RATE) * INTEREST_RATE_SENSITIVITY;
          const inflation_effect = (inflationRate - INITIAL_INFLATION_RATE) * INFLATION_SENSITIVITY;
          const gdp_effect = (gdpGrowth - INITIAL_GDP_GROWTH) * GDP_SENSITIVITY;
          const unemployment_effect = (unemploymentRate - INITIAL_UNEMPLOYMENT_RATE) * UNEMPLOYMENT_SENSITIVITY;

          const adjustedMu = mu - interest_rate_effect - inflation_effect + gdp_effect - unemployment_effect + per_adjustment;

          let newPrice = stock.price * Math.exp((adjustedMu - (sigma ** 2) / 2) * dt + sigma * Math.sqrt(dt) * Z);
          let newFinancials = { ...stock.financials };
          
          if (eventToApply) {
              const applyToStock = (eventToApply.symbol && stock.symbol === eventToApply.symbol) || (eventToApply.sector && stock.sector === eventToApply.sector);
              if (applyToStock) {
                  newPrice *= eventToApply.impact;
                  if (eventToApply.financialsChange) {
                      newFinancials.earningsPerShare *= eventToApply.financialsChange.epsFactor || 1;
                      newFinancials.revenue *= eventToApply.financialsChange.revenueFactor || 1;
                  }
              }
          }
          
          let volumeChange = Math.floor(Math.random() * 10000);
          if(nextAiTradeLog && nextAiTradeLog.msg.includes(stock.symbol)) {
              const parts = nextAiTradeLog.msg.split(' ');
              const quantity = parseInt(parts[parts.length - 2]);
              volumeChange += quantity;
              newPrice *= (nextAiTradeLog.msg.includes('매수') ? 1.0002 : 0.9998);
          }

          const marketCap = newPrice * newFinancials.totalShares;
          const per = newFinancials.earningsPerShare > 0 ? newPrice / newFinancials.earningsPerShare : 0;
          const change = newPrice - stock.previousPrice;
          const changePercent = (change / stock.previousPrice) * 100;
          const newVolume = stock.volume + volumeChange;

          const updatedStock = {
            ...stock,
            price: Math.max(newPrice, 0.01),
            change,
            changePercent,
            volume: newVolume,
            financials: newFinancials,
            marketCap,
            per,
          };
          
          newStocksData.push({ stock: updatedStock, tickVolume: volumeChange });
          return updatedStock;
        });

        setPriceHistory(prevHistory => {
            const newHistory = { ...prevHistory };
            newStocksData.forEach(({stock, tickVolume}) => {
                const newPoint = { time: currentTime, price: stock.price, volume: tickVolume };
                const stockHistory = newHistory[stock.symbol] ? [...newHistory[stock.symbol], newPoint] : [newPoint];
                newHistory[stock.symbol] = stockHistory.slice(-100);
            });
            return newHistory;
        });

        return newStocks;
      });
      
      if (eventToApply) {
        setProcessedEvent(eventToApply);
        pendingEventRef.current = null;
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused, interestRate, aiTraders, inflationRate, gdpGrowth, unemploymentRate]);

  return { stocks, aiTraders, processedEvent, aiTradeLog, priceHistory, interestRate, inflationRate, gdpGrowth, unemploymentRate };
};