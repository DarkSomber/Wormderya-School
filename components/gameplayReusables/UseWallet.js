import { useState, useCallback, useMemo } from 'react';

const DISCOUNT_FACTOR = 0.5;
const INFLATE_FACTOR = 1.5;

// Currency per correctly-served word — kept FLAT and separate from
// score/scoreMultiplier on purpose, so the shop's economy doesn't shift
// every time a level's multiplier changes. Tuned against the Store's
// static prices (10 / 20 / 50): ~2 words for the cheapest item, ~4 for
// the middle one, ~10 for the priciest — was 1 word for all three
// before, since currency used to just mirror the flat +50/word score.
export const CURRENCY_PER_WORD = 5;

/**
 * useWallet(initialCurrency)
 * ----------------------------
 * Owns currency + each shop item's discount/inflate price state.
 * Instantiate ONCE in App.js (not inside GameplayScreen/StoreScreen —
 * both of those remount/switch away regularly, which would wipe
 * currency and the discount/inflate marks that are meant to persist
 * between visits).
 *
 * Doesn't know what the items ARE — StoreScreen passes in itemId +
 * basePrice per call, so this stays reusable without needing its own
 * copy of the item list.
 *
 * Returned API:
 *   currency                              live coin balance
 *   addCurrency(amount)                   called from useScoreSystem's onCurrencyEarned
 *   getEffectivePrice(itemId, basePrice)  basePrice adjusted for that item's discount/inflate state
 *   canAfford(itemId, basePrice)
 *   buyItem(itemId, basePrice, allItemIds)      -> { success, outcome: 'discount' | 'insufficient' }
 *   declineOffer(allItemIds)                    -> { outcome: 'inflate' }
 */
export function useWallet(initialCurrency = 0) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [priceStates, setPriceStates] = useState({}); // itemId -> 'discount' | 'inflated'

  const addCurrency = useCallback((amount) => {
    setCurrency((prev) => prev + amount);
  }, []);

  const getEffectivePrice = useCallback((itemId, basePrice) => {
    const state = priceStates[itemId];
    if (state === 'discount') return Math.round(basePrice * DISCOUNT_FACTOR);
    if (state === 'inflated') return Math.round(basePrice * INFLATE_FACTOR);
    return basePrice;
  }, [priceStates]);

  const canAfford = useCallback(
    (itemId, basePrice) => currency >= getEffectivePrice(itemId, basePrice),
    [currency, getEffectivePrice]
  );

  // Buying: pay the effective price, clear this item's own price state
  // (its discount, if any, is used up), then mark a DIFFERENT random
  // item on discount for next visit.
  const buyItem = useCallback((itemId, basePrice, allItemIds) => {
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
  }, [currency, getEffectivePrice]);

  // Declining: mark a random item price-increased for next visit.
  const declineOffer = useCallback((allItemIds) => {
    const target = allItemIds[Math.floor(Math.random() * allItemIds.length)];
    setPriceStates((prev) => ({ ...prev, [target]: 'inflated' }));
    return { outcome: 'inflate' };
  }, []);

  return useMemo(() => ({
    currency,
    addCurrency,
    getEffectivePrice,
    canAfford,
    buyItem,
    declineOffer,
  }), [currency, addCurrency, getEffectivePrice, canAfford, buyItem, declineOffer]);
}