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

/**
 * useScoreSystem(onCurrencyEarned)
 * ----------------------------------
 * Owns the IN-LEVEL score only. Currency used to live here too
 * (playerCurrency), but it moved out to UseWallet.js — currency has to
 * survive LevelSession remounts (retries, new levels) and trips to the
 * Store, while score deliberately resets every attempt.
 *
 * onCurrencyEarned is how a correct word still reaches the wallet
 * without this hook needing to know the wallet exists — GameplayScreen
 * wires it to `() => wallet.addCurrency(CURRENCY_PER_WORD)`.
 *
 * @param {() => void} [onCurrencyEarned] - called once per valid word
 */
export const useScoreSystem = (onCurrencyEarned) => {
  const [score, setScore] = useState(0);

  const addScoreFromWord = useCallback((word, timeBonus = 1, activeMultiplier = 1) => {
    if (!word || word.length < 3) return 0;

    const basePoints = 50; // flat +50 per correct word
    const earnedPoints = Math.round(basePoints * timeBonus * activeMultiplier);

    setScore((prevScore) => prevScore + earnedPoints);
    onCurrencyEarned?.(); // wallet lives above this hook now — see UseWallet.js

    return earnedPoints;
  }, [onCurrencyEarned]);

  const deductScore = useCallback((amount) => {
    setScore((prev) => Math.max(0, prev - amount));
  }, []);

  const resetLevelScore = useCallback(() => {
    setScore(0);
  }, []);

  const getStarRating = useCallback((targetScore) => {
    return computeStars(score, targetScore);
  }, [score]);

  return {
    score,
    addScoreFromWord,
    deductScore,
    resetLevelScore,
    getStarRating,
    setScore,
  };
};