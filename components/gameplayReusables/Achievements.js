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
  FINISH_LEVEL_ONE: {
    id: "finish-level-1",
    title: "First Bite!",
    description: "Complete level 1. Nothing like a fresh start in the province",
    coinReward: 10,
    icon: require("../../assets/Final/Achieve1.png"),
  },

  FINISH_LEVEL_TWO: {
    id: "finish-level-2",
    title: "Getting Started",
    description: "Complete level 2. The karinderya is slowly growing ",
    coinReward: 15,
    icon: require("../../assets/Final/Achieve2.png"),
  },

  FINISH_LEVEL_THREE: {
    id: "finish-level-3",
    title: "Grandma's Happy!",
    description:
      "Complete level 3. Grandma is glad that her dear karinderya is still afloat.",
    coinReward: 15,
    icon: require("../../assets/Final/Achieve3.png"),
  },

  BOSS_LEVEL_FINISH: {
    id: "finish-boss-level",
    title: "Inherited Through Love",
    description: "Complete the final level and defeat the critic.",
    coinReward: 100,
    icon: require("../../assets/Final/Achieve4.png"),
  },
};
