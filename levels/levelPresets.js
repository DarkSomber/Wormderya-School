import { createLevelConfig, parseLevelNumber } from './LevelConfig';

export const LEVEL_1_CONFIG = createLevelConfig({
  id: 'level-1',
  title: 'Level 1 — Warm Up',
  conveyorSpeed: 1000, // Testing; original: 1300
  targetScore: 150,// Testing; original: 150
  timeLimitSeconds: 300, 
  totalCustomers: 2,// Testing; original: 3
  wordsPerCustomer: 1,// Testing; original: 2
  scoreMultiplier: 1,
  rattySpawnRate: 0.0,
  wordDifficulty: { minLength: 3, maxLength: 5 },
  tileMode: 'syllable',
  syllablePool: 'basic',    // 30 syllables: B K L M S T x A E I O U (top belt only)
});

export const LEVEL_2_CONFIG = createLevelConfig({
  id: 'level-2',
  title: 'Level 2 — Getting Busy',
  conveyorSpeed: 1000,
  targetScore: 350,
  timeLimitSeconds: 180,
  totalCustomers: 5,
  wordsPerCustomer: 3,
  scoreMultiplier: 1.5,
  rattySpawnRate: 0.15,
  wordDifficulty: { minLength: 3, maxLength: 6 },
  tileMode: 'syllable',
  syllablePool: 'extended', // 70 syllables: wider variety than Level 1 (top belt only)
});

export const LEVEL_3_CONFIG = createLevelConfig({
  id: 'level-3',
  title: 'Level 3 — Rush Hour',
  conveyorSpeed: 1000,
  targetScore: 500,
  timeLimitSeconds: 300,
  totalCustomers: 8,
  wordsPerCustomer: 3,
  scoreMultiplier: 2,
  rattySpawnRate: 0.25,
  wordDifficulty: { minLength: 4, maxLength: 8 },
  tileMode: 'syllable',
  syllablePool: 'extended',
});

// Boss level (Level 4 on LevelSelectScreen). `isBoss` keeps it out of Rush Hour's difficulty anchors
// and marks it as the level that leads to the ending. No Ratty: the boss screen has no shop popup.
export const LEVEL_4_CONFIG = createLevelConfig({
  id: 'level-4',
  title: 'Level 4 — Boss: The Critic',
  isBoss: true,
  conveyorSpeed: 900,
  targetScore: 700,
  timeLimitSeconds: 300,
  totalCustomers: 10,
  wordsPerCustomer: 3,
  scoreMultiplier: 2.5,
  rattySpawnRate: 0,
  wordDifficulty: { minLength: 4, maxLength: 8 },
  tileMode: 'syllable',
  syllablePool: 'extended',
});

export const LEVEL_PRESETS = [LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG, LEVEL_4_CONFIG];

/** 1, '2' or 'level-3' -> preset id ('level-N'); anything else -> null. */
export function toLevelId(levelRef) {
  if (typeof levelRef === 'number' && Number.isInteger(levelRef)) {
    return `level-${levelRef}`;
  }
  if (typeof levelRef === 'string' && levelRef.length > 0) {
    return /^\d+$/.test(levelRef) ? `level-${levelRef}` : levelRef;
  }
  return null;
}

function findPreset(levelRef) {
  const id = toLevelId(levelRef);
  return id === null ? undefined : LEVEL_PRESETS.find((lvl) => lvl.id === id);
}

/** 'level-3', 3 or '3' -> 3; null if not a level id. */
export function getLevelNumber(levelRef) {
  return parseLevelNumber(toLevelId(levelRef));
}

/** Numbers of every level that has a preset, e.g. [1, 2, 3]. */
export function getAllLevelIds() {
  return LEVEL_PRESETS.map((lvl) => getLevelNumber(lvl.id)).filter((n) => n !== null);
}

/** Number of the next level, or null if it has no preset (drives unlocking). */
export function getNextLevelId(levelRef) {
  const current = getLevelNumber(levelRef);
  if (current === null) return null;
  return hasLevelPreset(current + 1) ? current + 1 : null;
}

/** True if a preset exists for this level. */
export function hasLevelPreset(levelRef) {
  return findPreset(levelRef) !== undefined;
}

/**
 * Returns the preset for 1, '1' or 'level-1'. Unknown levels fall back to
 * Level 1 and warn in dev.
 */
export function getLevelConfigById(levelRef) {
  const preset = findPreset(levelRef);
  if (!preset) {
    // eslint-disable-next-line no-undef
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[levelPresets] No preset for level "${levelRef}" — falling back to ${LEVEL_1_CONFIG.id}.`);
    }
    return LEVEL_1_CONFIG;
  }
  return preset;
}