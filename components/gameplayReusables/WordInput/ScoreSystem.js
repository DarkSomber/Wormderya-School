export function baseScoreForWord(word) {
  return word.length * 10;
}

export function calculateScore(word, multiplier = 1) {
  return baseScoreForWord(word) * multiplier;
}