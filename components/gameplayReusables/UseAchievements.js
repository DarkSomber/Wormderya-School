import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * Checks achievements already completed.
 * unlocking an achievement can hand out its coin reward via wallet.addCurrency.
 *
 * Instantiate ONCE in App.js to not lose progress
 *
 * `queue` Checks two achievements going together
 *
 * Returned API:
 *   unlockedIds               Set of achievement ids already earned
 *   currentAchievement        the achievement object currently shown as
 *                             a popup, or null if none is up
 *   unlockAchievement(ach)    call when a condition is met; no-ops if
 *                             that achievement id was already earned
 *   dismissAchievement()      call when the popup's button is pressed
 */
export function useAchievements(wallet) {
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [queue, setQueue] = useState([]);

  // setUnlockedIds is async, so reading `unlockedIds` directly inside
  // unlockAchievement could see a stale value if two unlocks land in
  // the same tick. Ref checks latest.
  const unlockedRef = useRef(unlockedIds);
  unlockedRef.current = unlockedIds;

  const unlockAchievement = useCallback((achievement) => {
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
  }, [wallet]);

  const dismissAchievement = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return useMemo(() => ({
    unlockedIds,
    currentAchievement: queue[0] ?? null,
    unlockAchievement,
    dismissAchievement,
  }), [unlockedIds, queue, unlockAchievement, dismissAchievement]);
}