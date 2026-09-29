import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Image, StyleSheet } from 'react-native';

const MOOD_HAPPY = require('../../assets/Placeholder/CustomerPatienceBar_Happy.png');
const MOOD_IMPATIENT = require('../../assets/Placeholder/CustomerPatienceBar_Impatient.png');
const MOOD_ANGRY = require('../../assets/Placeholder/CustomerPatienceBar_Angry.png');

function getMoodImageSource(patience) {
  if (patience > 70) return MOOD_HAPPY;
  if (patience > 30) return MOOD_IMPATIENT;
  return MOOD_ANGRY;
}

const CustomerMood = forwardRef(({
  maxPatience = 100,
  decayRateMs = 4000,
  drainMultiplier = 1, // <1 slower drain, >1 faster. Applied to decayRateMs.
  onCustomerLeft,
  onPatienceChange,
  style,
}, ref) => {
  const [patience, setPatience] = useState(maxPatience);
  const hasLeftRef = useRef(false);

  // Read multiplier through a ref so mid-customer changes take effect
  // without resetting the interval (which would "heal" the customer).
  const drainRef = useRef(drainMultiplier);
  drainRef.current = drainMultiplier;

  // Passive decay. Reschedules on every tick so a live multiplier change
  // is honored without remounting the customer.
  useEffect(() => {
    let intervalId;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const mult = drainRef.current || 1;
      const base = Math.max(100, decayRateMs / mult);
      intervalId = setInterval(() => {
        setPatience((prev) => {
          if (prev <= 0) return prev;
          return Math.max(0, prev - 10);
        });
        clearInterval(intervalId);
        schedule();
      }, base);
    };
    schedule();
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [decayRateMs]);

  useEffect(() => {
    if (patience <= 0 && !hasLeftRef.current) {
      hasLeftRef.current = true;
      onCustomerLeft?.();
    }
  }, [patience, onCustomerLeft]);

  useEffect(() => {
    onPatienceChange?.(patience);
  }, [patience, onPatienceChange]);

  const applyWrongWordPenalty = (penaltyAmount = 15) => {
    if (hasLeftRef.current) return;
    setPatience((prev) => Math.max(0, prev - penaltyAmount));
  };

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

  return (
    <Image
      source={getMoodImageSource(patience)}
      style={[styles.patienceMeter, style]}
      resizeMode="contain"
    />
  );
});

export default CustomerMood;

const styles = StyleSheet.create({
  patienceMeter: {
    width: 94,
    height: 130,
    marginTop: -80,
  },
});