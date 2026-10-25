import { useState, useCallback, useRef, useMemo, useEffect } from 'react';

export function useAchievements(wallet, { initialState, onChange } = {}) {
  const [unlockedIds, setUnlockedIds] = useState(
    () => new Set(initialState?.unlocked ?? [])
  );
  const [queue, setQueue] = useState([]);

  const unlockedRef = useRef(unlockedIds);
  unlockedRef.current = unlockedIds;

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