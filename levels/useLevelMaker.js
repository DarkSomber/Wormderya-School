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
export function useLevelMaker(levelConfig, isPaused = false) {
  const [customerIndex, setCustomerIndex] = useState(0);
  const [wordsServedForCustomer, setWordsServedForCustomer] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showRattyEvent, setShowRattyEvent] = useState(false);

  // Guards against double-firing completion from React 18's dev
  // double-invoke, same pattern CustomerMood uses with hasLeftRef.
  const completeRef = useRef(false);

  // Ratty encounter bookkeeping. showRattyRef mirrors showRattyEvent so the
  // interval callback always sees the live value (one encounter at a time);
  // the timestamps drive the optional cooldown (levelConfig.rattyCooldownMs).
  const showRattyRef = useRef(false);
  const lastRattyEndedAtRef = useRef(null);
  const startedAtRef = useRef(Date.now());

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


  // Ratty roll. Every rattyCheckIntervalMs: skip if an encounter is already up,
  // skip while inside the cooldown window (measured from the last dismissal, or
  // from level start before the first one), otherwise roll rattySpawnRate.
  // Cooldown defaults to 0, so normal levels behave exactly as before.
  useEffect(() => {
    if (!levelConfig.rattySpawnRate || isPaused) return undefined;

    const intervalId = setInterval(() => {
      if (completeRef.current) return;
      if (showRattyRef.current) return; // never two at once
      const cooldownMs = levelConfig.rattyCooldownMs ?? 0;
      if (cooldownMs > 0) {
        const since = lastRattyEndedAtRef.current ?? startedAtRef.current;
        if (Date.now() - since < cooldownMs) return;
      }
      if (Math.random() < levelConfig.rattySpawnRate) {
        showRattyRef.current = true;
        setShowRattyEvent(true);
      }
    }, levelConfig.rattyCheckIntervalMs);

    return () => clearInterval(intervalId);
  }, [levelConfig.rattySpawnRate, levelConfig.rattyCheckIntervalMs, levelConfig.rattyCooldownMs, isPaused]);

  //Stop basically silence timer
  const stop = useCallback(() => {
  completeRef.current = true;
}, []);

  const dismissRattyEvent = useCallback(() => {
    // Only a real dismissal starts the cooldown (this is also called defensively
    // when the store opens or a level ends, when no Ratty is showing).
    if (showRattyRef.current) {
      showRattyRef.current = false;
      lastRattyEndedAtRef.current = Date.now();
    }
    setShowRattyEvent(false);
  }, []);

  return {
    customerIndex,
    wordsServedForCustomer,
    isLevelComplete,
    showRattyEvent,
    registerServedWord,
    dismissRattyEvent,
    stop,
  };
}