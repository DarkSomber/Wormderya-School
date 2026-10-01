import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

export const UPGRADES = {
  TEKA_LANG: {
    id: 'teka-lang',
    name: 'Teka lang po!',
    description: 'Customers wait ~10s longer before losing patience.',
    price: 20,
    type: 'temporary',
    durationMs: 10000,
    patienceDrainMultiplier: 0.5,
  },
  DOBLENG_MAHAL: {
    id: 'dobleng-mahal',
    name: 'Dobleng Mahal, Dobleng Hirap',
    description: 'Double rewards, double patience drain.',
    price: 35,
    type: 'temporary',
    durationMs: 15000,
    rewardMultiplier: 2,
    patienceDrainMultiplier: 2,
  },
  EXTRA_HEALTH: {
    id: 'extra-health',
    name: 'Extra Health',
    description: 'One extra customer can leave before you lose.',
    price: 30,
    type: 'consumable',
    healthBonus: 1,
  },
  YOLO: {
    id: 'yolo',
    name: 'YOLO nalang G!',
    description: 'Permanent 2.5x rewards, 1.5x patience drain.',
    price: 100,
    type: 'permanent',
    rewardMultiplier: 2.5,
    patienceDrainMultiplier: 1.5,
  },
};

export const UPGRADE_LIST = Object.values(UPGRADES);

/**
 * useUpgrades(wallet, { initialState, onChange })
 *
 * - initialState: { owned: [ids], consumables: { id: count } } from save
 * - onChange(snapshot): App persists owned + consumables only
 *
 * Temporary power-ups bought in the Store are QUEUED for the next round.
 * They activate when the round actually starts (GameplayScreen calls
 * startNewRound on mount). This matches the Store-flow: buy -> next
 * round begins -> effect fires for its full duration.
 */
export function useUpgrades(wallet, { initialState, onChange } = {}) {
  const [ownedPermanent, setOwnedPermanent] = useState(
    () => new Set(initialState?.owned ?? [])
  );
  // Temporary upgrade ids waiting to activate on the next round start.
  const [queuedTemporary, setQueuedTemporary] = useState([]);
  // Currently-running temporaries: { [id]: { expiresAt } }.
  const [activeTemporary, setActiveTemporary] = useState({});
  const [consumables, setConsumables] = useState(initialState?.consumables ?? {});

  // Tick so the HUD / multipliers re-evaluate as timers expire.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasTimed = Object.values(activeTemporary).some(
      (e) => e.expiresAt !== null && e.expiresAt !== undefined
    );
    if (!hasTimed) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [activeTemporary]);

  // Persist only permanent + consumable state. Temporary state is round-local.
  const notify = useCallback(() => {
    if (!onChange) return;
    onChange({
      owned: Array.from(ownedPermanent),
      consumables: { ...consumables },
    });
  }, [onChange, ownedPermanent, consumables]);

  useEffect(() => {
    notify();
  }, [ownedPermanent, consumables, notify]);

  const buyUpgrade = useCallback(
    (upgrade) => {
      if (!upgrade) return { success: false, reason: 'unknown' };
      if (upgrade.type === 'permanent' && ownedPermanent.has(upgrade.id)) {
        return { success: false, reason: 'owned' };
      }
      if (!wallet.canAfford(upgrade.id, upgrade.price)) {
        return { success: false, reason: 'insufficient' };
      }
      const spend = wallet.buyItem(upgrade.id, upgrade.price, [upgrade.id]);
      if (!spend.success) return { success: false, reason: 'insufficient' };

      if (upgrade.type === 'permanent') {
        setOwnedPermanent((prev) => {
          const next = new Set(prev);
          next.add(upgrade.id);
          return next;
        });
      } else if (upgrade.type === 'temporary') {
        // Queue for the next round. Multiple buys of the same temp
        // are allowed (they'll stack in the queue and just refresh the
        // timer when the round starts — one activation per round).
        setQueuedTemporary((prev) => [...prev, upgrade.id]);
      } else {
        setConsumables((prev) => ({
          ...prev,
          [upgrade.id]: (prev[upgrade.id] || 0) + 1,
        }));
      }
      return { success: true };
    },
    [wallet, ownedPermanent]
  );

  const isActive = useCallback(
    (id) => {
      const e = activeTemporary[id];
      if (!e) return false;
      if (e.expiresAt === null) return true;
      return e.expiresAt > Date.now();
    },
    [activeTemporary]
  );

  // Combined reward multiplier: permanent + currently-active temps.
  const rewardMultiplier = useMemo(() => {
    let m = 1;
    if (ownedPermanent.has(UPGRADES.YOLO.id)) m *= UPGRADES.YOLO.rewardMultiplier;
    if (isActive(UPGRADES.DOBLENG_MAHAL.id)) m *= UPGRADES.DOBLENG_MAHAL.rewardMultiplier;
    return m;
  }, [ownedPermanent, isActive]);

  // Combined patience drain multiplier: permanent + active temps.
  // Teka (<1) slows drain; Dobleng / YOLO (>1) speed it up.
  const patienceDrainMultiplier = useMemo(() => {
    let m = 1;
    if (ownedPermanent.has(UPGRADES.YOLO.id)) m *= UPGRADES.YOLO.patienceDrainMultiplier;
    if (isActive(UPGRADES.DOBLENG_MAHAL.id)) m *= UPGRADES.DOBLENG_MAHAL.patienceDrainMultiplier;
    if (isActive(UPGRADES.TEKA_LANG.id)) m *= UPGRADES.TEKA_LANG.patienceDrainMultiplier;
    return m;
  }, [ownedPermanent, isActive]);

  const extraHealth = consumables[UPGRADES.EXTRA_HEALTH.id] || 0;

  const consumeExtraHealth = useCallback(() => {
    setConsumables((prev) => {
      const have = prev[UPGRADES.EXTRA_HEALTH.id] || 0;
      if (have <= 0) return prev;
      return { ...prev, [UPGRADES.EXTRA_HEALTH.id]: have - 1 };
    });
  }, []);

  /**
   * Called ONCE at the start of each round (GameplayScreen mount).
   * - Drops any already-expired actives.
   * - Activates everything in the queued temporary list with a fresh timer.
   * - Clears the queue so a mid-round re-render never re-triggers it.
   */
  const startNewRound = useCallback(() => {
    const now = Date.now();

    setActiveTemporary((prev) => {
      const next = {};
      // Keep actives that haven't expired yet.
      for (const [k, v] of Object.entries(prev)) {
        if (v.expiresAt !== null && v.expiresAt > now) next[k] = v;
      }
      // Activate queued temps with a fresh timer. Same id re-bought
      // just refreshes the timer — no duplication.
      setQueuedTemporary((queue) => {
        for (const id of queue) {
          const def = UPGRADE_LIST.find((u) => u.id === id);
          if (!def || !def.durationMs) continue;
          next[id] = { expiresAt: now + def.durationMs };
        }
        return [];
      });
      return next;
    });
  }, []);

  // What's currently live — used by the HUD.
  const activeList = useMemo(() => {
    const now = Date.now();
    return Object.entries(activeTemporary)
      .filter(([, v]) => v.expiresAt === null || v.expiresAt > now)
      .map(([id, v]) => {
        const def = UPGRADE_LIST.find((u) => u.id === id);
        const remainingMs = v.expiresAt === null ? null : Math.max(0, v.expiresAt - now);
        return {
          id,
          name: def?.name ?? id,
          remainingMs,
        };
      });
  }, [activeTemporary]);

  return {
    ownedPermanent,
    activeTemporary,
    activeList,
    isActive,
    rewardMultiplier,
    patienceDrainMultiplier,
    extraHealth,
    consumeExtraHealth,
    buyUpgrade,
    startNewRound,
  };
}