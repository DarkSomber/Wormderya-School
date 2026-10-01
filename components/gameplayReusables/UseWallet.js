import { useState, useCallback, useMemo, useRef, useEffect } from 'react';

const DISCOUNT_FACTOR = 0.5;
const INFLATE_FACTOR = 1.5;

export const CURRENCY_PER_WORD = 5;

export function formatCurrency(amount) {
  const whole = Math.max(0, Math.floor(Number(amount) || 0));
  return String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * useWallet(initialCurrency, { initialState, onChange })
 * - initialState: { currency, priceStates } loaded from save
 * - onChange(snapshot): fired after any change; App persists it
 */
export function useWallet(initialCurrency = 0, { initialState, onChange } = {}) {
  const [currency, setCurrency] = useState(
    initialState?.currency ?? initialCurrency
  );
  const [priceStates, setPriceStates] = useState(initialState?.priceStates ?? {});

  // Snapshot refs so onChange always sees latest without re-subscribing.
  const snapRef = useRef({ currency, priceStates });
  snapRef.current = { currency, priceStates };

  const notify = useCallback(() => {
    if (!onChange) return;
    const { currency: c, priceStates: p } = snapRef.current;
    onChange({ currency: c, priceStates: p });
  }, [onChange]);

  // Fire only on real value changes.
  useEffect(() => {
    notify();
  }, [currency, priceStates, notify]);

  const addCurrency = useCallback((amount) => {
    if (!(amount > 0)) return;
    setCurrency((prev) => prev + amount);
  }, []);

  const getEffectivePrice = useCallback(
    (itemId, basePrice) => {
      const state = priceStates[itemId];
      if (state === 'discount') return Math.round(basePrice * DISCOUNT_FACTOR);
      if (state === 'inflated') return Math.round(basePrice * INFLATE_FACTOR);
      return basePrice;
    },
    [priceStates]
  );

  const canAfford = useCallback(
    (itemId, basePrice) => currency >= getEffectivePrice(itemId, basePrice),
    [currency, getEffectivePrice]
  );

  const buyItem = useCallback(
    (itemId, basePrice, allItemIds) => {
      const price = getEffectivePrice(itemId, basePrice);
      if (currency < price) return { success: false, outcome: 'insufficient' };

      setCurrency((prev) => prev - price);
      setPriceStates((prev) => {
        const next = { ...prev, [itemId]: undefined };
        const others = allItemIds.filter((id) => id !== itemId);
        const lucky = others[Math.floor(Math.random() * others.length)];
        if (lucky) next[lucky] = 'discount';
        return next;
      });

      return { success: true, outcome: 'discount' };
    },
    [currency, getEffectivePrice]
  );

  const declineOffer = useCallback((allItemIds) => {
    const target = allItemIds[Math.floor(Math.random() * allItemIds.length)];
    setPriceStates((prev) => ({ ...prev, [target]: 'inflated' }));
    return { outcome: 'inflate' };
  }, []);

  return useMemo(
    () => ({
      currency,
      addCurrency,
      getEffectivePrice,
      canAfford,
      buyItem,
      declineOffer,
    }),
    [currency, addCurrency, getEffectivePrice, canAfford, buyItem, declineOffer]
  );
}