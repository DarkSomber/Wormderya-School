/**
 * Achievements.js
 * ---------------
 * The list of achievements that exist in the game. 
 * calling achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD) 
 * as a syntax to make it work
 *
 * Functions like levels/levelPresets.js. Just create the achievements through here
 */
 
export const ACHIEVEMENTS = {
  FIRST_WORD: {
    id: 'first-word',
    title: 'First Bite!',
    description: 'Served your very first word.',
    coinReward: 10,
  },
  FIRST_PURCHASE: {
    id: 'first-purchase',
    title: 'Big Spender',
    description: 'Bought your first item from Mr. Ratty.',
    coinReward: 15,
  },

};
 