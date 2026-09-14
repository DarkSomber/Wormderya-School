import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';

/**
 * CustomerMood
 *
 * Exposes `applyWrongWordPenalty`, `restorePatience`, and `getPatience`
 * via a ref, so the Gameplay Programmer's word-input system (or the
 * GameplayScreen) can call these directly:
 *
 *   const customerRef = useRef(null);
 *   <CustomerMood ref={customerRef} onCustomerLeft={handleCustomerLeft} />
 *   ...
 *   customerRef.current.applyWrongWordPenalty();
 *   customerRef.current.restorePatience();
 */
const CustomerMood = forwardRef(({ maxPatience = 100, decayRateMs = 2000, onCustomerLeft }, ref) => {
  const [patience, setPatience] = useState(maxPatience);
  const hasLeftRef = useRef(false);

  // Passive patience decay over time.
  // NOTE: side effects (onCustomerLeft) are NOT called from inside the
  // setState updater below — updaters can run more than once and should
  // stay pure. The actual "customer left" trigger happens in the effect
  // further down, which watches `patience`.
  useEffect(() => {
    const intervalId = setInterval(() => {
      setPatience((prev) => {
        if (prev <= 0) {
          clearInterval(intervalId); // already empty, stop ticking
          return prev;
        }
        return Math.max(0, prev - 10);
      });
    }, decayRateMs);

    return () => clearInterval(intervalId);
  }, [decayRateMs]);

  // Fires onCustomerLeft exactly once, the moment patience hits 0.
  useEffect(() => {
    if (patience <= 0 && !hasLeftRef.current) {
      hasLeftRef.current = true;
      onCustomerLeft?.();
    }
  }, [patience, onCustomerLeft]);

  // Called when player submits an invalid word or wrong spelling
  const applyWrongWordPenalty = (penaltyAmount = 15) => {
    if (hasLeftRef.current) return; // ignore penalties after customer already left
    setPatience((prev) => Math.max(0, prev - penaltyAmount));
  };

  // Called when player successfully serves an order
  const restorePatience = (restoreAmount = 20) => {
    if (hasLeftRef.current) return;
    setPatience((prev) => Math.min(maxPatience, prev + restoreAmount));
  };

  const getPatience = () => patience;

  useImperativeHandle(ref, () => ({
    applyWrongWordPenalty,
    restorePatience,
    getPatience,
  }));

  // Map numerical patience to visual mood indicators
  const getMoodLabel = () => {
    if (patience > 70) return "Happy 😊";
    if (patience > 30) return "Neutral 😐";
    return "Impatient 😡";
  };

  return (
    <View>
      <Text style={{ fontSize: 18 }}>Customer Mood: {getMoodLabel()}</Text>
      <Text>Patience Level: {patience} / {maxPatience}</Text>
    </View>
  );
});

export default CustomerMood;