import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isValidWord } from './WordValidator';
import { calculateScore } from './ScoreSystem';
import { DEFAULT_LEVEL_CONFIG } from './LevelConfig';
/* global __DEV__ */ 

// How many letters can be used before being ignored
// Edit this to change the default everywhere, or pass a
// different value as useWordInput's third argument to override it for
// one screen/level without touching this file.
export const DEFAULT_MAX_LETTERS = 5;

/**`onSubmit(result)` — This is the ONE place a submit can happen, so wiring
 * scoring/patience off this callback instead of off a manual
 * submitWord() call means an auto-submitted word scores and restores
 * patience exactly the same as a manually-served one.
 */
export function useWordInput(   //Constuctor
  conveyorRefs,
  levelConfig = DEFAULT_LEVEL_CONFIG,
  maxLetters = DEFAULT_MAX_LETTERS,
  onSubmit
) {
  const [currentWord, setCurrentWord] = useState([]); // [{ id, character }]
  const [lastResult, setLastResult] = useState(null); // { word, valid, score }

  //guard against double-selecting the same letter id 
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

      // Animation for removing letter once tapped
      const belt = conveyorRefs[beltIndex]?.current;
      belt?.removeLetterById(letter.id);  //Return back letter
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
          .getLetters() //read what's currently available
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

  // Keyboard input for web test
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (e) => {
      if (e.key && e.key.length === 1) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const resetWord = useCallback(() => {   //clear the whole current word without submitting
    setCurrentWord([]);
    selectedIdsRef.current.clear();
    // Note: this only clears the input system's own state. Letters
    // already removed from the conveyor stay removed
  }, []);

  // Undo just the last selected letter 
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
  // submitWord as-is. no separate "wrong animation" path
  // to keep in sync and a full word that is valid gets scored the
  // same way a manual submit would.
  useEffect(() => {
    if (maxLetters > 0 && currentWord.length >= maxLetters) {
      submitWord();
    }
  }, [currentWord.length, maxLetters, submitWord]);

  return {
    currentWord,  //[{ id, character }]  in selection order
    lastResult,   //{ word, valid, score } | null   result of the last submit
    selectLetter,  //call from a belt's onLetterPress
    handleKeyPress,  //call from a keyboard listener
    submitWord,     //validate + score + reset
    resetWord,
    removeLastLetter,
    maxLetters,
  };
}