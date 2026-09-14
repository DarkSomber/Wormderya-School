/**
 * ScoreSystem
 * -----------
 * Turns a validated word into a number. Deliberately dumb for this
 * stage (10 points per letter) — the important part is that the
 * multiplier is never hard-coded here; it's always passed in from a
 * LevelConfig, so a level designer can change difficulty/reward without
 * touching this file.
 */
export function baseScoreForWord(word) {
  return word.length * 10;
}

export function calculateScore(word, multiplier = 1) {
  return baseScoreForWord(word) * multiplier;
}