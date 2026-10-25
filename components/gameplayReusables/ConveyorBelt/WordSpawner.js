import { VOWELS } from './Letterpool';

export const DEFAULT_SPAWN_TUNING = {
  targetChance: 0.4, // base chance a spawn is a letter the answer still needs (0-1)
  pityStep: 0.15,    // added to that chance for every dummy spawned in a row
  decoyEcho: 0.35,   // chance a dummy may be a letter that is in the answer (higher = harder)
};

const isVowel = (ch) => VOWELS.includes(ch);
const rand = (list) => list[Math.floor(Math.random() * list.length)];

/** The answer's letters that nothing in `supplyChars` covers yet (duplicates counted, word order kept). */
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
  let held = [];                 // characters currently sitting in the input boxes
  let sinceTarget = 0;           // dummies spawned since the last needed letter
  let lastPicked = null;
  const belts = new Map();       // beltIndex -> () => string[] of reachable, active characters

  const supplyFor = (beltIndex, localTiles) => {
    const chars = [];
    const add = (tile) => { for (const ch of tile) chars.push(ch); };
    localTiles.forEach(add);
    belts.forEach((read, index) => { if (index !== beltIndex) read().forEach(add); });
    held.forEach(add);
    return chars;
  };

  return {
    /** Call with the current answer. Does nothing if it hasn't changed. */
    setTarget(word) {
      const next = (word || '').toUpperCase();
      if (next === target) return;
      target = next;
      sinceTarget = 4;   // the first spawn for a new word is (almost) always a needed letter
      lastPicked = null;
    },
    /** Characters currently placed in the input boxes (they are not on the belt, but still count). */
    setHeld(chars) { held = chars || []; },
    registerBelt(beltIndex, read) {
      belts.set(beltIndex, read);
      return () => { if (belts.get(beltIndex) === read) belts.delete(beltIndex); };
    },

    /** A tile string that helps build the answer, or null meaning "spawn a dummy". */
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
        // Needs a consonant+vowel pair from the answer where BOTH letters are still missing.
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
        const fresh = distinct.filter((c) => c !== lastPicked);   // avoid the same letter twice in a row
        choice = distinct.length ? rand(fresh.length ? fresh : distinct) : null;
      }

      if (choice === null) { sinceTarget += 1; return null; }
      sinceTarget = 0;
      lastPicked = choice;
      return choice;
    },

    /** For dummy letters: false = reroll. Keeps answer letters out of the dummies most of the time. */
    allowDummy(tile) {
      if (!target) return true;
      const echoesAnswer = Array.from(tile).some((ch) => target.includes(ch));
      return !echoesAnswer || Math.random() < t.decoyEcho;
    },
  };
}