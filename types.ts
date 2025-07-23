export interface Stock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  previousPrice: number;
  sector: string;
  dividendPerShare?: number;
  financials: Financials;
  marketCap?: number;
  per?: number;
}

export interface Financials {
  revenue: number; // annual
  earningsPerShare: number;
  totalShares: number;
}

export interface PortfolioData {
  time: string;
  value: number;
}

export interface LogMessage {
  time: string;
  msg: string;
  status: '정상' | '경고' | '정보' | '거래' | '주문' | '이벤트' | 'AI 거래';
}

export interface PortfolioItem {
  quantity: number;
  averagePrice: number;
  shortQuantity: number;
  averageShortPrice: number;
}

export type OrderAction = 'BUY_LONG' | 'SELL_LONG' | 'SELL_SHORT' | 'BUY_COVER';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'FAILED';

export interface ConditionalOrder {
  id: string;
  symbol: string;
  action: OrderAction;
  quantity: number;
  triggerPrice: number;
  status: OrderStatus;
  createdAt: string;
}

export interface MarketEvent {
  title: string;
  impact: number;
  symbol?: string;
  sector?: string;
  newRate?: number;
  financialsChange?: {
    revenueFactor?: number;
    epsFactor?: number;
  };
  newInflationRate?: number;
  newGdpGrowth?: number;
  newUnemploymentRate?: number;
}

export interface Bond {
  id: string;
  name: string;
  interestRate: number; // annual coupon rate
  maturityInSeconds: number; // game time seconds until maturity
  price: number; // par value
}

export interface PortfolioBond {
  instanceId: string; // unique id for this specific purchase
  bondId: string;
  quantity: number;
  purchaseTime: number; // game time in seconds
  purchasePrice: number;
}

export interface SavedGameState {
  cash: number;
  portfolio: Record<string, PortfolioItem>;
  orders: ConditionalOrder[];
  bonds: PortfolioBond[];
  aiTraders?: AITrader[];
  isTextGlowEnabled?: boolean;
}

export interface StockPricePoint {
  time: string;
  price: number;
  volume: number;
}

export interface AITrader {
  id: string;
  name: string;
  strategy: 'MOMENTUM' | 'VALUE' | 'CONTRARIAN';
  cash: number;
  portfolio: Record<string, { quantity: number; averagePrice: number }>;
  riskFactor: number; // How much of their cash to use per trade (e.g., 0.1 for 10%)
  cooldown: number; // Ticks until next trade
}