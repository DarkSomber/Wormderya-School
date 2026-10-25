import { createLevelConfig, DEFAULT_BELTS } from './LevelConfig';
import { LEVEL_PRESETS } from './levelPresets';

export const RUSH_HOUR_SETTINGS = {
  id: 'rush-hour', 
  title: 'Rush Hour',

  wordsPerStage: 4,          // correct words needed to reach the next stage

  startingTimeSeconds: 60,   // default time run
  maxTimeSeconds: 120,        // the clock can never be restored above this
  baseTimeBonusSeconds: 8,   // seconds restored per correct word at stage 1
  minTimeBonusSeconds: 5,    // the restore shrinks with stage, never below this
  stagesPerBonusStep: 4,     // the restore drops by 1s every this many stages

  speedStepMs: 25,           // conveyor slotDurationMs decreases by this per stage
  minConveyorSpeedMs: 600,   // fastest belt allowed
  multiplierStep: 0.25,      // scoreMultiplier increase per stage
  maxScoreMultiplier: 4,
  stagesPerMinLengthStep: 4, // wordDifficulty.minLength +1 every this many stages
  maxMinWordLength: 11,

  basePatienceDecayMs: 5000, // same as CustomerMood's default
  patienceDecayStepMs: 100,  // patience drains faster by this much per stage
  minPatienceDecayMs: 3000,


  stagesPerVowelFloorStep: 4, // each belt's vowel floor drops by 1 every this many stages
  minVowelFloorMiddleBelt: 1, // belt 2 is the vowel-rich belt; keep at least this many

  extendedSyllablesFromStage: 2, // stage 1 uses the 'basic' pool; this stage and later use 'extended'

  rattySpawnRate: 0.08,        // normal levels: 0.15 - 0.25
  rattyCheckIntervalMs: 20000, // normal levels: 15000
  rattyCooldownMs: 60000,      // min gap between encounters, also after run start

  bossAfterCustomers: 3,     // the boss comes after every 3rd customer
  bossBonusRatio: 1,         // boss riddle bonus = this x the word's points (normal hint: 0.3)
};

// Customer slots cycle: 3 regular customers, then the boss (slots 4, 8, 12...).
export function isRushHourBoss(customerIndex) {
  const every = Math.max(1, RUSH_HOUR_SETTINGS.bossAfterCustomers);
  return (customerIndex + 1) % (every + 1) === 0;
}

export function getRushHourStageForWords(wordsServed) {
  const perStage = Math.max(1, RUSH_HOUR_SETTINGS.wordsPerStage);
  return 1 + Math.floor(Math.max(0, wordsServed) / perStage);
}

function buildAnchors() {
  const anchors = [];
  let speed = Infinity;
  let multiplier = 0;
  let minLength = 0;
  let maxLength = 0;
  for (const preset of LEVEL_PRESETS.filter((p) => !p.isBoss)) { 
    speed = Math.min(speed, preset.conveyorSpeed);
    multiplier = Math.max(multiplier, preset.scoreMultiplier);
    minLength = Math.max(minLength, preset.wordDifficulty.minLength);
    maxLength = Math.max(maxLength, preset.wordDifficulty.maxLength);
    anchors.push({ speed, multiplier, minLength, maxLength });
  }
  return anchors;
}

const ANCHORS = buildAnchors();

export function getRushHourLevelConfig(stage = 1) {
  const s = RUSH_HOUR_SETTINGS;
  const n = Math.max(1, Math.floor(stage));
  const last = ANCHORS.length - 1;

  const anchor = ANCHORS[Math.min(n - 1, last)];
  const beyond = Math.max(0, n - ANCHORS.length); 

  const conveyorSpeed = Math.max(s.minConveyorSpeedMs, anchor.speed - beyond * s.speedStepMs);
  const scoreMultiplier = Math.min(s.maxScoreMultiplier, anchor.multiplier + beyond * s.multiplierStep);
  const minLength = Math.min(
    Math.max(s.maxMinWordLength, anchor.minLength), 
    anchor.minLength + Math.floor(beyond / s.stagesPerMinLengthStep),
  );

  const timeBonusSeconds = Math.max(
    s.minTimeBonusSeconds,
    s.baseTimeBonusSeconds - Math.floor((n - 1) / s.stagesPerBonusStep),
  );
  const patienceDecayMs = Math.max(
    s.minPatienceDecayMs,
    s.basePatienceDecayMs - (n - 1) * s.patienceDecayStepMs,
  );

  const vowelStep = Math.floor((n - 1) / s.stagesPerVowelFloorStep);
  const belts = DEFAULT_BELTS.map((belt, i) => ({
    minVisibleVowels: Math.max(i === 1 ? s.minVowelFloorMiddleBelt : 0, belt.minVisibleVowels - vowelStep),
  }));

  return createLevelConfig({
    id: s.id,
    title: s.title,

    conveyorSpeed,
    scoreMultiplier,
    wordDifficulty: { minLength, maxLength: anchor.maxLength },
    belts,
    patienceDecayMs,

    tileMode: 'syllable',
    syllablePool: n >= s.extendedSyllablesFromStage ? 'extended' : 'basic',

    totalCustomers: Number.POSITIVE_INFINITY,
    wordsPerCustomer: 2,
    targetScore: 0,

    timeLimitSeconds: s.startingTimeSeconds,
    maxTimeSeconds: s.maxTimeSeconds,
    timeBonusSeconds,

    rattySpawnRate: s.rattySpawnRate,
    rattyCheckIntervalMs: s.rattyCheckIntervalMs,
    rattyCooldownMs: s.rattyCooldownMs,
  });
}