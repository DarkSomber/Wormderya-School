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

      // Mark immediately so a duplicate call before re-render can't re-award.
      unlockedRef.current = new Set(unlockedRef.current).add(achievement.id);
      setUnlockedIds(unlockedRef.current);
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