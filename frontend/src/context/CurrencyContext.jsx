import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Static demo rates (1 AZN = X currency). In production these could come from
// GET /api/rates or a live FX API - swapping that in later is a one-line change here.
const RATES_TO_AZN = {
  AZN: 1,
  USD: 0.59,
  EUR: 0.54
};

const SYMBOLS = {
  AZN: '₼',
  USD: '$',
  EUR: '€'
};

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => localStorage.getItem('azbaku_currency') || 'AZN');

  const changeCurrency = useCallback((newCurrency) => {
    if (!RATES_TO_AZN[newCurrency]) return;
    setCurrency(newCurrency);
    localStorage.setItem('azbaku_currency', newCurrency);
  }, []);

  // Converts a price stored in AZN (the source of truth in the database) to the selected currency
  const convert = useCallback((priceInAzn) => {
    return +(priceInAzn * RATES_TO_AZN[currency]).toFixed(2);
  }, [currency]);

  const format = useCallback((priceInAzn) => {
    const converted = convert(priceInAzn);
    return `${SYMBOLS[currency]}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }, [convert, currency]);

  const value = useMemo(() => ({
    currency, changeCurrency, convert, format, available: Object.keys(RATES_TO_AZN)
  }), [currency, changeCurrency, convert, format]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider');
  return ctx;
}
