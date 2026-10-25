import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { isValidWord } from './WordValidator';
import { calculateScore } from './ScoreSystem';
import { DEFAULT_LEVEL_CONFIG } from './LevelConfig';
import audio from '../../../audio/AudioManager';

export const DEFAULT_INPUT_BOX_COUNT = 11;

export const DEFAULT_SLOT_HOLD_MS = 3000;

const isTile = (s) => !!s && !s.held;
const isHold = (s) => !!s && s.held === true;

const PICK_SOUNDS = ['serve_letter1', 'serve_letter2', 'serve_letter3'];
const playPickSound = () =>
  audio.playSfx(PICK_SOUNDS[Math.floor(Math.random() * PICK_SOUNDS.length)]);

const findHoleIndex = (slots, targetId) => {
  const targeted = targetId ? slots.findIndex((s) => isHold(s) && s.id === targetId) : -1;
  if (targeted !== -1) return targeted;
  let best = -1;
  slots.forEach((s, i) => {
    if (isHold(s) && (best === -1 || s.n > slots[best].n)) best = i;
  });
  return best;
};

export function useWordInput(
  conveyorRefs,
  levelConfig = DEFAULT_LEVEL_CONFIG,
  inputBoxCount = DEFAULT_INPUT_BOX_COUNT,
  onSubmit,
  options = {}
) {
  const slotHoldMs = options.slotHoldMs ?? DEFAULT_SLOT_HOLD_MS;

  const slotsRef = useRef([]);
  const [slotState, setSlotState] = useState(slotsRef.current);
  const slots = slotState;
  const currentWord = useMemo(() => slotState.filter(isTile), [slotState]);
  const [lastResult, setLastResult] = useState(null);

  const commitSlots = useCallback((next) => {
    slotsRef.current = next;
    setSlotState(next);
  }, []);

  const holdTimersRef = useRef(new Map());
  const holdSeqRef = useRef(0);
  const targetRef = useRef(null);
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

  const expireHold = useCallback(
    (id) => {
      holdTimersRef.current.delete(id);
      const current = slotsRef.current;
      const index = current.findIndex((s) => isHold(s) && s.id === id);
      if (index === -1) return;
      commitSlots(current.filter((_, i) => i !== index));
      if (targetRef.current === id) setTarget(null);
    },
    [commitSlots, setTarget]
  );

  useEffect(() => () => {
    holdTimersRef.current.forEach((timer) => clearTimeout(timer));
    holdTimersRef.current.clear();
  }, []);

  const hasRoom = useCallback(
    () =>
      findHoleIndex(slotsRef.current, targetRef.current) !== -1 ||
      slotsRef.current.filter(isTile).length < inputBoxCount,
    [inputBoxCount]
  );

  const selectedIdsRef = useRef(new Set());

  const selectLetter = useCallback(
    (letter, beltIndex) => {
      if (!letter || !letter.active) return false;
      if (selectedIdsRef.current.has(letter.id)) return false;
      const current = slotsRef.current;
      const holeIndex = findHoleIndex(current, targetRef.current);
      const parts = Array.from(letter.character);
      if (current.filter(isTile).length + parts.length > inputBoxCount) return false;

      selectedIdsRef.current.add(letter.id);
      const next = current.slice();
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
          clearHoldTimer(slot.id);
          next[at + k] = entry;
        } else {
          next.splice(at + k, 0, entry);
        }
      });
      setTarget(null);
      commitSlots(next);
      playPickSound();

      if (__DEV__) {
        console.log(`[WordInput] tile selected: "${letter.character}" (belt ${beltIndex}, id ${letter.id})`);
      }

      const belt = conveyorRefs[beltIndex]?.current;
      belt?.removeLetterById(letter.id);
      return true;
    },
    [conveyorRefs, commitSlots, inputBoxCount, clearHoldTimer, setTarget]
  );

  const handleKeyPress = useCallback(
    (rawChar) => {
      const char = (rawChar || '').toUpperCase();
      if (!/^[A-Z]$/.test(char)) return false;
      if (!hasRoom()) return false;

      for (let i = 0; i < conveyorRefs.length; i++) {
        const belt = conveyorRefs[i]?.current;
        if (!belt) continue;
        const available = belt
          .getLetters()
          .filter((l) => l.active && !selectedIdsRef.current.has(l.id));
        const match =
          available.find((l) => l.character === char) ??
          available.find((l) => l.character.startsWith(char));
        if (match && selectLetter(match, i)) return true;
      }
      return false;
    },
    [conveyorRefs, selectLetter, hasRoom]
  );

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKeyDown = (e) => {
      if (e.key && e.key.length === 1) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const resetWord = useCallback(() => {
    holdTimersRef.current.forEach((timer) => clearTimeout(timer));
    holdTimersRef.current.clear();
    setTarget(null);
    commitSlots([]);
    selectedIdsRef.current.clear();
  }, [commitSlots, setTarget]);

  const returnLetterFromSlot = useCallback(
    (slotIndex) => {
      const current = slotsRef.current;
      const entry = current[slotIndex];
      if (!isTile(entry)) return false;

      const next = [];
      let firstHoldId = null;
      current.forEach((s) => {
        if (!isTile(s) || s.tileId !== entry.tileId) {
          next.push(s);
          return;
        }
        if (slotHoldMs <= 0) return;
        const hold = { held: true, id: `hold-${++holdSeqRef.current}`, n: holdSeqRef.current };
        holdTimersRef.current.set(hold.id, setTimeout(() => expireHold(hold.id), slotHoldMs));
        firstHoldId = firstHoldId ?? hold.id;
        next.push(hold);
      });
      commitSlots(next);
      setTarget(firstHoldId);
      selectedIdsRef.current.delete(entry.tileId);

      conveyorRefs[entry.beltIndex]?.current?.restoreLetter({ id: entry.tileId, character: entry.tileChar });
      audio.playSfx('serve_letters');

      if (__DEV__) {
        console.log(`[WordInput] letter returned: "${entry.tileChar}" (box ${slotIndex}, belt ${entry.beltIndex}, id ${entry.tileId})`);
      }
      return true;
    },
    [conveyorRefs, commitSlots, slotHoldMs, expireHold]
  );

  const selectHoleSlot = useCallback(
    (slotIndex) => {
      const entry = slotsRef.current[slotIndex];
      if (!isHold(entry)) return false;
      setTarget(entry.id);
      return true;
    },
    [setTarget]
  );

  const removeLastLetter = useCallback(() => {
    const current = slotsRef.current;
    for (let i = current.length - 1; i >= 0; i--) {
      if (isTile(current[i])) return returnLetterFromSlot(i);
    }
    return false;
  }, [returnLetterFromSlot]);

  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const submitWord = useCallback(async () => {
    const word = currentWord.map((l) => l.character).join('');
    resetWord();
    const valid = await isValidWord(word);
    if (!mountedRef.current) return null;
    const score = valid ? calculateScore(word, levelConfig.scoreMultiplier) : 0;
    const result = { word, valid, score };

    if (__DEV__) {
      console.log(`[WordInput] submit: "${word}" -> ${valid ? `VALID (+${score})` : 'INVALID'}`);
    }

    setLastResult(result);
    onSubmit?.(result);
    return result;
  }, [currentWord, levelConfig, resetWord, onSubmit]);

  useEffect(() => {
    if (Number.isFinite(inputBoxCount) && inputBoxCount > 0 && currentWord.length >= inputBoxCount) {
      submitWord();
    }
  }, [currentWord.length, inputBoxCount, submitWord]);

  return {
    slots,
    currentWord,
    returnLetterFromSlot,
    selectHoleSlot,
    targetHoleId,
    lastResult,
    selectLetter,
    handleKeyPress,
    submitWord,
    resetWord,
    removeLastLetter,
    inputBoxCount,
  };
}