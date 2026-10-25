import React, { forwardRef, useState, useEffect, useRef, useImperativeHandle } from 'react';
import { Image, StyleSheet } from 'react-native';

const MOOD_HAPPY = require('../../assets/Final/GameplayUI/Patience_High.png');
const MOOD_IMPATIENT = require('../../assets/Final/GameplayUI/Patience_Moderate.png');
const MOOD_ANGRY = require('../../assets/Final/GameplayUI/Patience_Low.png');

function getMoodImageSource(patience) {
  if (patience > 70) return MOOD_HAPPY;
  if (patience > 30) return MOOD_IMPATIENT;
  return MOOD_ANGRY;
}

const CustomerMood = forwardRef(({
  maxPatience = 100,
  decayRateMs = 5000,
  drainMultiplier = 1,
  resizeMode = 'contain',
  isPaused = false,
  onCustomerLeft,
  onPatienceChange,
  style,
}, ref) => {
  const [patience, setPatience] = useState(maxPatience);
  const hasLeftRef = useRef(false);

  const drainRef = useRef(drainMultiplier);
  drainRef.current = drainMultiplier;

  const pausedRef = useRef(isPaused);
  pausedRef.current = isPaused;

  useEffect(() => {
    let intervalId;
    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;
      const mult = drainRef.current || 1;
      const base = Math.max(100, decayRateMs / mult);
      intervalId = setInterval(() => {
        if (!pausedRef.current) {
          setPatience((prev) => {
            if (prev <= 0) return prev;
            return Math.max(0, prev - 10);
          });
        }
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
      resizeMode={resizeMode}
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