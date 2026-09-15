import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isValidWord } from './WordValidator';
import { calculateScore } from './ScoreSystem';
import { DEFAULT_LEVEL_CONFIG } from './LevelConfig';

// How many letters can be selected into the current word before further
// taps/keypresses are ignored (the player has to submit or resetWord()
// first). Edit this to change the default everywhere, or pass a
// different value as useWordInput's third argument to override it for
// one screen/level without touching this file.
export const DEFAULT_MAX_LETTERS = 5;

/**
 * useWordInput(conveyorRefs, levelConfig?, maxLetters?, onSubmit?)
 * -----------------------------------------
 * The Word Input System. It sits *on top of* one or more ConveyorBelt
 * instances — passed in as an array of refs, one per belt/row — and only
 * ever touches them through the two things ConveyorBelt already exposes:
 *
 *   belt.getLetters()          read what's currently available
 *   belt.removeLetterById(id)  deactivate one specific letter
 *
 * It never reaches into the belt's movement, spawning, or wrap-around —
 * the belt keeps scrolling exactly as before, this hook just reacts to
 * what the player selects.
 *
 * `onSubmit(result)` — optional. Called every time a word is submitted,
 * whether that submit was manual (the caller's own submitWord() call) or
 * automatic (belt filled to maxLetters, see the effect near the bottom
 * of this file). This is the ONE place a submit can happen, so wiring
 * scoring/patience off this callback instead of off a manual
 * submitWord() call means an auto-submitted word scores and restores
 * patience exactly the same as a manually-served one.
 *
 * Returned API:
 *   currentWord         [{ id, character }]  in selection order
 *   lastResult          { word, valid, score } | null   result of the last submit
 *   selectLetter(letter, beltIndex)    call from a belt's onLetterPress
 *   handleKeyPress(char)               call from a keyboard listener
 *   submitWord()                       validate + score + reset
 *   resetWord()                        clear the whole current word without submitting
 *   removeLastLetter()                 undo just the most recently selected letter
 */
export function useWordInput(
  conveyorRefs,
  levelConfig = DEFAULT_LEVEL_CONFIG,
  maxLetters = DEFAULT_MAX_LETTERS,
  onSubmit
) {
  const [currentWord, setCurrentWord] = useState([]); // [{ id, character }]
  const [lastResult, setLastResult] = useState(null); // { word, valid, score }

  // Belt-and-braces guard against double-selecting the same letter id if
  // two taps land before state has re-rendered. The belt itself already
  // stops this in the normal case — an inactive Letter doesn't render a
  // TouchableOpacity at all — this just covers the keyboard-input path.
  const selectedIdsRef = useRef(new Set());

  const selectLetter = useCallback(
    (letter, beltIndex) => {
      if (!letter || !letter.active) return;
      if (selectedIdsRef.current.has(letter.id)) return;
      if (currentWord.length >= maxLetters) return; // at the cap — ignore further taps/keys until submit/reset

      selectedIdsRef.current.add(letter.id);
      setCurrentWord((prev) => [...prev, { id: letter.id, character: letter.character }]);

      if (__DEV__) {
        console.log(`[WordInput] letter selected: "${letter.character}" (belt ${beltIndex}, id ${letter.id})`);
      }

      // Ask the conveyor to drop this one letter. It marks the letter
      // inactive and plays its existing "disappearing" animation via
      // AnimationSystem — the conveyor's movement is untouched.
      const belt = conveyorRefs[beltIndex]?.current;
      belt?.removeLetterById(letter.id);
    },
    [conveyorRefs, currentWord.length, maxLetters]
  );

  const handleKeyPress = useCallback(
    (rawChar) => {
      const char = (rawChar || '').toUpperCase();
      if (!/^[A-Z]$/.test(char)) return false; // not a single letter key
      if (currentWord.length >= maxLetters) return false; // at the cap

      // Selection rule: first matching, available letter, scanning belts
      // in the order they were passed in. Easy to change later (e.g. to
      // "closest to center") without touching anything else here.
      for (let i = 0; i < conveyorRefs.length; i++) {
        const belt = conveyorRefs[i]?.current;
        if (!belt) continue;
        const match = belt
          .getLetters()
          .find((l) => l.active && l.character === char && !selectedIdsRef.current.has(l.id));
        if (match) {
          selectLetter(match, i);
          return true;
        }
      }
      return false; // requested letter isn't available right now
    },
    [conveyorRefs, selectLetter, currentWord.length, maxLetters]
  );

  // Keyboard input where the platform supports it (web/desktop browsers).
  // React Native itself has no cross-platform physical-keyboard event,
  // so this is intentionally scoped to Platform.OS === 'web'.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (e) => {
      if (e.key && e.key.length === 1) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const resetWord = useCallback(() => {
    setCurrentWord([]);
    selectedIdsRef.current.clear();
    // Note: this only clears the input system's own state. Letters
    // already removed from the conveyor stay removed — whether an
    // abandoned/invalid word should put its letters back on the belt is
    // a gameplay-design decision for later, not something assumed here.
  }, []);

  // Undo just the last selected letter (e.g. a "⌫" button next to
  // CurrentWordDisplay), rather than clearing the whole word like
  // resetWord does. Same caveat as resetWord: the letter already played
  // its "disappearing" animation on the belt and doesn't come back —
  // this only frees the player to pick a different letter instead of
  // the one they're undoing.
  const removeLastLetter = useCallback(() => {
    setCurrentWord((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      selectedIdsRef.current.delete(last.id);
      return prev.slice(0, -1);
    });
  }, []);

  const submitWord = useCallback(() => {
    const word = currentWord.map((l) => l.character).join('');
    const valid = isValidWord(word);
    const score = valid ? calculateScore(word, levelConfig.scoreMultiplier) : 0;
    const result = { word, valid, score };

    if (__DEV__) {
      console.log(`[WordInput] submit: "${word}" -> ${valid ? `VALID (+${score})` : 'INVALID'}`);
    }

    setLastResult(result);
    resetWord();
    onSubmit?.(result); // <-- notifies the caller (e.g. GameplayScreen's handleWordSubmit)
    return result;
  }, [currentWord, levelConfig, resetWord, onSubmit]);

  // Auto-submit the moment the player fills every slot. This reuses
  // submitWord as-is, so a full word that isn't in the database gets the
  // exact same invalid shake/flash (and reset via resetWord) as a
  // manually-submitted wrong word — no separate "wrong animation" path
  // to keep in sync — and a full word that *is* valid gets scored the
  // same way a manual submit would.
  useEffect(() => {
    if (maxLetters > 0 && currentWord.length >= maxLetters) {
      submitWord();
    }
  }, [currentWord.length, maxLetters, submitWord]);

  return {
    currentWord,
    lastResult,
    selectLetter,
    handleKeyPress,
    submitWord,
    resetWord,
    removeLastLetter,
    maxLetters,
  };
}