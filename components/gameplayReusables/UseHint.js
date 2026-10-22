import {useState, useRef, useCallback, useEffect} from 'react';
import {HINTS, RIDDLES} from './hints';

const REWARD_FLASH_MS = 1400;

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
  const deckRef = useRef([]);
  const lastRef = useRef(null);
  const timerRef = useRef(null);
 
  const draw = useCallback(() => {
    const pool = riddle ? RIDDLES : HINTS;
    const { minLength = 1, maxLength = 99, inputBoxCount = 99 } = rulesRef.current ?? {};
    const fits = (e) =>
      e.answer.length >= minLength && e.answer.length <= Math.min(maxLength, inputBoxCount);
 
    for (let pass = 0; pass < 2; pass += 1) {
      while (deckRef.current.length > 0) {
        const entry = deckRef.current.pop();
        if (fits(entry)) {
          lastRef.current = entry;
          return entry;
        }
      }
      const playable = pool.filter(fits);
      deckRef.current = shuffle((playable.length ? playable : pool).filter((e) => e !== lastRef.current));
    }
    return pool[0];
  }, [riddle]);
 
  const [hint, setHint] = useState(draw);
  const [reward, setReward] = useState(null);
  const hintRef = useRef(hint);
  hintRef.current = hint;
 
  const isMatch = useCallback(
    (word) => !!word && word.toUpperCase() === hintRef.current.answer,
    [],
  );
 
  const advance = useCallback((bonusPoints = 0) => {
    setHint(draw());
    clearTimeout(timerRef.current);
    if (bonusPoints > 0) {
      setReward(bonusPoints);
      timerRef.current = setTimeout(() => setReward(null), REWARD_FLASH_MS);
    }
  }, [draw]);
 
  useEffect(() => () => clearTimeout(timerRef.current), []);
 
  return { hint, reward, isMatch, advance };
}