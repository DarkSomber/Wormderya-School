import { createLevelConfig, parseLevelNumber } from './LevelConfig';

export const LEVEL_1_CONFIG = createLevelConfig({
  id: 'level-1',
  title: 'Level 1 — Warm Up',
  conveyorSpeed: 1000, 
  targetScore: 150,
  timeLimitSeconds: 420, 
  totalCustomers: 3,
  wordsPerCustomer: 1,
  scoreMultiplier: 1,
  rattySpawnRate: 0.0,
  wordDifficulty: { minLength: 3, maxLength: 5 },
  tileMode: 'syllable',
  syllablePool: 'basic',
});

export const LEVEL_2_CONFIG = createLevelConfig({
  id: 'level-2',
  title: 'Level 2 — Getting Busy',
  conveyorSpeed: 1000,
  targetScore: 350,
  timeLimitSeconds: 420,
  totalCustomers: 3,
  wordsPerCustomer: 2,
  scoreMultiplier: 1.5,
  rattySpawnRate: 0.08,
  rattyCooldownMS: 60000,
  wordDifficulty: { minLength: 3, maxLength: 6 },
  tileMode: 'syllable',
  syllablePool: 'extended', 
});

export const LEVEL_3_CONFIG = createLevelConfig({
  id: 'level-3',
  title: 'Level 3 — Rush Hour',
  conveyorSpeed: 1000,
  targetScore: 750,
  timeLimitSeconds: 420,
  totalCustomers: 5,
  wordsPerCustomer: 2,
  scoreMultiplier: 2,
  rattySpawnRate: 0.08,
  rattyCooldownMS: 60000,
  wordDifficulty: { minLength: 4, maxLength: 8 },
  tileMode: 'syllable',
  syllablePool: 'extended',
});

export const LEVEL_4_CONFIG = createLevelConfig({
  id: 'level-4',
  title: 'Level 4 — Boss: The Critic',
  isBoss: true,
  conveyorSpeed: 900,
  targetScore: 1200,
  timeLimitSeconds: 420,
  totalCustomers: 5,
  wordsPerCustomer: 3,
  scoreMultiplier: 2.5,
  rattySpawnRate: 0.02,
  wordDifficulty: { minLength: 4, maxLength: 8 },
  tileMode: 'syllable',
  syllablePool: 'extended',
});

export const LEVEL_PRESETS = [LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG, LEVEL_4_CONFIG];

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

export function getLevelNumber(levelRef) {
  return parseLevelNumber(toLevelId(levelRef));
}

export function getAllLevelIds() {
  return LEVEL_PRESETS.map((lvl) => getLevelNumber(lvl.id)).filter((n) => n !== null);
}
export function getNextLevelId(levelRef) {
  const current = getLevelNumber(levelRef);
  if (current === null) return null;
  return hasLevelPreset(current + 1) ? current + 1 : null;
}

export function hasLevelPreset(levelRef) {
  return findPreset(levelRef) !== undefined;
}

export function getLevelConfigById(levelRef) {
  const preset = findPreset(levelRef);
  if (!preset) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(`[levelPresets] No preset for level "${levelRef}" — falling back to ${LEVEL_1_CONFIG.id}.`);
    }
    return LEVEL_1_CONFIG;
  }
  return preset;
}