/**
 * Achievements.js
 * ---------------
 * The list of achievements that exist in the game. Purely data — no
 * logic about WHEN one unlocks. That's decided at the call site
 * (GameplayScreen, useLevelMaker, wherever the condition is actually
 * known) by calling achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD).
 *
 * Add a new achievement by adding a new entry here — same idea as
 * adding a new level to levels/levelPresets.js.
 */
 
export const ACHIEVEMENTS = {
  FIRST_WORD: {
    id: 'first-word',
    title: 'First Bite!',
    description: 'Served your very first word.',
    coinReward: 10,
  },
  NO_MISSES: {
    id: 'no-misses',
    title: 'Perfect Plate',
    description: 'Finished a level without a single wrong word.',
    coinReward: 25,
  },
};
 