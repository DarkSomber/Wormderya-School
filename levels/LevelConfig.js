
import { TILE_MODES, getSyllablePool } from '../components/gameplayReusables/ConveyorBelt/Letterpool';

export function parseLevelNumber(id) {
  const match = /^level-(\d+)$/.exec(id ?? '');
  return match ? Number(match[1]) : null;
}

export function resolveTileMode(levelConfig) {
  return levelConfig?.tileMode === TILE_MODES.SYLLABLE
    ? TILE_MODES.SYLLABLE
    : TILE_MODES.LETTER;
}


export const DEFAULT_BELTS = [
  { letterDistribution: 'balanced', minVisibleVowels: 1 },
  { letterDistribution: 'vowelHeavy', minVisibleVowels: 3 },
  {
    letterDistribution: {
      profiles: ['balanced', 'vowelHeavy', 'consonantHeavy'],
      minStreak: 5,
      maxStreak: 9,
    },
    minVisibleVowels: 1,
  },
];

export const LEVEL_CONFIG_DEFAULTS = {
  id: 'untitled-level',
  title: 'Untitled Level',

  // --- Conveyor / Word Input ---
  conveyorSpeed: 1400,     // ms per slot -> ConveyorBelt slotDurationMs
  maxLettersOnBelt: 6,     // -> ConveyorBelt maxLetters (letters per belt). Default for every belt; NOT the input box count.
  inputBoxCount: 11,       // -> useWordInput inputBoxCount: MAX boxes (characters) in a word; boxes appear one by one as tiles are picked, auto-submit when full. Independent of maxLettersOnBelt.
  slotHoldMs: 3000,        // a box emptied by tapping it stays open this long so the player can pick a different tile for THAT box; then it closes up
  letterPool: null,        // -> ConveyorBelt letterPool (letter levels only); null = belt default
  tileMode: TILE_MODES.LETTER, // 'letter' | 'syllable' (see resolveTileMode)
  syllablePool: 'basic',   // syllable levels only: 'basic' | 'extended' | custom array of CV syllables (see Letterpool.js)
  syllableBelts: [0],      // syllable levels only: which belt rows (0 = top) spawn syllables. Every other belt spawns single letters
  // One entry per conveyor row (index 0 = belt 1, top to bottom). Every
  // level gets the same belt "personalities" unless it overrides an entry.
  // letterDistribution accepts a profile name, a 0-1 number, or
  // { profiles: [...], minStreak, maxStreak } (see Letterpool.js).
  belts: DEFAULT_BELTS,
  wordDifficulty: {
    minLength: 3,          // -> wordRules.minLength
    maxLength: 8,          // -> wordRules.maxLength
  },

  // --- Scoring ---
  scoreMultiplier: 1,      // -> useWordInput + addScoreFromWord
  targetScore: 300,        // -> LevelTimer targetScore (win condition)

  // --- Pacing ---
  timeLimitSeconds: 60,    // -> LevelTimer initialTimeInSeconds
  totalCustomers: 5,       // customers before the level completes
  wordsPerCustomer: 3,     // correct words to serve a customer
  patienceDecayMs: 4000,   // -> CustomerMood decayRateMs (-10 patience per tick). 4000 = CustomerMood's own default

  // --- Mr. Ratty ---
  rattySpawnRate: 0.15,        // chance (0-1) per check
  rattyCheckIntervalMs: 15000, // ms between checks
  rattyCooldownMs: 0,          // min ms between encounters (also after level start). 0 = off, i.e. unchanged behavior
};

export function createLevelConfig(overrides = {}) {
  const config = {
    ...LEVEL_CONFIG_DEFAULTS,
    ...overrides,
    // Merge nested objects too, so a partial wordDifficulty keeps the other field.
    wordDifficulty: {
      ...LEVEL_CONFIG_DEFAULTS.wordDifficulty,
      ...(overrides.wordDifficulty || {}),
    },
    // Per-belt merge: override only belts[1] and belts 0 and 2 keep defaults.
    belts: DEFAULT_BELTS.map((base, i) => ({
      ...base,
      ...((overrides.belts || [])[i] || {}),
    })),
  };
  // Normalize here too, so the stored config never claims syllables on a letter level.
  return { ...config, tileMode: resolveTileMode(config) };
}

/**
 * Settings for ONE conveyor row, shaped for ConveyorBelt's `config` prop.
 * Belt capacity and letter distribution are both per-belt; the level-wide
 * maxLettersOnBelt is only the fallback. Never touches inputBoxCount.
 *
 * This is also where the tile mode is applied (the one place the pool is chosen):
 *   syllable -> only for rows listed in `syllableBelts`: the level's syllable pool; the vowel
 *               weighting and vowel floor are switched off, because every
 *               syllable already has a vowel (the belt's vowel logic only
 *               understands single characters).
 *   letter   -> every other row/level: the level's letterPool (or the belt
 *               default) plus the belt's own distribution / vowel floor.
 */
export function isSyllableBelt(levelConfig, row) {
  return (
    resolveTileMode(levelConfig) === TILE_MODES.SYLLABLE &&
    (levelConfig.syllableBelts ?? LEVEL_CONFIG_DEFAULTS.syllableBelts).includes(row)
  );
}

export function getBeltConfig(levelConfig, row) {
  const belt = levelConfig.belts?.[row] ?? {};
  const base = { maxLetters: belt.maxLettersOnBelt ?? levelConfig.maxLettersOnBelt };

  if (isSyllableBelt(levelConfig, row)) {
    return {
      ...base,
      letterPool: getSyllablePool(levelConfig.syllablePool),
      letterDistribution: null, // uniform pick across the syllable pool
      minVisibleVowels: 0,      // no single-vowel floor for syllable tiles
    };
  }

  return {
    ...base,
    ...(levelConfig.letterPool ? { letterPool: levelConfig.letterPool } : {}),
    ...(belt.letterDistribution ? { letterDistribution: belt.letterDistribution } : {}),
    ...(belt.minVisibleVowels !== undefined ? { minVisibleVowels: belt.minVisibleVowels } : {}),
  };
}