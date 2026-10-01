import { useState, useCallback } from 'react';

export function computeStars(finalScore, targetScore) {
  if (!targetScore || finalScore < targetScore) return 0;
  if (finalScore >= targetScore * 2) return 3;
  if (finalScore >= targetScore * 1.5) return 2;
  return 1;
}

/**
 * useScoreSystem({ onCurrencyEarned, getRewardMultiplier })
 * Owns in-level SCORE only (can only go up). Currency lives in useWallet.
 * `getRewardMultiplier` is called fresh per word so live upgrade
 * multipliers apply without re-creating addScoreFromWord.
 */
export const useScoreSystem = ({ onCurrencyEarned, getRewardMultiplier } = {}) => {
  const [score, setScore] = useState(0);

  const addScoreFromWord = useCallback(
    (word, timeBonus = 1, activeMultiplier = 1) => {
      if (!word || word.length < 3) return 0;
      const basePoints = 50;
      const upgradeMult = getRewardMultiplier ? getRewardMultiplier() : 1;
      const earnedPoints = Math.round(
        basePoints * timeBonus * activeMultiplier * upgradeMult
      );
      if (!(earnedPoints > 0)) return 0;

      setScore((prev) => prev + earnedPoints);
      onCurrencyEarned?.(earnedPoints);
      return earnedPoints;
    },
    [onCurrencyEarned, getRewardMultiplier]
  );

  const getStarRating = useCallback(
    (targetScore) => computeStars(score, targetScore),
    [score]
  );

  return { score, addScoreFromWord, getStarRating };
};