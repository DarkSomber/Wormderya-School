import { DEFAULT_LETTER_POOL } from './Letterpool';

export const DEFAULT_CONVEYOR_CONFIG = {
  slotDurationMs: 2000,

  direction: 'ltr',

  letterPool: DEFAULT_LETTER_POOL,

  letterDistribution: 'balanced',

  minVisibleVowels: 1,

  flyDy: 0,

  slotWidth: 70,
  slotHeight: 50,

  maxLetters: 6,
};