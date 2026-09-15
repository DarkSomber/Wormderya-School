/**
 * LevelConfig
 * -----------
 * Single source of truth for everything that varies level-to-level. This
 * is a plain factory (not a React hook/component) on purpose, so a config
 * can be created, copied, and passed around freely — including outside
 * of any component tree, e.g. in a level-select list.
 *
 * NOTE: this is a DIFFERENT, wider config than
 * components/gameplayReusables/WordInput/LevelConfig.js, which only
 * covers scoreMultiplier + wordRules for the Word Input System. This
 * file is the level-wide superset — GameplayScreen maps the relevant
 * slice of it into useWordInput's own levelConfig param (see
 * screens/GameplayScreen.js for exactly how).
 *
 * Usage:
 *   import { createLevelConfig } from '../levels/LevelConfig';
 *   const config = createLevelConfig({ conveyorSpeed: 900, totalCustomers: 8 });
 *
 * Anything you don't override falls back to LEVEL_CONFIG_DEFAULTS.
 */

export const LEVEL_CONFIG_DEFAULTS = {
  id: 'untitled-level',
  title: 'Untitled Level',

  // --- Conveyor / Word Input ---
  conveyorSpeed: 1400,     // ms per slot -> ConveyorBelt config.slotDurationMs
  maxLettersOnBelt: 6,     // ConveyorBelt config.maxLetters / useWordInput's maxLetters
  letterPool: null,        // -> ConveyorBelt config.letterPool. null = inherit
                            //    ConveyorBelt's own DEFAULT_LETTER_POOL; set an
                            //    array (e.g. ['A','B','K',...]) on a level to
                            //    restrict/change which letters that level spawns.
  wordDifficulty: {
    minLength: 3,          // -> WordInput LevelConfig's wordRules.minLength
    maxLength: 8,          // -> WordInput LevelConfig's wordRules.maxLength
  },

  // --- Scoring ---
  scoreMultiplier: 1,      // -> useWordInput's levelConfig.scoreMultiplier AND
                            //    useScoreSystem's addScoreFromWord(word, timeBonus, activeMultiplier)
  targetScore: 300,        // -> LevelTimer's targetScore (win condition)

  // --- Pacing ---
  timeLimitSeconds: 60,    // -> LevelTimer's initialTimeInSeconds
  totalCustomers: 5,       // -> useLevelMaker: how many customers before the level is complete
  wordsPerCustomer: 3,     // -> useLevelMaker: correct words needed before a customer counts as served

  // --- Mr. Ratty ---
  rattySpawnRate: 0.15,        // -> useLevelMaker: chance (0-1) he shows up each check
  rattyCheckIntervalMs: 15000, // -> useLevelMaker: how often that chance is rolled
};

export function createLevelConfig(overrides = {}) {
  return {
    ...LEVEL_CONFIG_DEFAULTS,
    ...overrides,
    // Shallow-merge nested objects too, so e.g. passing only
    // { wordDifficulty: { maxLength: 6 } } doesn't wipe out minLength.
    wordDifficulty: {
      ...LEVEL_CONFIG_DEFAULTS.wordDifficulty,
      ...(overrides.wordDifficulty || {}),
    },
  };
}