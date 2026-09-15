/**
 * levelPresets
 * ------------
 * The "boilerplates" — default LevelConfig instances you duplicate and
 * tweak when adding a new stage. Add LEVEL_4_CONFIG etc. the same way
 * and push it into LEVEL_PRESETS below; nothing else needs to change.
 */
import { createLevelConfig } from './LevelConfig';

export const LEVEL_1_CONFIG = createLevelConfig({
  id: 'level-1',
  title: 'Level 1 — Warm Up',
  conveyorSpeed: 1000, //For testing | original num is 1300
  targetScore: 50,//For testing | original num is 150
  timeLimitSeconds: 60, //For testing | original num is 180 or 3 minutes
  totalCustomers: 1,//For testing | original num is 3
  wordsPerCustomer: 1,//For testing | original num is 2
  scoreMultiplier: 1,
  rattySpawnRate: 0.10,
  wordDifficulty: { minLength: 3, maxLength: 5 },
});

export const LEVEL_2_CONFIG = createLevelConfig({
  id: 'level-2',
  title: 'Level 2 — Getting Busy',
  conveyorSpeed: 1300,
  targetScore: 350,
  timeLimitSeconds: 60,
  totalCustomers: 5,
  wordsPerCustomer: 3,
  scoreMultiplier: 1.5,
  rattySpawnRate: 0.15,
  wordDifficulty: { minLength: 3, maxLength: 6 },
});

export const LEVEL_3_CONFIG = createLevelConfig({
  id: 'level-3',
  title: 'Level 3 — Rush Hour',
  conveyorSpeed: 1000,
  targetScore: 500,
  timeLimitSeconds: 75,
  totalCustomers: 8,
  wordsPerCustomer: 3,
  scoreMultiplier: 2,
  rattySpawnRate: 0.25,
  wordDifficulty: { minLength: 4, maxLength: 8 },
});

export const LEVEL_PRESETS = [LEVEL_1_CONFIG, LEVEL_2_CONFIG, LEVEL_3_CONFIG];

export function getLevelConfigById(id) {
  return LEVEL_PRESETS.find((lvl) => lvl.id === id) ?? LEVEL_1_CONFIG;
}
