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

  conveyorSpeed: 1400,
  maxLettersOnBelt: 6,
  inputBoxCount: 11,
  slotHoldMs: 3000,
  letterPool: null,
  tileMode: TILE_MODES.LETTER,
  syllablePool: 'basic',
  syllableBelts: [0],
  belts: DEFAULT_BELTS,
  spawnAssist: { targetChance: 0.4, pityStep: 0.15, decoyEcho: 0.35 },
  wordDifficulty: {
    minLength: 3,
    maxLength: 8,
  },

  scoreMultiplier: 1,
  targetScore: 300,

  timeLimitSeconds: 60,
  totalCustomers: 5,
  wordsPerCustomer: 3,
  patienceDecayMs: 4000,

  rattySpawnRate: 0.15,
  rattyCheckIntervalMs: 15000,
  rattyCooldownMs: 0,
};

export function createLevelConfig(overrides = {}) {
  const config = {
    ...LEVEL_CONFIG_DEFAULTS,
    ...overrides,
    wordDifficulty: {
      ...LEVEL_CONFIG_DEFAULTS.wordDifficulty,
      ...(overrides.wordDifficulty || {}),
    },
    belts: DEFAULT_BELTS.map((base, i) => ({
      ...base,
      ...((overrides.belts || [])[i] || {}),
    })),
  };
  return { ...config, tileMode: resolveTileMode(config) };
}

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
      letterDistribution: null,
      minVisibleVowels: 0,
    };
  }

  return {
    ...base,
    ...(levelConfig.letterPool ? { letterPool: levelConfig.letterPool } : {}),
    ...(belt.letterDistribution ? { letterDistribution: belt.letterDistribution } : {}),
    ...(belt.minVisibleVowels !== undefined ? { minVisibleVowels: belt.minVisibleVowels } : {}),
  };
}