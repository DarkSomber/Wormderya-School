import { DEFAULT_LETTER_POOL } from './Letterpool';

/**
 * Central tuning knobs for a ConveyorBelt instance. Override any subset
 * via the `config` prop:
 *
 *   <ConveyorBelt config={{ slotDurationMs: 900, maxLetters: 7 }} />
 *
 * Later this can grow into a per-level LevelConfig (wordDatabase,
 * scoreMultiplier, levelRules, ...) without ConveyorBelt itself changing.
 */
export const DEFAULT_CONVEYOR_CONFIG = {
  // Time (ms) for the belt to travel exactly one slot's width.
  // Lower = faster belt.
  slotDurationMs: 1400,

  // Visual scroll direction, No way to access yet, Note to self/next programmer: find a way to access it.
  direction: 'ltr', // 'ltr' | 'rtl'

  // Characters the belt can spawn. Swap for the Tagalog word-database
  // pool later — nothing else here needs to change.
  letterPool: DEFAULT_LETTER_POOL,

  // Reserved width/height (px) per letter tile.
  slotWidth: 70,
  slotHeight: 50,

  // How many letter slots are visible on the belt at once. (Internally
  // ConveyorBelt tracks one extra buffer letter off-screen for a smooth
  // wrap-around — that's an implementation detail, not configured here.)
  maxLetters: 6,
};