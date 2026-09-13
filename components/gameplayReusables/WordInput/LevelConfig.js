/**
 * Per-level configuration for the Word Input / Score systems. Pass a
 * partial override into useWordInput(conveyorRefs, { scoreMultiplier: 2 })
 * — anything you don't override falls back to these defaults.
 *
 * conveyorSpeed / letterPool are listed here for completeness (per the
 * original spec's LevelConfig shape) but aren't consumed by this module —
 * they'd be forwarded to each ConveyorBelt's own `config` prop by
 * whatever screen wires a level together.
 */
export const DEFAULT_LEVEL_CONFIG = {
  conveyorSpeed: null,
  letterPool: null,
  scoreMultiplier: 1,
  wordRules: {
    minLength: 2,
  },
};