import { useState, useRef, useCallback, useEffect } from 'react';

export function useLevelMaker(levelConfig, isPaused = false) {
  const [customerIndex, setCustomerIndex] = useState(0);
  const [wordsServedForCustomer, setWordsServedForCustomer] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showRattyEvent, setShowRattyEvent] = useState(false);

  const completeRef = useRef(false);

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
        return 0;
      }

      return nextCount;
    });
  }, [levelConfig.wordsPerCustomer, levelConfig.totalCustomers]);

  useEffect(() => {
    if (!levelConfig.rattySpawnRate || isPaused) return undefined;

    const intervalId = setInterval(() => {
      if (completeRef.current) return;
      if (showRattyRef.current) return;
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

  const stop = useCallback(() => {
  completeRef.current = true;
}, []);

  const dismissRattyEvent = useCallback(() => {
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