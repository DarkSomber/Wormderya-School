/**
 * Test letter pool for the conveyor prototype. Swap this out for the
 * formal Tagalog letter set (or generate it from the word database) once
 * the Word Input System and dictionary are in place — nothing else in
 * the conveyor needs to change to support that swap, since ConveyorBelt
 * only ever pulls from `config.letterPool`.
 */
export const DEFAULT_LETTER_POOL = [
  'A', 'B', 'K', 'D', 'E', 'G', 'H', 'I', 'L',
  'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'W', 'Y',
];
 
export function pickRandomLetter(pool = DEFAULT_LETTER_POOL) {
  return pool[Math.floor(Math.random() * pool.length)];
}