/**
 * ScoreSystem
 * -----------
 * Turns a validated word into a number.
 * Multiplier can be set by developers from other js so it's
 * not hardcoded
 */
export function baseScoreForWord(word) {
  return word.length * 10;
}

export function calculateScore(word, multiplier = 1) {
  return baseScoreForWord(word) * multiplier;
}