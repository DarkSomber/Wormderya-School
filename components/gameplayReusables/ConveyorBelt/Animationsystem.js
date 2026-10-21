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
// `onDisappeared` fires only when the removal animation ran to the end
// (not when a restore interrupts it), so the Letter can then unmount the tile.
export function useSpawnAnimation(animState, onDisappeared) {
  const scale = useRef(
    new Animated.Value(animState === LETTER_ANIM_STATES.SPAWNING ? 0 : 1)
  ).current;
  const onDisappearedRef = useRef(onDisappeared);
  onDisappearedRef.current = onDisappeared;

  useEffect(() => {
    let anim = null;
    if (animState === LETTER_ANIM_STATES.SPAWNING) {
      scale.setValue(0);
      anim = Animated.spring(scale, {
        toValue: 1,
        friction: 2, //2 shows best animation
        useNativeDriver: true,
      });
    } else if (animState === LETTER_ANIM_STATES.DISAPPEARING) {
      // Quick pop, then shrink away.
      anim = Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 70, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]);
    }
    if (!anim) return undefined;

    const isRemoval = animState === LETTER_ANIM_STATES.DISAPPEARING;
    anim.start(({ finished }) => {
      if (finished && isRemoval) onDisappearedRef.current?.();
    });
    return () => anim.stop();
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