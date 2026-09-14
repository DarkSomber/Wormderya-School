import { useState, useCallback } from 'react';

export const useScoreSystem = (initialCurrency = 0) => {
  const [score, setScore] = useState(0);
  const [playerCurrency, setPlayerCurrency] = useState(initialCurrency);

  /**
   * Called whenever the word input system validates a correct word
   * @param {string} word - The valid formed word submitted by the player
   * @param {number} timeBonus - Multiplier or bonus based on speed
   * @param {number} activeMultiplier - Upgrade/Power-up modifier multiplier
   * @returns {number} points earned (0 if the word was invalid/too short)
   */
  const addScoreFromWord = useCallback((word, timeBonus = 1, activeMultiplier = 1) => {
    // Guard: per the game rules, anything shorter than 3 letters is invalid
    // and shouldn't award points, and a missing word shouldn't crash scoring.
    if (!word || word.length < 3) return 0;

    const basePoints = word.length * 10; // e.g., 5-letter word = 50 pts
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

  return {
    score,
    playerCurrency,
    addScoreFromWord,
    deductScore,
    resetLevelScore,
    setScore,
    setPlayerCurrency, // exposed so the Ratty/store screen can spend currency
  };
};