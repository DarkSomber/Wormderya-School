import React from "react";
import SlideshowSequence from "../components/SlideshowSequence";

/**
 * StoryBackstoryScreen
 * ----------------------------------------------------------------------
 * Shown when the player selects Level 1 from LevelSelectScreen. Five
 * placeholder slides the player pages through with "Next", ending on
 * `onFinish` (which App.js sends into the gameplay screen).
 *
 * This reuses the same SlideshowSequence component that will later
 * power the game's ending cutscene — just swap in a different `slides`
 * array over there.
 * ----------------------------------------------------------------------
 */

// One entry per slide. Add the real art later like:
//   { id: '1', image: require('../../assets/story/backstory-1.png') }
const BACKSTORY_SLIDES = [
  {
    id: "1",
    image: require("../assets/Final/BackstoryScreens/Backstory-Panel-1.1.png"),
  },
  {
    id: "2",
    image: require("../assets/Final/BackstoryScreens/Backstory-Panel-1.2.png"),
  },
  {
    id: "3",
    image: require("../assets/Final/BackstoryScreens/Backstory-Panel-2.png"),
  },
  {
    id: "4",
    image: require("../assets/Final/BackstoryScreens/Backstory-Panel-3.png"),
  },
  {
    id: "5",
    image: require("../assets/Final/BackstoryScreens/Backstory-Panel-4.png"),
  },
];

export default function StoryBackstoryScreen({ onFinish }) {
  return <SlideshowSequence slides={BACKSTORY_SLIDES} onComplete={onFinish} />;
}
