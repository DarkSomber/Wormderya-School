import { VOWELS } from './Letterpool';

export const DEFAULT_SPAWN_TUNING = {
  targetChance: 0.4,
  pityStep: 0.15,
  decoyEcho: 0.35,
};

const isVowel = (ch) => VOWELS.includes(ch);
const rand = (list) => list[Math.floor(Math.random() * list.length)];

export function missingChars(target, supplyChars) {
  const have = {};
  for (const c of supplyChars) have[c] = (have[c] || 0) + 1;
  const missing = [];
  for (const c of target) {
    if (have[c] > 0) have[c] -= 1;
    else missing.push(c);
  }
  return missing;
}

export function createWordSpawner(tuning = {}) {
  const t = { ...DEFAULT_SPAWN_TUNING, ...tuning };
  let target = '';
  let held = [];
  let sinceTarget = 0;
  let lastPicked = null;
  const belts = new Map();

  const supplyFor = (beltIndex, localTiles) => {
    const chars = [];
    const add = (tile) => { for (const ch of tile) chars.push(ch); };
    localTiles.forEach(add);
    belts.forEach((read, index) => { if (index !== beltIndex) read().forEach(add); });
    held.forEach(add);
    return chars;
  };

  return {
    setTarget(word) {
      const next = (word || '').toUpperCase();
      if (next === target) return;
      target = next;
      sinceTarget = 4;
      lastPicked = null;
    },
    setHeld(chars) { held = chars || []; },
    registerBelt(beltIndex, read) {
      belts.set(beltIndex, read);
      return () => { if (belts.get(beltIndex) === read) belts.delete(beltIndex); };
    },

    pick({ beltIndex = 0, pool, localTiles = [], forceVowel = false }) {
      if (!target) return null;
      const syllable = pool.some((tile) => tile.length > 1);
      const missing = missingChars(target, supplyFor(beltIndex, localTiles));
      const chance = Math.min(1, t.targetChance + sinceTarget * t.pityStep);

      if (missing.length === 0 || Math.random() >= chance) {
        sinceTarget += 1;
        return null;
      }

      let choice = null;
      if (syllable) {
        const left = [...missing];
        const pairs = [];
        for (let i = 0; i < target.length - 1; i += 1) {
          const [c, v] = [target[i], target[i + 1]];
          const ci = left.indexOf(c);
          const vi = left.indexOf(v);
          if (!isVowel(c) && isVowel(v) && ci !== -1 && vi !== -1 && pool.includes(c + v)) pairs.push(c + v);
        }
        choice = pairs.length ? rand(pairs) : null;
      } else {
        let options = missing.filter((c) => pool.includes(c));
        if (forceVowel) {
          const vowelsOnly = options.filter(isVowel);
          if (vowelsOnly.length === 0) { sinceTarget += 1; return null; }
          options = vowelsOnly;
        }
        const distinct = [...new Set(options)];
        const fresh = distinct.filter((c) => c !== lastPicked);
        choice = distinct.length ? rand(fresh.length ? fresh : distinct) : null;
      }

      if (choice === null) { sinceTarget += 1; return null; }
      sinceTarget = 0;
      lastPicked = choice;
      return choice;
    },

    allowDummy(tile) {
      if (!target) return true;
      const echoesAnswer = Array.from(tile).some((ch) => target.includes(ch));
      return !echoesAnswer || Math.random() < t.decoyEcho;
    },
  };
}