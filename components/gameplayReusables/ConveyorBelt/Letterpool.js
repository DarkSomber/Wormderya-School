/**
 * Test letter pool for the conveyor prototype. Swap this out for the
 * formal Tagalog letter set (or generate it from the word database) once
 * the Word Input System and dictionary are in place — nothing else in
 * the conveyor needs to change to support that swap, since ConveyorBelt
 * only ever pulls from `config.letterPool`.
 */
export const DEFAULT_LETTER_POOL = [
  'A', 'B', 'K', 'D', 'E', 'G', 'H', 'I', 'L',
  'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'Y',
];

// Tagalog vowels. Fixed on purpose (not derived from the pool) so the
// vowel/consonant split stays correct even if DEFAULT_LETTER_POOL grows.
export const VOWELS = ['A', 'E', 'I', 'O', 'U'];

/**
 * Tile modes. A "tile" is whatever one conveyor slot and one input box hold:
 *   letter   -> a single character ('B', 'A', 'Y')
 *   syllable -> a consonant-vowel pair ('BA', 'LE', 'SO')
 * Which mode a level uses is decided by LevelConfig's resolveTileMode().
 */
export const TILE_MODES = { LETTER: 'letter', SYLLABLE: 'syllable' };

/** Every consonant + vowel combination, e.g. (['B','L']) -> BA BE BI BO BU LA LE LI LO LU. */
export function buildSyllablePool(consonants, vowels = VOWELS) {
  return consonants.flatMap((c) => vowels.map((v) => c + v));
}

/**
 * Named syllable pools a level references with `syllablePool: 'basic'`.
 * `extended` is a superset of `basic`, so a level using it gets a wider
 * variety (more consonants -> more distinct tiles) than the level before it.
 * To add a tier, add a consonant list here; nothing else needs to change.
 */
export const SYLLABLE_CONSONANTS = {
  basic: ['B', 'K', 'L', 'M', 'S', 'T'],
  extended: ['B', 'D', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'Y'],
};

export const SYLLABLE_POOLS = Object.fromEntries(
  Object.entries(SYLLABLE_CONSONANTS).map(([name, consonants]) => [name, buildSyllablePool(consonants)])
);

/** 'basic' | 'extended' | a custom array of syllables -> the pool. Unknown names fall back to 'basic'. */
export function getSyllablePool(nameOrPool = 'basic') {
  if (Array.isArray(nameOrPool) && nameOrPool.length > 0) return nameOrPool;
  return SYLLABLE_POOLS[nameOrPool] ?? SYLLABLE_POOLS.basic;
}

export function getVowelsInPool(pool = DEFAULT_LETTER_POOL) {
  return pool.filter((ch) => VOWELS.includes(ch));
}

export function getConsonantsInPool(pool = DEFAULT_LETTER_POOL) {
  return pool.filter((ch) => !VOWELS.includes(ch));
}

/**
 * Named vowel-weight profiles a level's `letterDistribution` can reference
 * by name. Each is a [min, max] range — a random value inside it is drawn
 * per pick (see createVowelWeightPicker) so consecutive letters don't all
 * share the exact same weight and become predictable.
 */
export const LETTER_DISTRIBUTION_PROFILES = {
  balanced: [0.15, 0.20],
  vowelHeavy: [0.60, 0.72],
  consonantHeavy: [0.05, 0.10],
};

function randomInRange([min, max]) {
  return min + Math.random() * (max - min);
}

function weightForProfileName(name) {
  const range = LETTER_DISTRIBUTION_PROFILES[name] ?? LETTER_DISTRIBUTION_PROFILES.balanced;
  return randomInRange(range);
}

/**
 * Turns a LevelConfig's `letterDistribution` into a `getVowelWeight()`
 * function that ConveyorBelt calls once per spawned letter. This is the
 * one place that decides how the profiles behave over time, so
 * ConveyorBelt itself never needs to know what a "profile" is.
 *
 * Accepted `letterDistribution` shapes:
 *   - null / undefined        -> uniform pick across the whole pool
 *                                 (legacy behavior; returned getter yields null)
 *   - a number (0-1)          -> fixed vowel weight, used every pick
 *   - a profile name string   -> 'balanced' | 'vowelHeavy' | 'consonantHeavy';
 *                                 a fresh weight is drawn from that profile's
 *                                 range on every pick
 *   - { profiles: [...names], minStreak?, maxStreak? }
 *                              -> "mixed": one named profile is chosen at
 *                                 random and held for a short run of
 *                                 letters (minStreak–maxStreak, default 3–5)
 *                                 before rerolling, so the belt produces
 *                                 stretches that read as balanced, then
 *                                 vowel-heavy, then consonant-heavy,
 *                                 instead of shuffling every tile
 */
export function createVowelWeightPicker(letterDistribution) {
  if (letterDistribution === undefined || letterDistribution === null) {
    return () => null;
  }

  if (typeof letterDistribution === 'number') {
    return () => letterDistribution;
  }

  if (typeof letterDistribution === 'string') {
    return () => weightForProfileName(letterDistribution);
  }

  if (letterDistribution && Array.isArray(letterDistribution.profiles) && letterDistribution.profiles.length > 0) {
    const { profiles, minStreak = 3, maxStreak = 5 } = letterDistribution;
    let remaining = 0;
    let currentName = profiles[0];
    return () => {
      if (remaining <= 0) {
        currentName = profiles[Math.floor(Math.random() * profiles.length)];
        remaining = minStreak + Math.floor(Math.random() * (maxStreak - minStreak + 1));
      }
      remaining -= 1;
      return weightForProfileName(currentName);
    };
  }

  return () => null;
}

/**
 * Picks one letter from `pool`.
 *
 * `vowelWeight`:
 *   - null/undefined -> uniform pick across the whole pool (original,
 *     unweighted behavior — unchanged for any caller that doesn't pass it)
 *   - a number 0-1 -> that fraction of picks are drawn from the pool's
 *     vowels, the rest from its consonants
 */
export function pickRandomLetter(pool = DEFAULT_LETTER_POOL, vowelWeight = null) {
  if (vowelWeight === null || vowelWeight === undefined) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const vowels = getVowelsInPool(pool);
  const consonants = getConsonantsInPool(pool);

  let source;
  if (vowels.length === 0) source = consonants;
  else if (consonants.length === 0) source = vowels;
  else source = Math.random() < vowelWeight ? vowels : consonants;

  return source.length > 0
    ? source[Math.floor(Math.random() * source.length)]
    : pool[Math.floor(Math.random() * pool.length)];
}
