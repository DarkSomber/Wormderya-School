import { useState, useCallback } from 'react';

/**
 * computeStars(finalScore, targetScore)
 * ---------------------------------------
 * Pure function, no state — lives here (not in the end-screen component)
 * because star rating is a scoring rule, same as multipliers/base points.
 * Exported so LevelEndSequence (or anything else) can call it without
 * duplicating the thresholds.
 *
 *   0 stars — didn't reach targetScore
 *   1 star  — reached targetScore
 *   2 stars — reached 1.5x targetScore
 *   3 stars — reached 2x targetScore
 */
export function computeStars(finalScore, targetScore) {
  if (!targetScore || finalScore < targetScore) return 0;
  if (finalScore >= targetScore * 2) return 3;
  if (finalScore >= targetScore * 1.5) return 2;
  return 1;
}

export const useScoreSystem = (initialCurrency = 0) => {
  const [score, setScore] = useState(0);
  const [playerCurrency, setPlayerCurrency] = useState(initialCurrency);

  /**
   * Called whenever the word input system validates a correct word
   * @param {string} word - The valid formed word submitted by the player
   * @param {number} timeBonus - Multiplier or bonus based on speed
   * @param {number} activeMultiplier - Upgrade/Power-up modifier, or the
   *   active LevelConfig's scoreMultiplier — same param, either source
   * @returns {number} points earned (0 if the word was invalid/too short)
   */
  const addScoreFromWord = useCallback((word, timeBonus = 1, activeMultiplier = 1) => {
    // Guard: per the game rules, anything shorter than 3 letters is invalid
    // and shouldn't award points, and a missing word shouldn't crash scoring.
    if (!word || word.length < 3) return 0;

    const basePoints = 50; // flat +50 per correct word
    const earnedPoints = Math.round(basePoints * timeBonus * activeMultiplier);

    setScore((prevScore) => prevScore + earnedPoints);
    setPlayerCurrency((prevCurrency) => prevCurrency + earnedPoints); // Currency used for Ratty shop

    return earnedPoints;
  }, []);

  const deductScore = useCallback((amount) => {
    setScore((prev) => Math.max(0, prev - amount));
  }, []);

  /**
   * Resets the in-level score (e.g. when the player hits "Retry level"
   * on the Lose Screen) WITHOUT touching playerCurrency, since currency
   * is meant to persist between attempts/levels.
   */
  const resetLevelScore = useCallback(() => {
    setScore(0);
  }, []);

  /**
   * Star rating for the CURRENT score against a given targetScore
   * (usually levelConfig.targetScore). Recomputes on every call rather
   * than being stored in state, since it's always fully derived from
   * `score` — nothing to get out of sync.
   */
  const getStarRating = useCallback((targetScore) => {
    return computeStars(score, targetScore);
  }, [score]);

  return {
    score,
    playerCurrency,
    addScoreFromWord,
    deductScore,
    resetLevelScore,
    getStarRating,
    setScore,
    setPlayerCurrency, // exposed so the Ratty/store screen can spend currency
  };
};