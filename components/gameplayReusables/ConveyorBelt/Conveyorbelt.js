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
import Letter, { FlyingTile } from './Letter';
import { DEFAULT_CONVEYOR_CONFIG } from './Conveyorconfig';
import { pickRandomLetter, createVowelWeightPicker, getPoolSplit, VOWELS } from './Letterpool';
import { LETTER_ANIM_STATES } from './Animationsystem';

let nextLetterId = 1;

// Where the belt is right now (px), worked out from the linear slide's timing, so a tap can
// start its flying copy exactly over the plate without a per-frame listener on the belt.
function motionX(m) {
  if (!m.running) return m.from;
  const t = Math.min(1, Math.max(0, (Date.now() - m.startedAt) / m.duration));
  return m.from + (m.to - m.from) * t;
}

// `getVowelWeight` is the per-belt picker from createVowelWeightPicker
// (or undefined for the original uniform behavior).
// `forceVowel` guarantees a vowel (used by the minVisibleVowels floor).
// `spawn` (optional) = { spawner, beltIndex, localTiles }: when a WordSpawner is given,
// the tile is first offered to it so the belts build the current answer; if it
// answers null (a dummy), the normal random pick below runs, with dummies that
// echo the answer rerolled by the spawner's allowDummy().
function makeLetter(pool, getVowelWeight, forceVowel = false, spawn = null) {
  const { vowels, consonants } = getPoolSplit(pool);
  // Vowel weighting only means something when the pool has both kinds. CV
  // (syllable) pools hold no single-letter vowels, so skip the weight draw there:
  // the pick is the same uniform pick pickRandomLetter already made for them.
  const weighted = vowels.length > 0 && consonants.length > 0;
  const spawner = spawn?.spawner ?? null;
  let character = spawner
    ? spawner.pick({ beltIndex: spawn.beltIndex, pool, localTiles: spawn.localTiles, forceVowel })
    : null;

  if (character === null) {
    for (let tries = 0; tries < 6; tries += 1) {
      character =
        forceVowel && vowels.length > 0
          ? vowels[Math.floor(Math.random() * vowels.length)]
          : pickRandomLetter(pool, weighted && getVowelWeight ? getVowelWeight() : null);
      if (!spawner || spawner.allowDummy(character)) break;
    }
  }

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
  { config: configOverride, style, onLetterPress, isPaused = false, spawner = null, beltIndex = 0 },
  ref
) {
  const config = { ...DEFAULT_CONVEYOR_CONFIG, ...configOverride };
  const {
    slotDurationMs, slotWidth, slotHeight, maxLetters, letterPool,
    letterDistribution, direction, minVisibleVowels, flyDy,
  } = config;
  const totalSlots = maxLetters + 1; // +1 off-screen buffer letter

  // One picker per mounted belt so a "mixed" distribution's streaks (see
  // createVowelWeightPicker) persist across the letters this belt spawns,
  // rather than rerolling fresh on every render.
  // Keyed by value, not identity: a config rebuilt every render with the same
  // distribution must not reset a mixed distribution's streak.
  const vowelWeightPickerRef = useRef(null);
  if (vowelWeightPickerRef.current === null) {
    vowelWeightPickerRef.current = createVowelWeightPicker(letterDistribution);
  }
  const distributionKey =
    letterDistribution !== null && typeof letterDistribution === 'object'
      ? JSON.stringify(letterDistribution)
      : String(letterDistribution);
  useEffect(() => {
    vowelWeightPickerRef.current = createVowelWeightPicker(letterDistribution);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributionKey]);

  // Latest spawn settings and press handler, read through refs so
  // rotateLetters and the per-letter onPress keep one identity across renders
  // (a new identity would restart the belt tween / re-render every tile).
  const spawnRef = useRef({ letterPool, minVisibleVowels, spawner, beltIndex });
  spawnRef.current = { letterPool, minVisibleVowels, spawner, beltIndex };
  const onLetterPressRef = useRef(onLetterPress);
  onLetterPressRef.current = onLetterPress;
  const handleLetterPress = useCallback((letter) => onLetterPressRef.current?.(letter), []);

  // Initial fill also respects the vowel floor so the first screen isn't vowel-starved.
  const [letters, setLetters] = useState(() => {
    const list = [];
    for (let i = 0; i < totalSlots; i++) {
      const have = list.filter((l) => VOWELS.includes(l.character)).length;
      const need = (minVisibleVowels ?? 0) - have;
      list.push(makeLetter(letterPool, vowelWeightPickerRef.current, need >= totalSlots - i, {
        spawner, beltIndex, localTiles: list.map((l) => l.character),
      }));
    }
    return list;
  });

  // Latest tiles, so rotateLetters can build the new tile OUTSIDE the state updater
  // (the spawner keeps state; an updater may run twice in dev, which would double-count).
  const lettersRef = useRef(letters);
  lettersRef.current = letters;

  // Let the shared spawner see what is reachable on this belt (the tile at index 0 is
  // about to scroll off, so it doesn't count).
  useEffect(() => {
    if (!spawner) return undefined;
    return spawner.registerBelt(beltIndex, () =>
      lettersRef.current.slice(1).filter((l) => l.active).map((l) => l.character)
    );
  }, [spawner, beltIndex]);

  const translateX = useRef(new Animated.Value(0)).current;
  const motionRef = useRef({ from: 0, to: 0, startedAt: 0, duration: 1, running: false });

  // Plates the player just tapped, each flying toward the table (see FlyingTile).
  const [flying, setFlying] = useState([]);
  const flyRef = useRef({ slotWidth, slotHeight, flyDy, maxLetters });
  flyRef.current = { slotWidth, slotHeight, flyDy, maxLetters };
  const viewportWidthRef = useRef(0);
  const removeFlying = useCallback(
    (key) => setFlying((prev) => prev.filter((f) => f.key !== key)),
    []
  );
  const launchFlyingTile = useCallback((letter, index) => {
    const { slotWidth: sw, slotHeight: sh, flyDy: rise, maxLetters: count } = flyRef.current;
    const left = index * sw + motionX(motionRef.current);
    const viewportW = viewportWidthRef.current || sw * count;
    setFlying((prev) => [
      ...prev.slice(-7),
      {
        key: `fly-${letter.id}-${Date.now()}`,
        character: letter.character,
        left,
        dx: viewportW / 2 - (left + sw / 2), // toward the middle of the word row
        dy: rise > 0 ? -rise : -sh * 0.6,
      },
    ]);
  }, []);
  const runningRef = useRef(true);
  const tickRef = useRef(() => {});
  // Set by a rotation so the layout effect below resets the belt only then.
  const rotationPendingRef = useRef(false);

  const rotateLetters = useCallback(() => {
    rotationPendingRef.current = true;
    const { letterPool: pool, minVisibleVowels: minVowels, spawner: sp, beltIndex: index } = spawnRef.current;
    const rest = lettersRef.current.slice(1);
    const activeRest = rest.filter((l) => l.active);
    const activeVowels = activeRest.filter((l) => VOWELS.includes(l.character)).length;
    const needsVowel = activeVowels < (minVowels ?? 0);
    const fresh = makeLetter(pool, vowelWeightPickerRef.current, needsVowel, {
      spawner: sp,
      beltIndex: index,
      localTiles: activeRest.map((l) => l.character),
    });
    setLetters((prev) => [...prev.slice(1), fresh]);
  }, []);

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
      motionRef.current = {
        from: motionRef.current.from,
        to: direction === 'rtl' ? slotWidth : -slotWidth,
        startedAt: Date.now(),
        duration: slotDurationMs,
        running: true,
      };
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
      motionRef.current = { ...motionRef.current, from: motionX(motionRef.current), running: false };
      runningRef.current = false;
      translateX.stopAnimation();
    };
  }, [translateX, slotWidth, slotDurationMs, direction, rotateLetters, isPaused]);

  // Only a rotation moves every letter one slot left, so only a rotation resets the
  // belt. Picking or returning a tile also changes `letters`; it must not rewind
  // the slide in progress or restart its timer.
  useLayoutEffect(() => {
    if (!rotationPendingRef.current) return;
    rotationPendingRef.current = false;
    motionRef.current = { ...motionRef.current, from: 0, running: false };
    translateX.setValue(0); // also while paused, so the shifted letters don't sit a slot off
    if (!isPaused) tickRef.current();
  }, [letters, translateX, isPaused]);

  const removeLetterById = useCallback((id) => { //Blank slot in conveyor
    const list = lettersRef.current;
    const at = list.findIndex((l) => l.id === id);
    if (at !== -1 && list[at].active) launchFlyingTile(list[at], at); // the plate eases in toward the table
    setLetters((prev) => {
      const index = prev.findIndex((l) => l.id === id);
      if (index === -1 || !prev[index].active) return prev; // unknown or already removed: no change, no re-render
      return prev.map((l, i) =>
        i === index
          ? { ...l, active: false, animState: LETTER_ANIM_STATES.DISAPPEARING }
          : l
      );
    });
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
    <View
      pointerEvents="box-none"
      style={[styles.root, { width: viewportWidth, height: slotHeight }, style]}
    >
      <View
        style={styles.viewport}
        onLayout={(e) => { viewportWidthRef.current = e.nativeEvent.layout.width; }}
      >
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
              onPress={handleLetterPress} //Hook for letter input
            />
          ))}
        </Animated.View>
      </View>

      {/* Not clipped by the belt, so a tapped plate can leave it. Never takes touches. */}
      {flying.length > 0 && (
        <View pointerEvents="none" style={styles.flyLayer}>
          {flying.map((f) => (
            <FlyingTile key={f.key} tile={f} width={slotWidth} height={slotHeight} onDone={removeFlying} />
          ))}
        </View>
      )}
    </View>
  );
});

export default ConveyorBelt;

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
  },
  viewport: {
    width: '100%',
    height: '100%',
    bottom: 10,
    overflow: 'hidden',
  },
  flyLayer: {
    position: 'absolute',
    left: 0,
    top: -10, // same 10px lift as the viewport
    width: '100%',
    height: '100%',
  },
  track: {
    position: 'relative',
  },
});