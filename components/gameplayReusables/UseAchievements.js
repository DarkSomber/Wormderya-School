import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

/**
 * useAchievements(wallet, { initialState, onChange })
 * - initialState: { unlocked: [ids] } loaded from save
 * - onChange(snapshot): fired on change; App persists it
 */
export function useAchievements(wallet, { initialState, onChange } = {}) {
  const [unlockedIds, setUnlockedIds] = useState(
    () => new Set(initialState?.unlocked ?? [])
  );
  const [queue, setQueue] = useState([]);

  const unlockedRef = useRef(unlockedIds);
  unlockedRef.current = unlockedIds;

  // Notify with a plain array — Set isn't JSON-safe.
  const notify = useCallback(() => {
    if (!onChange) return;
    onChange({ unlocked: Array.from(unlockedRef.current) });
  }, [onChange]);

  useEffect(() => {
    notify();
  }, [unlockedIds, notify]);

  const unlockAchievement = useCallback(
    (achievement) => {
      if (!achievement || unlockedRef.current.has(achievement.id)) return;

      setUnlockedIds((prev) => {
        const next = new Set(prev);
        next.add(achievement.id);
        return next;
      });
      setQueue((prev) => [...prev, achievement]);

      if (achievement.coinReward) {
        wallet.addCurrency(achievement.coinReward);
      }
    },
    [wallet]
  );

  const dismissAchievement = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return useMemo(
    () => ({
      unlockedIds,
      currentAchievement: queue[0] ?? null,
      unlockAchievement,
      dismissAchievement,
    }),
    [unlockedIds, queue, unlockAchievement, dismissAchievement]
  );
}