import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isValidWord } from './WordValidator';
import { calculateScore } from './ScoreSystem';
import { DEFAULT_LEVEL_CONFIG } from './LevelConfig';
/* global __DEV__ */ 

// Maximum number of input boxes: how many characters the word being built can
// hold. Boxes are NOT drawn up front: one appears for each character the player
// picks (a syllable like 'BA' adds two), and the word auto-submits once the
// maximum is reached. Independent of how many letters a conveyor belt holds.
// Pass a different value as useWordInput's third argument (LevelConfig
// `inputBoxCount`) to override it for one screen/level.
export const DEFAULT_INPUT_BOX_COUNT = 11;

// When the player taps a filled box to take its tile back, that box stays open
// for this long so they can drop a DIFFERENT tile into that exact spot. After
// it runs out the box closes and the tiles after it shift left.
export const DEFAULT_SLOT_HOLD_MS = 3000;

/**`onSubmit(result)` — This is the ONE place a submit can happen, so wiring
 * scoring/patience off this callback instead of off a manual
 * submitWord() call means an auto-submitted word scores and restores
 * patience exactly the same as a manually-served one.
 */
// The input boxes are a list of slots. Each entry is one of:
//   a tile  { id, tileId, tileChar, character, beltIndex }
//                                          ONE character per box. A syllable tile 'BA' picked from
//                                          the belt becomes two boxes ('B', 'A') that share its
//                                          `tileId` (the conveyor letter's own id) and `tileChar`
//                                          ('BA'), so tapping either box sends the whole belt tile
//                                          back, that exact instance, never a lookalike
//   a hold  { held: true, id, n }          a box the player just emptied; kept open
//                                          for slotHoldMs so it can be refilled
// The list is exactly what the screen draws: boxes exist only for tiles the
// player has picked (plus open boxes for a few seconds), never empty placeholders.
const isTile = (s) => !!s && !s.held;
const isHold = (s) => !!s && s.held === true;

// Which open box the next tile goes into: the one the player tapped (targetId)
// if it is still open, else the most recently emptied one. -1 = no open box.
const findHoleIndex = (slots, targetId) => {
  const targeted = targetId ? slots.findIndex((s) => isHold(s) && s.id === targetId) : -1;
  if (targeted !== -1) return targeted;
  let best = -1;
  slots.forEach((s, i) => {
    if (isHold(s) && (best === -1 || s.n > slots[best].n)) best = i;
  });
  return best;
};

export function useWordInput(   //Constuctor
  conveyorRefs,
  levelConfig = DEFAULT_LEVEL_CONFIG,
  inputBoxCount = DEFAULT_INPUT_BOX_COUNT,
  onSubmit,
  options = {}
) {
  const slotHoldMs = options.slotHoldMs ?? DEFAULT_SLOT_HOLD_MS;

  // slotsRef mirrors state so rapid taps in one frame always see the latest boxes.
  const slotsRef = useRef([]);
  const [slotState, setSlotState] = useState(slotsRef.current);
  // What the screen draws: one box per picked character, plus any open (held) boxes.
  const slots = slotState;
  // Filled tiles only, in box order (gaps and open boxes skipped) -> what gets validated/scored.
  const currentWord = useMemo(() => slotState.filter(isTile), [slotState]); // [{ id, character, beltIndex }]
  const [lastResult, setLastResult] = useState(null); // { word, valid, score }

  const commitSlots = useCallback((next) => {
    slotsRef.current = next;
    setSlotState(next);
  }, []);

  // --- open (held) boxes ---------------------------------------------------
  const holdTimersRef = useRef(new Map()); // hold id -> timeout
  const holdSeqRef = useRef(0);
  const targetRef = useRef(null); // id of the open box the player tapped, or null
  const [targetHoleId, setTargetHoleId] = useState(null);

  const setTarget = useCallback((id) => {
    targetRef.current = id;
    setTargetHoleId(id);
  }, []);

  const clearHoldTimer = useCallback((id) => {
    const timer = holdTimersRef.current.get(id);
    if (timer !== undefined) clearTimeout(timer);
    holdTimersRef.current.delete(id);
  }, []);

  // The hold ran out: close the box so later tiles shift left.
  const expireHold = useCallback(
    (id) => {
      holdTimersRef.current.delete(id);
      const current = slotsRef.current;
      const index = current.findIndex((s) => isHold(s) && s.id === id);
      if (index === -1) return; // already refilled
      commitSlots(current.filter((_, i) => i !== index));
      if (targetRef.current === id) setTarget(null);
    },
    [commitSlots, setTarget]
  );

  useEffect(() => () => {
    holdTimersRef.current.forEach((timer) => clearTimeout(timer));
    holdTimersRef.current.clear();
  }, []);

  // Room for one more tile? An open box always counts as room.
  const hasRoom = useCallback(
    () =>
      findHoleIndex(slotsRef.current, targetRef.current) !== -1 ||
      slotsRef.current.filter(isTile).length < inputBoxCount,
    [inputBoxCount]
  );

  //guard against double-selecting the same letter id 
  const selectedIdsRef = useRef(new Set());

  const selectLetter = useCallback(
    (letter, beltIndex) => {
      if (!letter || !letter.active) return;
      if (selectedIdsRef.current.has(letter.id)) return;
      const current = slotsRef.current;
      const holeIndex = findHoleIndex(current, targetRef.current);
      // One box per character: 'B' takes one box, a syllable 'BA' takes two ('B' then 'A').
      const parts = Array.from(letter.character);
      if (current.filter(isTile).length + parts.length > inputBoxCount) return; // a syllable needs two boxes: don't half-fill

      selectedIdsRef.current.add(letter.id);
      const next = current.slice();
      // Start in the open box the player emptied (or tapped), else at the end of the row.
      const at = holeIndex !== -1 ? holeIndex : next.length;
      parts.forEach((ch, k) => {
        const entry = {
          id: `${letter.id}:${k}`,
          tileId: letter.id,
          tileChar: letter.character,
          character: ch,
          beltIndex,
        };
        const slot = next[at + k];
        if (isHold(slot)) {
          clearHoldTimer(slot.id); // take over an open box
          next[at + k] = entry;
        } else {
          next.splice(at + k, 0, entry); // no open box here: a new box appears (later boxes shift right)
        }
      });
      setTarget(null);
      commitSlots(next);

      if (__DEV__) {
        console.log(`[WordInput] tile selected: "${letter.character}" (belt ${beltIndex}, id ${letter.id})`);
      }

      // Animation for removing letter once tapped
      const belt = conveyorRefs[beltIndex]?.current;
      belt?.removeLetterById(letter.id);  //Return back letter
    },
    [conveyorRefs, commitSlots, inputBoxCount, clearHoldTimer, setTarget]
  );

  const handleKeyPress = useCallback(
    (rawChar) => {
      const char = (rawChar || '').toUpperCase();
      if (!/^[A-Z]$/.test(char)) return false; // not a single letter key
      if (!hasRoom()) return false; // fixed boxes all full

      // Selection rule: first matching, available letter, scanning belts
      // in the order they were passed in. Easy to change later (e.g. to
      // "closest to center") without touching anything else here.
      for (let i = 0; i < conveyorRefs.length; i++) {
        const belt = conveyorRefs[i]?.current;
        if (!belt) continue;
        // Syllable tiles ('BA') can't equal a single typed key, so fall back to a
        // tile that STARTS with it. Letter tiles are 1 char, so they match exactly as before.
        const available = belt
          .getLetters() //read what's currently available
          .filter((l) => l.active && !selectedIdsRef.current.has(l.id));
        const match =
          available.find((l) => l.character === char) ??
          available.find((l) => l.character.startsWith(char));
        if (match) {
          selectLetter(match, i);
          return true;
        }
      }
      return false; // requested letter isn't available right now
    },
    [conveyorRefs, selectLetter, hasRoom]
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
    holdTimersRef.current.forEach((timer) => clearTimeout(timer));
    holdTimersRef.current.clear();
    setTarget(null);
    commitSlots([]);
    selectedIdsRef.current.clear();
    // Note: this only clears the input system's own state. Letters
    // already removed from the conveyor stay removed (they were consumed by
    // the submit). To give ONE letter back, use returnLetterFromSlot.
  }, [commitSlots, setTarget]);

  // Tap an occupied input box to undo that pick: the SAME conveyor letter
  // (matched by id, not character) goes back onto its belt, and the box stays
  // open for slotHoldMs so the next tile picked lands in that exact spot.
  // Empty box -> no-op. Never submits, validates, scores, or penalises.
  const returnLetterFromSlot = useCallback(
    (slotIndex) => {
      const current = slotsRef.current;
      const entry = current[slotIndex];
      if (!isTile(entry)) return false;

      // A syllable tile sits in two boxes: the whole tile goes back, so open every box it filled.
      const next = [];
      let firstHoldId = null;
      current.forEach((s) => {
        if (!isTile(s) || s.tileId !== entry.tileId) {
          next.push(s);
          return;
        }
        if (slotHoldMs <= 0) return; // holding disabled: close its box right away
        const hold = { held: true, id: `hold-${++holdSeqRef.current}`, n: holdSeqRef.current };
        holdTimersRef.current.set(hold.id, setTimeout(() => expireHold(hold.id), slotHoldMs));
        firstHoldId = firstHoldId ?? hold.id;
        next.push(hold);
      });
      commitSlots(next);
      setTarget(firstHoldId); // the next pick goes into the first box of what was just removed
      selectedIdsRef.current.delete(entry.tileId); // selectable again

      conveyorRefs[entry.beltIndex]?.current?.restoreLetter({ id: entry.tileId, character: entry.tileChar });

      if (__DEV__) {
        console.log(`[WordInput] letter returned: "${entry.tileChar}" (box ${slotIndex}, belt ${entry.beltIndex}, id ${entry.tileId})`);
      }
      return true;
    },
    [conveyorRefs, commitSlots, slotHoldMs, expireHold]
  );

  // Tap an OPEN box to choose it as the spot the next tile goes into.
  const selectHoleSlot = useCallback(
    (slotIndex) => {
      const entry = slotsRef.current[slotIndex];
      if (!isHold(entry)) return false;
      setTarget(entry.id);
      return true;
    },
    [setTarget]
  );

  // Undo just the last selected letter (returns it to its belt)
  const removeLastLetter = useCallback(() => {
    const current = slotsRef.current;
    for (let i = current.length - 1; i >= 0; i--) {
      if (isTile(current[i])) return returnLetterFromSlot(i);
    }
    return false;
  }, [returnLetterFromSlot]);

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
    // Reaching the box maximum auto-submits (Infinity = never; the Plate button still works).
    if (Number.isFinite(inputBoxCount) && inputBoxCount > 0 && currentWord.length >= inputBoxCount) {
      submitWord();
    }
  }, [currentWord.length, inputBoxCount, submitWord]);

  return {
    slots,        //[tile | open box]  what to draw: one entry per box, only boxes that have a character (or are open)
    currentWord,  //[{ id, character, beltIndex }]  filled boxes only, in box order
    returnLetterFromSlot, //(boxIndex) tap an occupied box to send its tile back to the belt (the box stays open for slotHoldMs)
    selectHoleSlot,       //(boxIndex) tap an open box to pick it as the next tile's spot
    targetHoleId,         //id of the open box the player tapped, or null (default target = most recently emptied)
    lastResult,   //{ word, valid, score } | null   result of the last submit
    selectLetter,  //call from a belt's onLetterPress
    handleKeyPress,  //call from a keyboard listener
    submitWord,     //validate + score + reset
    resetWord,
    removeLastLetter,
    inputBoxCount,
  };
}