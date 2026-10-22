import { useState, useCallback } from 'react';

const MONEY_RATE = 0.5;

export function computeStars(finalScore, targetScore) {
  if (!targetScore || finalScore < targetScore) return 0;
  if (finalScore >= targetScore * 2) return 3;
  if (finalScore >= targetScore * 1.5) return 2;
  return 1;
}

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
      onCurrencyEarned?.(Math.max(1, Math.round(earnedPoints * MONEY_RATE)));
      return earnedPoints;
    },
    [onCurrencyEarned, getRewardMultiplier]
  );

  // Hint/riddle bonus on top of a scored word. Returns the points added so
  // callers can flash the reward. Score only goes up, same as addScoreFromWord.
  const addBonusScore = useCallback(
    (points) => {
      const bonus = Math.round(Number(points));
      if (!(bonus > 0)) return 0;
      setScore((prev) => prev + bonus);
      onCurrencyEarned?.(Math.max(1, Math.round(bonus * MONEY_RATE)));
      return bonus;
    },
    [onCurrencyEarned]
  );

  const getStarRating = useCallback(
    (targetScore) => computeStars(score, targetScore),
    [score]
  );

  return { score, addScoreFromWord, addBonusScore, getStarRating };
};