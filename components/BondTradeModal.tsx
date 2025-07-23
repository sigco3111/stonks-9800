import React, { useState, useMemo, useEffect } from 'react';
import { Bond, PortfolioBond, LogMessage } from '../types';
import TerminalWindow from './TerminalWindow';

interface BondTradeModalProps {
    bond: Bond;
    currentPrice: number;
    cash: number;
    portfolioBonds: PortfolioBond[];
    onBuy: (bondId: string, quantity: number, price: number) => boolean;
    onSell: (bondId: string, quantity: number, price: number) => boolean;
    onClose: () => void;
    addLog: (msg: string, status: LogMessage['status']) => void;
}

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

const BondTradeModal: React.FC<BondTradeModalProps> = ({ bond, currentPrice, cash, portfolioBonds, onBuy, onSell, onClose, addLog }) => {
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState(0);

    const ownedQuantity = useMemo(() => {
        return portfolioBonds.reduce((sum, b) => sum + b.quantity, 0);
    }, [portfolioBonds]);

    const maxQuantity = useMemo(() => {
        if (tradeType === 'BUY') {
            if (currentPrice <= 0) return 0;
            return Math.floor(cash / currentPrice);
        } else { // SELL
            return ownedQuantity;
        }
    }, [tradeType, cash, currentPrice, ownedQuantity]);
    
    useEffect(() => {
        setQuantity(0);
    }, [tradeType]);

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

        let success = false;
        let logMsg = '';
        let logStatus: LogMessage['status'] = '거래';

        if (tradeType === 'BUY') {
            if (success = onBuy(bond.id, quantity, currentPrice)) {
                logMsg = `채권 매수: ${bond.name} ${quantity}개 @ $${currentPrice.toFixed(2)}`;
            } else {
                logMsg = '채권 매수 실패: 잔액 부족';
                logStatus = '경고';
            }
        } else { // SELL
            if (success = onSell(bond.id, quantity, currentPrice)) {
                logMsg = `채권 매도: ${bond.name} ${quantity}개 @ $${currentPrice.toFixed(2)}`;
            } else {
                logMsg = '채권 매도 실패: 보유 수량 부족';
                logStatus = '경고';
            }
        }
        
        addLog(logMsg, logStatus);
        if (success) onClose();
    };

    const totalCost = (quantity * currentPrice).toFixed(2);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 crt-scanlines" role="dialog" aria-modal="true" aria-labelledby="bond-trade-modal-title">
          <TerminalWindow title={`채권 거래 터미널: ${bond.name}`} className="w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
                <h2 id="bond-trade-modal-title" className="text-xl">{bond.name} 현재가: <span className="text-yellow-400">${currentPrice.toFixed(2)}</span></h2>
                <button onClick={onClose} className="text-red-500 text-glow font-bold text-2xl px-2 hover:bg-red-500/20" aria-label="Close bond trading window">X</button>
            </div>
            
            <div className="grid grid-cols-3 gap-2 my-4 text-center">
                <div><p>보유 현금</p><p className="text-green-400 text-glow text-lg">${cash.toFixed(2)}</p></div>
                <div><p>보유 채권</p><p className="text-cyan-400 text-glow text-lg">{ownedQuantity} 개</p></div>
                <div><p>표면 이율(연)</p><p className="text-purple-400 text-glow text-lg">{(bond.interestRate * 100).toFixed(2)}%</p></div>
            </div>
            
            <div className="flex justify-center border-2 border-green-500/50">
                <button onClick={() => setTradeType('BUY')} className={`w-1/2 p-2 text-2xl ${tradeType === 'BUY' ? 'bg-green-500 text-black font-bold' : 'hover:bg-green-500/20'}`}>매수</button>
                <button onClick={() => setTradeType('SELL')} className={`w-1/2 p-2 text-2xl ${tradeType === 'SELL' ? 'bg-red-500 text-black font-bold' : 'hover:bg-red-500/20'}`}>매도</button>
            </div>

            <div className="text-center p-4 border-x border-b border-green-800/50">
                <p className="mb-2 text-xl">수량 (최대: {maxQuantity})</p>
                <QuantityControl quantity={quantity} setQuantity={setQuantity} max={maxQuantity} />
                <p className="mt-4 text-xl">예상 금액: <span className="text-yellow-400 text-glow">${totalCost}</span></p>
            </div>

            <div className="mt-6 flex justify-center gap-4">
                <button 
                    onClick={handleConfirm}
                    disabled={quantity <= 0}
                    className="w-52 p-3 text-2xl font-bold border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-black disabled:border-gray-600 disabled:text-gray-600 disabled:bg-transparent disabled:cursor-not-allowed"
                >
                    주문 확인
                </button>
            </div>
          </TerminalWindow>
        </div>
    )
}

export default BondTradeModal;
