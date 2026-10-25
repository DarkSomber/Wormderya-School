export const DEFAULT_LETTER_POOL = [
  'A', 'B', 'K', 'D', 'E', 'G', 'H', 'I', 'L',
  'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'Y',
];

export const VOWELS = ['A', 'E', 'I', 'O', 'U'];

export const TILE_MODES = { LETTER: 'letter', SYLLABLE: 'syllable' };

export function buildSyllablePool(consonants, vowels = VOWELS) {
  return consonants.flatMap((c) => vowels.map((v) => c + v));
}

export const SYLLABLE_CONSONANTS = {
  basic: ['B', 'K', 'L', 'M', 'S', 'T'],
  extended: ['B', 'D', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'W', 'Y'],
};

export const SYLLABLE_POOLS = Object.fromEntries(
  Object.entries(SYLLABLE_CONSONANTS).map(([name, consonants]) => [name, buildSyllablePool(consonants)])
);

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

const poolSplitCache = new WeakMap();

export function getPoolSplit(pool = DEFAULT_LETTER_POOL) {
  let split = poolSplitCache.get(pool);
  if (!split) {
    split = { vowels: getVowelsInPool(pool), consonants: getConsonantsInPool(pool) };
    poolSplitCache.set(pool, split);
  }
  return split;
}

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

export function pickRandomLetter(pool = DEFAULT_LETTER_POOL, vowelWeight = null) {
  if (vowelWeight === null || vowelWeight === undefined) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const { vowels, consonants } = getPoolSplit(pool);

  let source;
  if (vowels.length === 0) source = consonants;
  else if (consonants.length === 0) source = vowels;
  else source = Math.random() < vowelWeight ? vowels : consonants;

  return source.length > 0
    ? source[Math.floor(Math.random() * source.length)]
    : pool[Math.floor(Math.random() * pool.length)];
}