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

/** ConveyorBelt - Moving letter handling position, Spawning, speed, and wrap-around.
 * `isPaused` — freezes the belt mid-slide at its current position a simple freeze/resume.
 * 
 * Movement model:
 * `maxLetters` letters are visible at once, plus one extra buffer letter
 * waiting just off the right edge. drop the letter that just scrolled off the left, spawn
 * a fresh buffer letter
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
        easing: Easing.linear, //keeps one constant speed across the whole belt
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || !runningRef.current) return;
        rotateLetters(); //DOM updates first to handle snapback visbility
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
    if (isPaused) return; //Seamless transition even when paused
    translateX.setValue(0);
    tickRef.current();
  }, [letters, translateX, isPaused]);

  const removeLetterById = useCallback((id) => { //Blank slot in conveyor
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
    getLetters: () => letters.slice(0, maxLetters), //Visible letters chosen
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
            onPress={onLetterPress} //Hook for letter input
          />
        ))}
      </Animated.View>
    </View>
  );
});

export default ConveyorBelt;

const styles = StyleSheet.create({
  viewport: {
    bottom: 2, // Adjusted to 2, before 10
    overflow: 'hidden',
    alignSelf: 'center',
  },
  track: {
    position: 'relative',
  },
});