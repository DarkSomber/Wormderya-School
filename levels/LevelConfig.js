/**
 * LevelConfig
 * -----------
 * Single source of truth for per-level settings. A plain factory (not a
 * hook), so configs can be created and passed around anywhere.
 *
 * Wider than WordInput/LevelConfig.js (scoreMultiplier + wordRules only);
 * GameplayScreen maps the relevant slice into useWordInput.
 *
 * Two counts that are deliberately INDEPENDENT (never derive one from the other):
 *   maxLettersOnBelt  letters on each conveyor belt. Level-wide default;
 *                     a single belt overrides it via belts[i].maxLettersOnBelt.
 *   inputBoxCount     player input boxes = the most letters a word can hold
 *                     (also the auto-submit threshold).
 *
 * Usage: createLevelConfig({ conveyorSpeed: 900, totalCustomers: 8 })
 * Anything not overridden falls back to LEVEL_CONFIG_DEFAULTS.
 */

// Belt 1: normal mix | Belt 2: vowel-rich | Belt 3: drifts between styles.
// Each entry may also set `maxLettersOnBelt` to give that belt its own letter
// count; omit it to inherit the level-wide maxLettersOnBelt below.
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
  inputBoxCount: 6,        // -> useWordInput inputBoxCount + CurrentWordDisplay boxes. Independent of maxLettersOnBelt.
  letterPool: null,        // -> ConveyorBelt letterPool; null = belt default
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

  // --- Mr. Ratty ---
  rattySpawnRate: 0.15,        // chance (0-1) per check
  rattyCheckIntervalMs: 15000, // ms between checks
};

export function createLevelConfig(overrides = {}) {
  return {
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
}

/**
 * Settings for ONE conveyor row, shaped for ConveyorBelt's `config` prop.
 * Belt capacity and letter distribution are both per-belt; the level-wide
 * maxLettersOnBelt is only the fallback. Never touches inputBoxCount.
 */
export function getBeltConfig(levelConfig, row) {
  const belt = levelConfig.belts?.[row] ?? {};
  return {
    maxLetters: belt.maxLettersOnBelt ?? levelConfig.maxLettersOnBelt,
    ...(belt.letterDistribution ? { letterDistribution: belt.letterDistribution } : {}),
    ...(belt.minVisibleVowels !== undefined ? { minVisibleVowels: belt.minVisibleVowels } : {}),
  };
}