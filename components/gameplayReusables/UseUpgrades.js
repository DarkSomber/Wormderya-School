import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

export const UPGRADES = {
  TEKA_LANG: {
    id: 'teka-lang',
    name: 'Teka lang po!',
    description: 'Customers wait ~10s longer before losing patience.',
    price: 50,
    type: 'temporary',
    durationMs: 45000,
    patienceDrainMultiplier: 0.5,
    icon: require('../../assets/Final/store/Power-Teka_Lang_Po.png'),
  },
  DOBLENG_MAHAL: {
    id: 'dobleng-mahal',
    name: 'Dobleng Mahal, Dobleng Hirap',
    description: 'Double rewards, double patience drain. BUY AT YOUR OWN RISK!',
    price: 150,
    type: 'temporary',
    durationMs: 35000,
    rewardMultiplier: 2,
    patienceDrainMultiplier: 2,
    icon: require('../../assets/Final/store/Power-DMDH.png'),
  },
  EXTRA_HEALTH: {
    id: 'extra-health',
    name: 'Extra Health',
    description: 'One extra chance before you lose.',
    price: 50,
    type: 'consumable',
    healthBonus: 1,
    priceStep: 25, // added to the price for each one already held
    icon: require('../../assets/Final/store/Power-Extra_Health.png'),
  },
  YOLO: {
    id: 'yolo',
    name: 'YOLO nalang G!',
    description: 'Permanent 1.5x rewards, 1.5x patience drain. BUY AT YOUR OWN RISK!',
    price: 150,
    type: 'permanent',
    rewardMultiplier: 1.5,
    patienceDrainMultiplier: 1.5,
    icon: require('../../assets/Final/store/Power-YOLO.png'),
  },
};

export const UPGRADE_LIST = Object.values(UPGRADES);

export function useUpgrades(wallet, { initialState, onChange } = {}) {
  const [ownedPermanent, setOwnedPermanent] = useState(
    () => new Set(initialState?.owned ?? [])
  );

  const [queuedTemporary, setQueuedTemporary] = useState([]);
  const [activeTemporary, setActiveTemporary] = useState({});
  const [consumables, setConsumables] = useState(initialState?.consumables ?? {});

  const [, forceTick] = useState(0);
  useEffect(() => {
    const hasTimed = Object.values(activeTemporary).some(
      (e) => e.expiresAt !== null && e.expiresAt !== undefined
    );
    if (!hasTimed) return undefined;
    const id = setInterval(() => forceTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [activeTemporary]);

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

  // Base price; Extra Health costs more for each one already held (no stockpiling).
  const getBasePrice = useCallback(
    (upgrade) => upgrade.price + (upgrade.priceStep ?? 0) * (consumables[upgrade.id] || 0),
    [consumables]
  );

  const buyUpgrade = useCallback(
    (upgrade, offeredIds = UPGRADE_LIST.map((u) => u.id)) => {
      if (!upgrade) return { success: false, reason: 'unknown' };
      if (upgrade.type === 'permanent' && ownedPermanent.has(upgrade.id)) {
        return { success: false, reason: 'owned' };
      }
      const basePrice = getBasePrice(upgrade);
      if (!wallet.canAfford(upgrade.id, basePrice)) {
        return { success: false, reason: 'insufficient' };
      }
      // The random discount goes to another offered upgrade the player doesn't own.
      const pool = offeredIds.filter((id) => !ownedPermanent.has(id));
      const spend = wallet.buyItem(upgrade.id, basePrice, pool);
      if (!spend.success) return { success: false, reason: 'insufficient' };

      if (upgrade.type === 'permanent') {
        setOwnedPermanent((prev) => {
          const next = new Set(prev);
          next.add(upgrade.id);
          return next;
        });
      } else if (upgrade.type === 'temporary') {
        setQueuedTemporary((prev) => [...prev, upgrade.id]);
      } else {
        setConsumables((prev) => ({
          ...prev,
          [upgrade.id]: (prev[upgrade.id] || 0) + 1,
        }));
      }
      return { success: true };
    },
    [wallet, ownedPermanent, getBasePrice]
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

  const rewardMultiplier = useMemo(() => {
    let m = 1;
    if (ownedPermanent.has(UPGRADES.YOLO.id)) m *= UPGRADES.YOLO.rewardMultiplier;
    if (isActive(UPGRADES.DOBLENG_MAHAL.id)) m *= UPGRADES.DOBLENG_MAHAL.rewardMultiplier;
    return m;
  }, [ownedPermanent, isActive]);

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

  // Mirror of the queue so startNewRound never reads a stale closure.
  const queueRef = useRef([]);
  useEffect(() => {
    queueRef.current = queuedTemporary;
  }, [queuedTemporary]);

  const startNewRound = useCallback(() => {
    const now = Date.now();
    const queue = queueRef.current;
    queueRef.current = [];
    setQueuedTemporary([]);
    setActiveTemporary((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v.expiresAt !== null && v.expiresAt > now) next[k] = v;
      }
      for (const id of queue) {
        const def = UPGRADE_LIST.find((u) => u.id === id);
        if (!def || !def.durationMs) continue;
        next[id] = { expiresAt: now + def.durationMs };
      }
      return next;
    });
  }, []);

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
          expiresAt: v.expiresAt,
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
    getBasePrice,
    startNewRound,
  };
}