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

const CustomerMood = forwardRef(({ maxPatience = 100, decayRateMs = 4000, onCustomerLeft, onPatienceChange, style, isPaused = false }, ref) => {
  const [patience, setPatience] = useState(maxPatience);
  const hasLeftRef = useRef(false);

  // Passive patience decay over time. Skipped entirely while isPaused —
  // no interval is even created, so there's nothing to accidentally let
  // tick in the background while e.g. the Store or Pause menu is open.
  useEffect(() => {
    if (isPaused) return undefined;

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
  }, [decayRateMs, isPaused]);

  // Fires onCustomerLeft exactly once, the moment patience hits 0.
  useEffect(() => {
    if (patience <= 0 && !hasLeftRef.current) {
      hasLeftRef.current = true;
      onCustomerLeft?.();
    }
  }, [patience, onCustomerLeft]);

  // Optional: lets a parent react to patience changes too (e.g. for a
  // numeric readout elsewhere on screen) without owning the image logic.
  useEffect(() => {
    onPatienceChange?.(patience);
  }, [patience, onPatienceChange]);

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