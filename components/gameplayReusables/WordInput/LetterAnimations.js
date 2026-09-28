import { useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Reusable animation primitives for the word-input UI.
 *
 * If you already have an AnimationSystem module (referenced in
 * UseWordInput.js's comments for the conveyor's letter-removal
 * animation), these hooks probably belong there instead — merge this
 * file into it rather than keeping two animation modules around.
 */

// Pop-in for a single letter tile: scale + fade from 0 -> 1 on mount.
export function useTileEntranceAnimation() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const play = () => {
    scale.setValue(0);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, opacity, play };
}

// Shake + color flash + ripple used when a submitted word is judged
// valid/invalid. Same values/timings as the original CurrentWordDisplay,
// just moved here so the component only has to call playValid/playInvalid.
export function useResultFeedbackAnimation() {
  const shakeX = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashColor = useRef(new Animated.Value(0)).current; // 0 = invalid, 1 = valid
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const playValid = () => {
    flashColor.setValue(1);
    flashOpacity.setValue(0.55);
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.5);

    Animated.parallel([
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: false, // stays alongside the interpolated color below
      }),
      Animated.timing(rippleScale, {
        toValue: 2.2,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playInvalid = () => {
    flashColor.setValue(0);
    flashOpacity.setValue(0.55);
    shakeX.setValue(0);

    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  return {
    shakeX,
    flashOpacity,
    flashColor,
    rippleScale,
    rippleOpacity,
    playValid,
    playInvalid,
  };
}