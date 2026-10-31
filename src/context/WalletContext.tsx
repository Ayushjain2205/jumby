'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface PaymentRequest {
  requestId: string;
  item: string;
  priceCoins: number;
  gameTitle?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface AdRequest {
  requestId: string;
  sponsorName?: string;
  rewardType?: string;
  onReward?: () => void;
  onClose?: () => void;
}

interface WalletContextType {
  coins: number;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  isShopOpen: boolean;
  openShop: () => void;
  closeShop: () => void;
  // In-Game Purchase Sheet
  paymentRequest: PaymentRequest | null;
  requestPayment: (req: PaymentRequest) => void;
  confirmPayment: () => void;
  cancelPayment: () => void;
  // Rewarded Ad Modal
  adRequest: AdRequest | null;
  requestRewardedAd: (req: AdRequest) => void;
  completeAdReward: () => void;
  cancelAd: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState<number>(150);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [adRequest, setAdRequest] = useState<AdRequest | null>(null);

  // Load coins from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jumby_coins');
      if (saved) {
        setCoins(parseInt(saved, 10) || 150);
      }
    }
  }, []);

  const saveCoins = (newAmount: number) => {
    setCoins(newAmount);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jumby_coins', newAmount.toString());
    }
  };

  const addCoins = (amount: number) => {
    saveCoins(coins + amount);
  };

  const spendCoins = (amount: number): boolean => {
    if (coins >= amount) {
      saveCoins(coins - amount);
      return true;
    }
    return false;
  };

  const requestPayment = (req: PaymentRequest) => {
    setPaymentRequest(req);
  };

  const confirmPayment = () => {
    if (!paymentRequest) return;
    if (spendCoins(paymentRequest.priceCoins)) {
      paymentRequest.onSuccess?.();
      setPaymentRequest(null);
    } else {
      setIsShopOpen(true); // Open shop to buy coins if insufficient balance
    }
  };

  const cancelPayment = () => {
    paymentRequest?.onCancel?.();
    setPaymentRequest(null);
  };

  const requestRewardedAd = (req: AdRequest) => {
    setAdRequest(req);
  };

  const completeAdReward = () => {
    adRequest?.onReward?.();
    setAdRequest(null);
  };

  const cancelAd = () => {
    adRequest?.onClose?.();
    setAdRequest(null);
  };

  return (
    <WalletContext.Provider
      value={{
        coins,
        addCoins,
        spendCoins,
        isShopOpen,
        openShop: () => setIsShopOpen(true),
        closeShop: () => setIsShopOpen(false),
        paymentRequest,
        requestPayment,
        confirmPayment,
        cancelPayment,
        adRequest,
        requestRewardedAd,
        completeAdReward,
        cancelAd,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
