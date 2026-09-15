import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
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
 * `isPaused` — freezes the belt mid-slide at its current position (no
 * animation restarts, no letter rotation) until it goes back to false,
 * at which point it resumes sliding the rest of the way to the next
 * slot over a fresh slotDurationMs. It's a simple freeze/resume, not a
 * tracked-remaining-time resume — on longer pauses the belt may appear
 * to "catch up" slightly slower right after unpausing, which is an
 * acceptable trade-off for how much simpler it keeps this file.
 *
 * Movement model:
 * `maxLetters` letters are visible at once, plus one extra buffer letter
 * waiting just off the right edge. A single Animated value translates the
 * whole row left by exactly one slot's width over `slotDurationMs`. When
 * that finishes, the buffer letter has scrolled fully into view. We then
 * rotate the data (drop the letter that just scrolled off the left, spawn
 * a fresh buffer letter) and snap translateX back to 0 inside useLayoutEffect — 
 * since the rotated layout is pixel-identical to where the tween ended, 
 * the snap is invisible and the belt reads as one continuous, wrapping motion.
 */
const ConveyorBelt = forwardRef(function ConveyorBelt(
  { config: configOverride, style, onLetterPress, isPaused = false },
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
  const tickRef = useRef(() => {});

  const rotateLetters = useCallback(() => {
    setLetters((prev) => {
      const [, ...rest] = prev;
      return [...rest, makeLetter(letterPool)];
    });
  }, [letterPool]);

  useEffect(() => {
    // While paused: make sure any in-flight tween is stopped (freezing
    // translateX exactly where it was) and don't start a new one.
    if (isPaused) {
      runningRef.current = false;
      translateX.stopAnimation();
      return undefined;
    }

    runningRef.current = true;

    const tick = () => {
      if (!runningRef.current) return;
      Animated.timing(translateX, {
        toValue: direction === 'rtl' ? slotWidth : -slotWidth,
        duration: slotDurationMs,
        // Linear so the belt keeps one constant speed across the whole
        // slot instead of easing in/out at every rotation.
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !runningRef.current) return;
        // Don't reset translateX or start the next tween here — do that
        // in the layout effect below, once the rotated letters have
        // actually committed. Resetting here first shows the *old*
        // letters snapped back to their starting position for a frame
        // before React catches up — that's the twitch.
        rotateLetters();
      });
    };

    tickRef.current = tick;
    tick();

    return () => {
      runningRef.current = false;
      translateX.stopAnimation();
    };
  }, [translateX, slotWidth, slotDurationMs, direction, rotateLetters, isPaused]);

  const isFirstRender = useRef(true);
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isPaused) return; // don't kick off the next tween while frozen
    // The rotated letters just committed and are pixel-identical to where
    // the tween ended, so snapping translateX back to 0 here, in the same
    // paint, is what makes the snap invisible and the belt read as one
    // continuous, wrapping motion instead of a twitch.
    translateX.setValue(0);
    tickRef.current();
  }, [letters, translateX, isPaused]);

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