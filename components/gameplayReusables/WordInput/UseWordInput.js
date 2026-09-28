import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isValidWord } from './WordValidator';
import { calculateScore } from './ScoreSystem';
import { DEFAULT_LEVEL_CONFIG } from './LevelConfig';
/* global __DEV__ */ 

// Number of player input boxes: how many letters the word being built can
// hold before extra taps are ignored (and it auto-submits). Independent of
// how many letters a conveyor belt holds. Edit this to change the default
// everywhere, or pass a different value as useWordInput's third argument
// (LevelConfig `inputBoxCount`) to override it for one screen/level.
export const DEFAULT_INPUT_BOX_COUNT = 5;

/**`onSubmit(result)` — This is the ONE place a submit can happen, so wiring
 * scoring/patience off this callback instead of off a manual
 * submitWord() call means an auto-submitted word scores and restores
 * patience exactly the same as a manually-served one.
 */
// The input boxes are a fixed-length list of slots: null (empty) or
// { id, character, beltIndex }. `id` is the conveyor letter's own id, so a
// tapped-back slot returns that exact letter instance, never a lookalike.
const fitSlots = (slots, n) => Array.from({ length: n }, (_, i) => slots[i] ?? null);

export function useWordInput(   //Constuctor
  conveyorRefs,
  levelConfig = DEFAULT_LEVEL_CONFIG,
  inputBoxCount = DEFAULT_INPUT_BOX_COUNT,
  onSubmit
) {
  // slotsRef mirrors state so rapid taps in one frame always see the latest boxes.
  const slotsRef = useRef(fitSlots([], inputBoxCount));
  const [slotState, setSlotState] = useState(slotsRef.current);
  const slots = useMemo(() => fitSlots(slotState, inputBoxCount), [slotState, inputBoxCount]);
  // Filled letters only, in box order (gaps skipped) -> what gets validated/scored.
  const currentWord = useMemo(() => slots.filter(Boolean), [slots]); // [{ id, character, beltIndex }]
  const [lastResult, setLastResult] = useState(null); // { word, valid, score }

  const commitSlots = useCallback((next) => {
    slotsRef.current = next;
    setSlotState(next);
  }, []);

  //guard against double-selecting the same letter id 
  const selectedIdsRef = useRef(new Set());

  const selectLetter = useCallback(
    (letter, beltIndex) => {
      if (!letter || !letter.active) return;
      if (selectedIdsRef.current.has(letter.id)) return;
      const current = fitSlots(slotsRef.current, inputBoxCount);
      const emptyIndex = current.indexOf(null);
      if (emptyIndex === -1) return; // every box is full — ignore further taps/keys until submit/reset

      selectedIdsRef.current.add(letter.id);
      // Fill the first empty box (a box freed by tapping it is reused; others don't shift).
      const next = current.slice();
      next[emptyIndex] = { id: letter.id, character: letter.character, beltIndex };
      commitSlots(next);

      if (__DEV__) {
        console.log(`[WordInput] letter selected: "${letter.character}" (belt ${beltIndex}, id ${letter.id})`);
      }

      // Animation for removing letter once tapped
      const belt = conveyorRefs[beltIndex]?.current;
      belt?.removeLetterById(letter.id);  //Return back letter
    },
    [conveyorRefs, commitSlots, inputBoxCount]
  );

  const handleKeyPress = useCallback(
    (rawChar) => {
      const char = (rawChar || '').toUpperCase();
      if (!/^[A-Z]$/.test(char)) return false; // not a single letter key
      if (!fitSlots(slotsRef.current, inputBoxCount).includes(null)) return false; // every box is full

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
    [conveyorRefs, selectLetter, inputBoxCount]
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
    commitSlots(fitSlots([], inputBoxCount));
    selectedIdsRef.current.clear();
    // Note: this only clears the input system's own state. Letters
    // already removed from the conveyor stay removed (they were consumed by
    // the submit). To give ONE letter back, use returnLetterFromSlot.
  }, [commitSlots, inputBoxCount]);

  // Tap an occupied input box to undo that pick: the box empties and the SAME
  // conveyor letter (matched by id, not character) goes back onto its belt.
  // Empty box -> no-op. Never submits, validates, scores, or penalises.
  const returnLetterFromSlot = useCallback(
    (slotIndex) => {
      const current = fitSlots(slotsRef.current, inputBoxCount);
      const entry = current[slotIndex];
      if (!entry) return false;

      const next = current.slice();
      next[slotIndex] = null;
      commitSlots(next);
      selectedIdsRef.current.delete(entry.id); // selectable again

      conveyorRefs[entry.beltIndex]?.current?.restoreLetter({ id: entry.id, character: entry.character });

      if (__DEV__) {
        console.log(`[WordInput] letter returned: "${entry.character}" (box ${slotIndex}, belt ${entry.beltIndex}, id ${entry.id})`);
      }
      return true;
    },
    [conveyorRefs, commitSlots, inputBoxCount]
  );

  // Undo just the last selected letter (returns it to its belt)
  const removeLastLetter = useCallback(() => {
    const current = fitSlots(slotsRef.current, inputBoxCount);
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i]) return returnLetterFromSlot(i);
    }
    return false;
  }, [inputBoxCount, returnLetterFromSlot]);

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
    if (inputBoxCount > 0 && currentWord.length >= inputBoxCount) {
      submitWord();
    }
  }, [currentWord.length, inputBoxCount, submitWord]);

  return {
    slots,        //fixed-length [null | { id, character, beltIndex }]  one entry per input box
    currentWord,  //[{ id, character, beltIndex }]  filled boxes only, in box order
    returnLetterFromSlot, //(boxIndex) tap an occupied box to send its letter back to the belt
    lastResult,   //{ word, valid, score } | null   result of the last submit
    selectLetter,  //call from a belt's onLetterPress
    handleKeyPress,  //call from a keyboard listener
    submitWord,     //validate + score + reset
    resetWord,
    removeLastLetter,
    inputBoxCount,
  };
}