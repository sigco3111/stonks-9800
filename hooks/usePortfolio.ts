import { useState, useCallback, useEffect } from 'react';
import { STOCK_SYMBOLS } from '../constants';
import { PortfolioItem, PortfolioBond, SavedGameState } from '../types';

const INITIAL_CASH = 100000;
const SAVE_GAME_KEY = 'stonks9800_save';

const initialPortfolio = STOCK_SYMBOLS.reduce((acc, symbol) => {
  acc[symbol] = { quantity: 0, averagePrice: 0, shortQuantity: 0, averageShortPrice: 0 };
  return acc;
}, {} as Record<string, PortfolioItem>);

export const usePortfolio = (initialState?: SavedGameState) => {
  const [cash, setCash] = useState(initialState?.cash ?? INITIAL_CASH);
  const [portfolio, setPortfolio] = useState<Record<string, PortfolioItem>>(initialState?.portfolio ?? initialPortfolio);
  const [bonds, setBonds] = useState<PortfolioBond[]>(initialState?.bonds ?? []);

  // 포트폴리오 상태가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    const saveCurrentData = () => {
      try {
        // 기존 저장된 데이터 불러오기
        const savedData = JSON.parse(localStorage.getItem(SAVE_GAME_KEY) || 'null') as SavedGameState | null;
        
        // 새로운 저장 데이터 생성
        const updatedData = {
          ...(savedData || {}),
          cash,
          portfolio,
          bonds
        } as SavedGameState;
        
        localStorage.setItem(SAVE_GAME_KEY, JSON.stringify(updatedData));
      } catch (error) {
        console.error('포트폴리오 데이터 저장 중 오류 발생:', error);
      }
    };
    
    // 데이터가 초기화된 상태가 아닐 때만 저장 (앱 시작 시점은 제외)
    if (cash !== INITIAL_CASH || 
        Object.values(portfolio).some((item: any) => 
          item.quantity > 0 || item.shortQuantity > 0
        ) || 
        bonds.length > 0) {
      saveCurrentData();
    }
  }, [cash, portfolio, bonds]);

  const addCash = useCallback((amount: number) => {
    if (amount > 0) {
        setCash(prev => prev + amount);
    }
  }, []);

  const buyStock = useCallback((symbol: string, quantity: number, price: number): boolean => {
    const cost = quantity * price;
    if (cash >= cost && quantity > 0) {
      setCash(prev => prev - cost);
      setPortfolio(prev => {
        const existing = prev[symbol];
        const newQuantity = existing.quantity + quantity;
        const newAveragePrice = ((existing.averagePrice * existing.quantity) + (price * quantity)) / newQuantity;

        return {
          ...prev,
          [symbol]: { ...existing, quantity: newQuantity, averagePrice: newAveragePrice },
        };
      });
      return true;
    }
    return false;
  }, [cash]);

  const sellStock = useCallback((symbol: string, quantity: number, price: number): boolean => {
    const existing = portfolio[symbol];
    if (existing?.quantity >= quantity && quantity > 0) {
      const revenue = quantity * price;
      setCash(prev => prev + revenue);
      setPortfolio(prev => {
          const newQuantity = existing.quantity - quantity;
          const newAveragePrice = newQuantity > 0 ? existing.averagePrice : 0;
          return { ...prev, [symbol]: { ...existing, quantity: newQuantity, averagePrice: newAveragePrice } };
      });
      return true;
    }
    return false;
  }, [portfolio]);

  const shortStock = useCallback((symbol: string, quantity: number, price: number): boolean => {
      if (quantity <= 0) return false;
      
      const revenue = quantity * price;
      setCash(prev => prev + revenue);
      setPortfolio(prev => {
          const existing = prev[symbol];
          const newShortQuantity = existing.shortQuantity + quantity;
          const newAverageShortPrice = ((existing.averageShortPrice * existing.shortQuantity) + (price * quantity)) / newShortQuantity;
          return { ...prev, [symbol]: { ...existing, shortQuantity: newShortQuantity, averageShortPrice: newAverageShortPrice }};
      });
      return true;
  }, []);

  const coverStock = useCallback((symbol: string, quantity: number, price: number): boolean => {
      const cost = quantity * price;
      const existing = portfolio[symbol];

      if (cash >= cost && existing?.shortQuantity >= quantity && quantity > 0) {
          setCash(prev => prev - cost);
          setPortfolio(prev => {
              const newShortQuantity = existing.shortQuantity - quantity;
              const newAverageShortPrice = newShortQuantity > 0 ? existing.averageShortPrice : 0;
              return { ...prev, [symbol]: { ...existing, shortQuantity: newShortQuantity, averageShortPrice: newAverageShortPrice } };
          });
          return true;
      }
      return false;
  }, [cash, portfolio]);

  const buyBond = useCallback((bondId: string, quantity: number, price: number, purchaseTime: number): boolean => {
    const cost = quantity * price;
    if (cash >= cost && quantity > 0) {
        setCash(prev => prev - cost);
        setBonds(prev => {
            const newBond: PortfolioBond = {
                instanceId: `bond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                bondId,
                quantity,
                purchasePrice: price,
                purchaseTime,
            };
            return [...prev, newBond];
        });
        return true;
    }
    return false;
  }, [cash]);

  const sellBond = useCallback((bondId: string, quantityToSell: number, price: number): boolean => {
    const holdingsOfBond = bonds.filter(b => b.bondId === bondId);
    const totalQuantity = holdingsOfBond.reduce((sum, b) => sum + b.quantity, 0);

    if (quantityToSell <= 0 || quantityToSell > totalQuantity) {
        return false;
    }

    const revenue = quantityToSell * price;
    setCash(prev => prev + revenue);

    // Sort by purchase time to sell oldest first (FIFO)
    holdingsOfBond.sort((a, b) => a.purchaseTime - b.purchaseTime);

    let remainingToSell = quantityToSell;
    const updatedHoldingsForBond = [];
    const unaffectedHoldings = bonds.filter(b => b.bondId !== bondId);
    
    for (const holding of holdingsOfBond) {
        if (remainingToSell <= 0) {
            updatedHoldingsForBond.push(holding);
            continue;
        }

        if (holding.quantity <= remainingToSell) {
            // Sell this entire holding
            remainingToSell -= holding.quantity;
        } else {
            // Sell part of this holding
            updatedHoldingsForBond.push({ ...holding, quantity: holding.quantity - remainingToSell });
            remainingToSell = 0;
        }
    }
    
    setBonds([...unaffectedHoldings, ...updatedHoldingsForBond]);
    return true;
  }, [bonds]);

  const redeemMaturedBonds = useCallback((instanceIds: string[], totalPayout: number) => {
    setBonds(prev => prev.filter(b => !instanceIds.includes(b.instanceId)));
    addCash(totalPayout);
  }, [addCash]);

  return { cash, portfolio, bonds, buyStock, sellStock, shortStock, coverStock, addCash, buyBond, sellBond, redeemMaturedBonds };
};