import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useLevelMaker(levelConfig)
 * ---------------------------
 * The "Level Maker" — a reusable hook (same pattern as useScoreSystem /
 * useWordInput) that owns level *flow*, not level *rules*. Rules live in
 * LevelConfig; this just walks through them:
 *
 *   - cycles through levelConfig.totalCustomers customers,
 *     levelConfig.wordsPerCustomer correct words each, then declares the
 *     level complete
 *   - rolls levelConfig.rattySpawnRate every levelConfig.rattyCheckIntervalMs
 *     to decide if Mr. Ratty shows up
 *
 * It deliberately does NOT touch scoring or patience directly — those
 * stay owned by useScoreSystem and CustomerMood. GameplayScreen is the
 * thing that reads useLevelMaker's state and decides what to render or
 * call next (e.g. bump CustomerMood's `key` to spawn the next customer).
 *
 * Returned API:
 *   customerIndex            0-based index of the customer currently up
 *   isLevelComplete          true once totalCustomers have all been served
 *   showRattyEvent           true when Mr. Ratty should pop up
 *   registerServedWord()     call once per word useScoreSystem accepted
 *   dismissRattyEvent()      call when the Ratty modal is closed
 */
export function useLevelMaker(levelConfig) {
  const [customerIndex, setCustomerIndex] = useState(0);
  const [wordsServedForCustomer, setWordsServedForCustomer] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showRattyEvent, setShowRattyEvent] = useState(false);

  // Guards against double-firing completion from React 18's dev
  // double-invoke, same pattern CustomerMood uses with hasLeftRef.
  const completeRef = useRef(false);

  const registerServedWord = useCallback(() => {
    if (completeRef.current) return;

    setWordsServedForCustomer((prevCount) => {
      const nextCount = prevCount + 1;

      if (nextCount >= levelConfig.wordsPerCustomer) {
        setCustomerIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex >= levelConfig.totalCustomers) {
            completeRef.current = true;
            setIsLevelComplete(true);
          }
          return nextIndex;
        });
        return 0; // reset per-customer counter for whoever's next
      }

      return nextCount;
    });
  }, [levelConfig.wordsPerCustomer, levelConfig.totalCustomers]);

  // Mr. Ratty's random check-in timer. Cleared/restarted only if the
  // config's own rate/interval change, not on every render.
  useEffect(() => {
    if (!levelConfig.rattySpawnRate) return undefined;

    const intervalId = setInterval(() => {
      if (completeRef.current) return;
      console.log('[Ratty] rolling...', levelConfig.rattySpawnRate);
      if (Math.random() < levelConfig.rattySpawnRate) {
        console.log('[Ratty] HIT — showRattyEvent → true');
        setShowRattyEvent(true);
      }
    }, levelConfig.rattyCheckIntervalMs);

    return () => clearInterval(intervalId);
  }, [levelConfig.rattySpawnRate, levelConfig.rattyCheckIntervalMs]);

  const dismissRattyEvent = useCallback(() => setShowRattyEvent(false), []);

  return {
    customerIndex,
    wordsServedForCustomer,
    isLevelComplete,
    showRattyEvent,
    registerServedWord,
    dismissRattyEvent,
  };
}
