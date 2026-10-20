import React from "react";
import SlideshowSequence from "../components/SlideshowSequence";

const ENDING_SLIDES = [
  {
    id: "1",
    image: require("../assets/Final/EndingScreens/EndingPanel1.png"),
  },
  {
    id: "2",
    image: require("../assets/Final/EndingScreens/EndingPanel2.png"),
  },
  {
    id: "3",
    image: require("../assets/Final/EndingScreens/EndingPanel3.png"),
  },
  {
    id: "4",
    image: require("../assets/Final/EndingScreens/EndingPanel4.png"),
  },
];

export default function StoryEndingScreen({ onFinish }) {
  return <SlideshowSequence slides={ENDING_SLIDES} onComplete={onFinish} />;
}
