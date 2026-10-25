import {useState, useRef, useCallback, useEffect} from 'react';
import {HINTS, RIDDLES} from './hints';

const REWARD_FLASH_MS = 1400;
const REVEAL_MS = 1000;

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function useHint({ riddle = false, rules } = {}) {
  const rulesRef = useRef(rules);
  rulesRef.current = rules;
  const decksRef = useRef({ hint: [], riddle: [] });
  const lastRef = useRef(null);
  const riddleRef = useRef(riddle);
  riddleRef.current = riddle;
  const timerRef = useRef(null);
 
  const draw = useCallback((useRiddle = riddleRef.current) => {
    const pool = useRiddle ? RIDDLES : HINTS;
    const deck = decksRef.current[useRiddle ? 'riddle' : 'hint'];
    const { minLength = 1, maxLength = 99, inputBoxCount = 99 } = rulesRef.current ?? {};
    const fits = (e) =>
      e.answer.length >= minLength && e.answer.length <= Math.min(maxLength, inputBoxCount);
 
    for (let pass = 0; pass < 2; pass += 1) {
      while (deck.length > 0) {
        const entry = deck.pop();
        if (fits(entry)) {
          lastRef.current = entry;
          return entry;
        }
      }
      const playable = pool.filter(fits);
      deck.push(...shuffle((playable.length ? playable : pool).filter((e) => e !== lastRef.current)));
    }
    return pool[0];
  }, []);
 
  const [hint, setHint] = useState(() => draw());
  const [reward, setReward] = useState(null);
  const [revealed, setRevealed] = useState(null);
  const revealTimerRef = useRef(null);
  const hintRef = useRef(hint);
  hintRef.current = hint;

  const reveal = useCallback(() => {
    setRevealed(hintRef.current.answer);
    clearTimeout(revealTimerRef.current);
    revealTimerRef.current = setTimeout(() => setRevealed(null), REVEAL_MS);
  }, []);

  const isMatch = useCallback(
    (word) => !!word && word.toUpperCase() === hintRef.current.answer,
    [],
  );
 
  const advance = useCallback((bonusPoints = 0, nextRiddle) => {
    setHint(draw(nextRiddle));
    clearTimeout(timerRef.current);
    if (bonusPoints > 0) {
      setReward(bonusPoints);
      timerRef.current = setTimeout(() => setReward(null), REWARD_FLASH_MS);
    }
  }, [draw]);
 
  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(revealTimerRef.current);
  }, []);

  return { hint, reward, revealed, reveal, isMatch, advance };
}