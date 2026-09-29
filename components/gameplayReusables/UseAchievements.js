import { useState, useCallback, useRef, useMemo } from 'react';

/**
 * useAchievements(wallet)
 * ------------------------
 * Owns which achievements have already been earned, and what's
 * currently queued up to show as a popup. Takes `wallet` directly
 * (same pattern as useScoreSystem taking onCurrencyEarned) so unlocking
 * an achievement can hand out its coin reward via wallet.addCurrency —
 * addCurrency already guards against non-positive amounts, so nothing
 * extra is needed here.
 *
 * Instantiate ONCE in App.js, right next to useWallet — same reasoning:
 * GameplayScreen/StoreScreen remount or switch away regularly, which
 * would wipe out which achievements had already been earned if this
 * lived inside either of them instead.
 *
 * `queue` (rather than a single flag) exists so if two achievements
 * unlock in the same moment, the player sees them one at a time instead
 * of the second silently overwriting the first.
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
  // the same tick. This ref always has the latest set to check against.
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