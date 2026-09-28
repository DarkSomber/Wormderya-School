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
import { pickRandomLetter, createVowelWeightPicker, getVowelsInPool, VOWELS } from './Letterpool';
import { LETTER_ANIM_STATES } from './Animationsystem';

let nextLetterId = 1;
// `getVowelWeight` is the per-belt picker from createVowelWeightPicker
// (or undefined for the original uniform behavior).
// `forceVowel` guarantees a vowel (used by the minVisibleVowels floor).
function makeLetter(pool, getVowelWeight, forceVowel = false) {
  const vowels = getVowelsInPool(pool);
  const character =
    forceVowel && vowels.length > 0
      ? vowels[Math.floor(Math.random() * vowels.length)]
      : pickRandomLetter(pool, getVowelWeight ? getVowelWeight() : null);

  return {
    id: `letter-${nextLetterId++}`,
    character,
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
  const {
    slotDurationMs, slotWidth, slotHeight, maxLetters, letterPool,
    letterDistribution, direction, minVisibleVowels,
  } = config;
  const totalSlots = maxLetters + 1; // +1 off-screen buffer letter

  // One picker per mounted belt so a "mixed" distribution's streaks (see
  // createVowelWeightPicker) persist across the letters this belt spawns,
  // rather than rerolling fresh on every render.
  const vowelWeightPickerRef = useRef(createVowelWeightPicker(letterDistribution));
  useEffect(() => {
    vowelWeightPickerRef.current = createVowelWeightPicker(letterDistribution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterDistribution]);

  // Initial fill also respects the vowel floor so the first screen isn't vowel-starved.
  const [letters, setLetters] = useState(() => {
    const list = [];
    for (let i = 0; i < totalSlots; i++) {
      const have = list.filter((l) => VOWELS.includes(l.character)).length;
      const need = (minVisibleVowels ?? 0) - have;
      list.push(makeLetter(letterPool, vowelWeightPickerRef.current, need >= totalSlots - i));
    }
    return list;
  });

  const translateX = useRef(new Animated.Value(0)).current;
  const runningRef = useRef(true);
  const tickRef = useRef(() => {});

  const rotateLetters = useCallback(() => {
    setLetters((prev) => {
      const [, ...rest] = prev;
      const activeVowels = rest.filter(
        (l) => l.active && VOWELS.includes(l.character)
      ).length;
      const needsVowel = activeVowels < (minVisibleVowels ?? 0);
      return [...rest, makeLetter(letterPool, vowelWeightPickerRef.current, needsVowel)];
    });
  }, [letterPool, minVisibleVowels]);

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

  // Gives a picked letter back to the belt. The SAME letter (matched by id) returns:
  //  - still on the belt (as a blank slot): reactivated in place;
  //  - already scrolled off the left: re-enters through the off-screen buffer
  //    slot on the right, replacing the not-yet-visible spawn, so the belt's
  //    slot count never grows and nothing is duplicated.
  // SPAWNING replays the pop-in (a disappeared tile's scale is stuck at 0).
  const restoreLetter = useCallback((returned) => {
    setLetters((prev) => {
      const index = prev.findIndex((l) => l.id === returned.id);
      if (index !== -1) {
        if (prev[index].active) return prev; // already here — never duplicate
        return prev.map((l, i) =>
          i === index ? { ...l, active: true, animState: LETTER_ANIM_STATES.SPAWNING } : l
        );
      }
      return [
        ...prev.slice(0, -1),
        { id: returned.id, character: returned.character, active: true, animState: LETTER_ANIM_STATES.SPAWNING },
      ];
    });
  }, []);

  useImperativeHandle(ref, () => ({
    removeLetterById,
    restoreLetter,
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
    bottom: 10,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  track: {
    position: 'relative',
  },
});