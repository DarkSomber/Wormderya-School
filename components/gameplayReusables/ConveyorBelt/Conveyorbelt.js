import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import Letter from './Letter';
import { DEFAULT_CONVEYOR_CONFIG } from './Conveyorconfig';
import { pickRandomLetter } from './Letterpool';
import { LETTER_ANIM_STATES } from './Animationsystem';

let nextLetterId = 1;
function makeLetter(pool) {
  return {
    id: `letter-${nextLetterId++}`,
    character: pickRandomLetter(pool),
    active: true,
    animState: LETTER_ANIM_STATES.IDLE,
  };
}

/**
 * ConveyorBelt
 * ------------
 * Owns everything about moving letters along a belt: position, spawning,
 * speed, and wrap-around. It deliberately knows nothing about words,
 * scoring, or input — future systems are meant to reach in through:
 *
 *   ref.removeLetterById(id)    mark a letter inactive (blank slot, belt
 *                               keeps moving normally)
 *   ref.getLetters()            currently visible letters, left to right
 *   props.onLetterPress(letter) tap hook for the future Word Input System
 *
 * Movement model:
 * `maxLetters` letters are visible at once, plus one extra buffer letter
 * waiting just off the right edge. A single Animated value translates the
 * whole row left by exactly one slot's width over `slotDurationMs`. When
 * that finishes, the buffer letter has scrolled fully into view. We then
 * rotate the data (drop the letter that just scrolled off the left, spawn
 * a fresh buffer letter) and snap translateX back to 0 — since the
 * rotated layout is pixel-identical to where the tween ended, the snap is
 * invisible and the belt reads as one continuous, wrapping motion.
 */
const ConveyorBelt = forwardRef(function ConveyorBelt(
  { config: configOverride, style, onLetterPress },
  ref
) {
  const config = { ...DEFAULT_CONVEYOR_CONFIG, ...configOverride };
  const { slotDurationMs, slotWidth, slotHeight, maxLetters, letterPool, direction } = config;
  const totalSlots = maxLetters + 1; // +1 off-screen buffer letter

  const [letters, setLetters] = useState(() =>
    Array.from({ length: totalSlots }, () => makeLetter(letterPool))
  );

  const translateX = useRef(new Animated.Value(0)).current;
  const runningRef = useRef(true);

  const rotateLetters = useCallback(() => {
    setLetters((prev) => {
      const [, ...rest] = prev;
      return [...rest, makeLetter(letterPool)];
    });
  }, [letterPool]);

  useEffect(() => {
    runningRef.current = true;

    const tick = () => {
      if (!runningRef.current) return;
      translateX.setValue(0);
      Animated.timing(translateX, {
        toValue: direction === 'rtl' ? slotWidth : -slotWidth,
        duration: slotDurationMs,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !runningRef.current) return;
        rotateLetters();
        tick();
      });
    };

    tick();

    return () => {
      runningRef.current = false;
      translateX.stopAnimation();
    };
  }, [translateX, slotWidth, slotDurationMs, direction, rotateLetters]);

  const removeLetterById = useCallback((id) => {
    setLetters((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, active: false, animState: LETTER_ANIM_STATES.DISAPPEARING }
          : l
      )
    );
  }, []);

  useImperativeHandle(ref, () => ({
    removeLetterById,
    getLetters: () => letters.slice(0, maxLetters),
  }));

  const viewportWidth = slotWidth * maxLetters;

  return (
    <View style={[styles.viewport, { width: viewportWidth, height: slotHeight }, style]}>
      <Animated.View
        style={[
          styles.track,
          { width: slotWidth * totalSlots, height: slotHeight, transform: [{ translateX }] },
        ]}
      >
        {letters.map((letter, i) => (
          <Letter
            key={letter.id}
            letter={letter}
            left={i * slotWidth}
            width={slotWidth}
            height={slotHeight}
            onPress={onLetterPress}
          />
        ))}
      </Animated.View>
    </View>
  );
});

export default ConveyorBelt;

const styles = StyleSheet.create({
  viewport: {
    bottom: 10, // Can be adjusted please adjust this mans
    overflow: 'hidden',
    alignSelf: 'center',
  },
  track: {
    position: 'relative',
  },
});