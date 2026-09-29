/**
 * rushHourConfig
 * --------------
 * Rush Hour is NOT a second gameplay implementation. It is GameplayScreen
 * running with `mode="rushHour"`, and this file is the only place that knows
 * what "Rush Hour difficulty" means. It produces ordinary LevelConfig objects
 * (via createLevelConfig), so the conveyor, word input, scoring, customers and
 * Ratty all keep reading the same fields they read in normal levels.
 *
 * Difficulty source
 *   Stages 1..N (N = number of presets) take their conveyor speed, score
 *   multiplier and word difficulty from LEVEL_PRESETS, so Rush Hour follows
 *   whatever the normal levels are tuned to. Presets are not monotonic (Level 2
 *   is slower than Level 1), so the anchors are made monotonic first
 *   (running-min speed, running-max everything else): Rush Hour only ever gets
 *   harder. Past the last preset, difficulty keeps scaling by small per-stage
 *   steps up to hard caps, so it never stops changing but stays playable.
 *
 * Every tunable number lives in RUSH_HOUR_SETTINGS below. GameplayScreen only
 * reads fields off the config it is given.
 *
 * Rush Hour state (stage, timer bonus, words served) lives inside the
 * GameplayScreen session. Nothing here touches unlockedLevels / currentLevelId.
 */
import { createLevelConfig, DEFAULT_BELTS } from './LevelConfig';
import { LEVEL_PRESETS } from './levelPresets';

export const RUSH_HOUR_SETTINGS = {
  id: 'rush-hour', // constant: the same id for every stage (GameplayScreen keys the session on it)
  title: 'Rush Hour',

  // --- Stage pacing ---
  wordsPerStage: 3,          // correct words needed to reach the next stage

  // --- Timer ---
  startingTimeSeconds: 30,   // clock at the start of a run
  maxTimeSeconds: 40,        // the clock can never be restored above this
  baseTimeBonusSeconds: 5,   // seconds restored per correct word at stage 1
  minTimeBonusSeconds: 3,    // the restore shrinks with stage, never below this
  stagesPerBonusStep: 3,     // the restore drops by 1s every this many stages

  // --- Scaling past the hardest preset (per stage beyond the last preset) ---
  speedStepMs: 40,           // conveyor slotDurationMs decreases by this per stage
  minConveyorSpeedMs: 600,   // fastest belt allowed
  multiplierStep: 0.25,      // scoreMultiplier increase per stage
  maxScoreMultiplier: 4,
  stagesPerMinLengthStep: 4, // wordDifficulty.minLength +1 every this many stages
  maxMinWordLength: 6,

  // --- Customer patience (time pressure) ---
  basePatienceDecayMs: 4000, // same as CustomerMood's default
  patienceDecayStepMs: 150,  // patience drains faster by this much per stage
  minPatienceDecayMs: 2200,

  // --- Letter generation (existing per-belt minVisibleVowels) ---
  stagesPerVowelFloorStep: 4, // each belt's vowel floor drops by 1 every this many stages
  minVowelFloorMiddleBelt: 1, // belt 2 is the vowel-rich belt; keep at least this many

  // --- Mr. Ratty (see useLevelMaker: rate is rolled every interval, at most one
  //     encounter at a time, and never inside the cooldown window) ---
  rattySpawnRate: 0.08,        // normal levels: 0.15 - 0.25
  rattyCheckIntervalMs: 20000, // normal levels: 15000
  rattyCooldownMs: 60000,      // min gap between encounters, also after run start
};

/** 1-based Rush Hour stage after `wordsServed` correct words this run. */
export function getRushHourStageForWords(wordsServed) {
  const perStage = Math.max(1, RUSH_HOUR_SETTINGS.wordsPerStage);
  return 1 + Math.floor(Math.max(0, wordsServed) / perStage);
}

// Monotonic anchors from the normal presets: index i = Rush Hour stage i + 1.
function buildAnchors() {
  const anchors = [];
  let speed = Infinity;
  let multiplier = 0;
  let minLength = 0;
  let maxLength = 0;
  for (const preset of LEVEL_PRESETS) {
    speed = Math.min(speed, preset.conveyorSpeed);
    multiplier = Math.max(multiplier, preset.scoreMultiplier);
    minLength = Math.max(minLength, preset.wordDifficulty.minLength);
    maxLength = Math.max(maxLength, preset.wordDifficulty.maxLength);
    anchors.push({ speed, multiplier, minLength, maxLength });
  }
  return anchors;
}

const ANCHORS = buildAnchors();

/**
 * LevelConfig for one Rush Hour stage (stage >= 1, no upper limit).
 * Extra fields read only in rushHour mode: maxTimeSeconds, timeBonusSeconds.
 */
export function getRushHourLevelConfig(stage = 1) {
  const s = RUSH_HOUR_SETTINGS;
  const n = Math.max(1, Math.floor(stage));
  const last = ANCHORS.length - 1;

  // Difficulty from presets, then controlled scaling past the last one.
  const anchor = ANCHORS[Math.min(n - 1, last)];
  const beyond = Math.max(0, n - ANCHORS.length); // stages past the hardest preset

  const conveyorSpeed = Math.max(s.minConveyorSpeedMs, anchor.speed - beyond * s.speedStepMs);
  const scoreMultiplier = Math.min(s.maxScoreMultiplier, anchor.multiplier + beyond * s.multiplierStep);
  const minLength = Math.min(
    Math.max(s.maxMinWordLength, anchor.minLength), // never lower than a preset already asks for
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

  // Letter generation: lower each belt's vowel floor as stages pass.
  // Only minVisibleVowels changes; letterDistribution and per-belt letter
  // counts stay exactly as LevelConfig defines them.
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

    // Endless: no customer quota and no score target.
    totalCustomers: Number.POSITIVE_INFINITY,
    wordsPerCustomer: 2,
    targetScore: 0,

    // Timer
    timeLimitSeconds: s.startingTimeSeconds,
    maxTimeSeconds: s.maxTimeSeconds,
    timeBonusSeconds,

    // Ratty
    rattySpawnRate: s.rattySpawnRate,
    rattyCheckIntervalMs: s.rattyCheckIntervalMs,
    rattyCooldownMs: s.rattyCooldownMs,
  });
}