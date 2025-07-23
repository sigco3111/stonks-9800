import { Bond } from './types';

export const STOCK_SYMBOLS = [
  'MEGA', 'BYTE', 'NANO', 'CYBR', 'FLUX', 'TRON', 'XENO', 'PXL',
  'ATOM', 'HOLV', 'QBIT', 'VRTX', 'CORE', 'GRID', 'DATA', 'AI'
];

// Sector definitions
export const SECTORS = {
    TECH: '기술',
    HARDWARE: '하드웨어',
    SOFTWARE: '소프트웨어',
    SECURITY: '보안',
    INFRA: '인프라',
    AI: '인공지능',
    BIO: '바이오테크',
};

// Stock to Sector mapping
export const STOCK_SECTORS: Record<string, keyof typeof SECTORS> = {
    'MEGA': 'TECH',
    'BYTE': 'TECH',
    'NANO': 'HARDWARE',
    'CYBR': 'SECURITY',
    'FLUX': 'SOFTWARE',
    'TRON': 'SOFTWARE',
    'XENO': 'BIO',
    'PXL': 'HARDWARE',
    'ATOM': 'HARDWARE',
    'HOLV': 'HARDWARE',
    'QBIT': 'TECH',
    'VRTX': 'SOFTWARE',
    'CORE': 'INFRA',
    'GRID': 'INFRA',
    'DATA': 'AI',
    'AI': 'AI',
};


// Some "blue chip" stocks that pay dividends
export const DIVIDEND_PAYING_STOCKS: Record<string, number> = {
    'MEGA': 0.50,
    'CORE': 0.25,
    'GRID': 0.30,
    'DATA': 0.75,
    'AI': 0.40,
    'VRTX': 0.20,
};

export const AVAILABLE_BONDS: Bond[] = [
    {
        id: 'GOV-2Y',
        name: '정부 단기 채권 (2년 만기)',
        interestRate: 0.03, // 3%
        maturityInSeconds: 120, // 2 minutes game time
        price: 1000,
    },
    {
        id: 'GOV-10Y',
        name: '정부 장기 채권 (10년 만기)',
        interestRate: 0.045, // 4.5%
        maturityInSeconds: 600, // 10 minutes game time
        price: 1000,
    },
    {
        id: 'MEGA-CORP-5Y',
        name: '메가코프 회사채 (5년 만기)',
        interestRate: 0.055, // 5.5%
        maturityInSeconds: 300, // 5 minutes game time
        price: 1000,
    },
    {
        id: 'CYBR-JUNK-3Y',
        name: '사이버 정크 본드 (3년 만기)',
        interestRate: 0.08, // 8% - high risk, high reward
        maturityInSeconds: 180, // 3 minutes game time
        price: 950, // sold at a discount
    }
];
