import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

//States for Future levels
export const LETTER_ANIM_STATES = {
  SPAWNING: 'spawning',
  IDLE: 'idle',
  MOVING: 'moving',
  SELECTED: 'selected',
  DISAPPEARING: 'disappearing',
};

//reusable animation 
export function useSpawnAnimation(animState) {
  const scale = useRef(
    new Animated.Value(animState === LETTER_ANIM_STATES.SPAWNING ? 0 : 1)
  ).current;

  useEffect(() => {
    if (animState === LETTER_ANIM_STATES.SPAWNING) {
      scale.setValue(0);
      Animated.spring(scale, {
        toValue: 1,
        friction: 2, //2 shows best animation
        useNativeDriver: true,
      }).start();
    } else if (animState === LETTER_ANIM_STATES.DISAPPEARING) {
      Animated.timing(scale, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [animState, scale]);

  return scale;
}

/**
 * One-off helper for a fire-and-forget fade/scale animation outside the
 * hook above (e.g. a future score popup or selected-letter pulse).
 */
export function playTimingAnimation(animatedValue, toValue, duration = 200) {
  return new Promise((resolve) => {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      useNativeDriver: true,
    }).start(() => resolve());
  });
}