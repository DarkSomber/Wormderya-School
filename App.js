import React, { useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ModeSelectScreen from "./screens/ModeSelectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import StoryBackstoryScreen from "./screens/StoryBackstoryScreen";
import GameplayScreen from "./screens/GameplayScreen";

/* Placeholder components */
import QuitModal from "./QuitModal";
import RushHourModal from "./RushHourModal";
import StoreScreen from "./StoreScreen";
import PlaceholderGameplay from "./GameplayScreen";

/**
 * Very small hand-rolled screen switcher so this demo doesn't require
 * pulling in React Navigation. Swap this for a real navigator
 * (e.g. @react-navigation/native-stack) whenever you're ready — each
 * screen's props map directly onto navigation actions.
 */
const SCREENS = {
  SPLASH: "SPLASH",
  HOME: "HOME",
  MODE_SELECT: "MODE_SELECT",
  SETTINGS: "SETTINGS",
  LEVEL_SELECT: "LEVEL_SELECT",
  STORY_BACKSTORY: "STORY_BACKSTORY",
  GAMEPLAY: "GAMEPLAY",
  PLACEHOLDER_GAMEPLAY: "PLACEHOLDER_GAMEPLAY",
  STORE: "STORE",
};

//ScreenSwitcher() holds the logic for switching between screens.
function ScreenSwitcher() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);
  // Switch between 'gameplay' and 'store'
  const [currentScreen, setCurrentScreen] = useState("gameplay");
  // Change SCREENS.MOVE to SCREEN.PLACEHOLDER_GAMEPLAY to switch to the placeholder screen
  const [showRushHour, setShowRushHour] = useState(false);
  const [showQuit, setShowQuit] = useState(false);

  const renderCurrentScreen = () => {
    switch (screen) {
      case SCREENS.SPLASH:
        return <SplashScreen onFinish={() => setScreen(SCREENS.HOME)} />;

      case SCREENS.MODE_SELECT:
        return (
          <ModeSelectScreen
            onSelectStoryMode={() => setScreen(SCREENS.LEVEL_SELECT)}
            onSelectRushHour={() => {
              // TODO: navigate into Rush Hour Mode gameplay
              setShowRushHour(true);
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
          <StoryBackstoryScreen
            onFinish={() => setScreen(SCREENS.GAMEPLAY)}
            onOpenStore={() => setScreen(SCREENS.STORE)}
          />
        );

      case SCREENS.GAMEPLAY:
        return (
          <GameplayScreen onBack={() => setScreen(SCREENS.LEVEL_SELECT)} />
        );

      /* 2. DUMMY PLACEHOLDER: Render the component pointing to ./GameplayScreen */
      case SCREENS.PLACEHOLDER_GAMEPLAY:
        return (
          <PlaceholderGameplay
            onBack={() => setScreen(SCREENS.LEVEL_SELECT)}
            onOpenStore={() => setScreen(SCREENS.STORE)}
          />
        );

      /* Placeholder for Storescreen */
      case SCREENS.STORE:
        return <StoreScreen onBack={() => setScreen(SCREENS.GAMEPLAY)} />;

      case SCREENS.HOME:
      default:
        return (
          <HomeScreen
            onStart={() => setScreen(SCREENS.MODE_SELECT)}
            onOpenSettings={() => setScreen(SCREENS.SETTINGS)}
            onQuit={() => {
              // TODO: handle quit (e.g. close app, or show confirmation)
              setShowQuit(true);
              console.log("Quit pressed");
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Renders active screen */}
      {renderCurrentScreen()}

      {/* 2. Global Modals rendered on top */}
      <RushHourModal
        visible={showRushHour}
        onDismiss={() => setShowRushHour(false)}
      />

      <QuitModal visible={showQuit} onQuit={() => setShowQuit(false)} />
    </View>
  );
}

export default function App() {
  // On native (Expo Go / a real build) this renders full-screen as normal —
  // the phone's own screen IS the frame, so no extra wrapper is needed.
  if (Platform.OS !== "web") {
    return <ScreenSwitcher />;
  }

  return (
    <View style={styles.webBackdrop}>
      <View style={styles.webPhoneFrame}>
        <ScreenSwitcher />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webBackdrop: {
    flex: 1,
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  webPhoneFrame: {
    width: 400,
    height: 860,
    maxHeight: "95vh",
    overflow: "hidden",
    borderRadius: 24,
    boxShadow: "0 0 40px rgba(0,0,0,0.5)",
  },
});
