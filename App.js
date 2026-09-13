import React, { useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import ModeSelectScreen from "./screens/ModeSelectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import StoryBackstoryScreen from "./screens/StoryBackstoryScreen";
import GameplayScreen from "./screens/GameplayScreen";

/**
 * Very small hand-rolled screen switcher so this demo doesn't require
 * pulling in React Navigation. Swap this for a real navigator
 * (e.g. @react-navigation/native-stack) whenever you're ready — each
 * screen's props map directly onto navigation actions.
 */
const SCREENS = {
  HOME: "HOME",
  MODE_SELECT: "MODE_SELECT",
  SETTINGS: "SETTINGS",
  LEVEL_SELECT: "LEVEL_SELECT",
  STORY_BACKSTORY: "STORY_BACKSTORY",
  GAMEPLAY: "GAMEPLAY",
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.HOME);

  switch (screen) {
    case SCREENS.MODE_SELECT:
      return (
        <ModeSelectScreen
          onSelectStoryMode={() => setScreen(SCREENS.LEVEL_SELECT)}
          onSelectRushHour={() => {
            // TODO: navigate into Rush Hour Mode gameplay
            console.log("Rush Hour Mode selected");
          }}
          onBack={() => setScreen(SCREENS.HOME)}
        />
      );

    case SCREENS.SETTINGS:
      return <SettingsScreen onBack={() => setScreen(SCREENS.HOME)} />;

    case SCREENS.LEVEL_SELECT:
      return (
        <LevelSelectScreen
          onSelectLevel={(levelId) => {
            if (levelId === 1) {
              // Level 1 plays its backstory intro first.
              setScreen(SCREENS.STORY_BACKSTORY);
            } else {
              // TODO: other levels currently just log — send them
              // straight into gameplay (or their own intro) once ready.
              console.log(`Level ${levelId} selected`);
            }
          }}
          onBack={() => setScreen(SCREENS.MODE_SELECT)}
        />
      );

    case SCREENS.STORY_BACKSTORY:
      return (
        <StoryBackstoryScreen onFinish={() => setScreen(SCREENS.GAMEPLAY)} />
      );

    case SCREENS.GAMEPLAY:
      return <GameplayScreen onBack={() => setScreen(SCREENS.LEVEL_SELECT)} />;

    case SCREENS.HOME:
    default:
      return (
        <HomeScreen
          onStart={() => setScreen(SCREENS.MODE_SELECT)}
          onOpenSettings={() => setScreen(SCREENS.SETTINGS)}
          onQuit={() => {
            // TODO: handle quit (e.g. close app, or show confirmation)
            console.log("Quit pressed");
          }}
        />
      );
  }
}
