import React, { useState } from "react";
import { View, StyleSheet, Modal, Platform } from "react-native"; //Added the platform here because bug
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ModeSelectScreen from "./screens/ModeSelectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import StoryBackstoryScreen from "./screens/StoryBackstoryScreen";
import GameplayScreen from "./screens/GameplayScreen";
import { useWallet } from "./components/gameplayReusables/UseWallet";

/* Placeholder components */
import QuitModal from './components/QuitModal';
import RushHourModal from './screens/RushHourModal';
import StoreScreen from './screens/StoreScreen';

// Manual screeen switchhing, react navigation willbeinputted later
const SCREENS = {
  SPLASH: "SPLASH",
  HOME: "HOME",
  MODE_SELECT: "MODE_SELECT",
  SETTINGS: "SETTINGS",
  LEVEL_SELECT: "LEVEL_SELECT",
  STORY_BACKSTORY: "STORY_BACKSTORY",
  GAMEPLAY: "GAMEPLAY",
};

//ScreenSwitcher() holds the logic for switching between screens.
function ScreenSwitcher() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);

  // Overlay Store so progress don't reset
  const [showStore, setShowStore] = useState(false);
  const openStore = () => { console.log('[App] openStore called'); setShowStore(true); };
  const closeStore = () => setShowStore(false);


  // Change SCREENS.MOVE to SCREEN.PLACEHOLDER_GAMEPLAY to switch to the placeholder screen
  const [showRushHour, setShowRushHour] = useState(false);
  const [showQuit, setShowQuit] = useState(false);

  // Global currency
  const wallet = useWallet(0);

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
            setShowRushHour(true)
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
            onOpenStore={openStore}
          />
        );

      case SCREENS.GAMEPLAY:
        return (
          <GameplayScreen
            onBack={() => setScreen(SCREENS.LEVEL_SELECT)}
            onOpenStore={openStore}
            isStoreOpen={showStore}
            wallet={wallet}
          />
        );

      case SCREENS.HOME:
      default:
        return (
          <HomeScreen
            onStart={() => setScreen(SCREENS.MODE_SELECT)}
            onOpenSettings={() => setScreen(SCREENS.SETTINGS)}
            onQuit={() => {
              // Close app
              setShowQuit(true);
              console.log("Quit pressed");
            }}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Renders active screen — never unmounted by opening the Store */}
      {renderCurrentScreen()}

      {/* 2. Store full screen Overlay*/}

        {showStore && (
          <Modal>
            <View style={styles.overlay}>
              <StoreScreen onBack={closeStore} wallet={wallet} onGoToLevelSelect={() => {closeStore(); setScreen(SCREENS.LEVEL_SELECT);}} />
            </View>
          </Modal>
        )}

      {/* 3. Global Modals rendered on top of everything */}
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
    width: '100vw',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webPhoneFrame: {
    width: '100%',
    maxWidth: 400,
    height: '100%',
    maxHeight: 820,
    aspectRatio: 9 / 19.5, // Standard modern smartphone ratio (iPhone/Android)
    overflow: 'hidden',
  },
});