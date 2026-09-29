import React, { useState } from "react";
import { useFonts } from "expo-font";
import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";
import { View, StyleSheet, Modal, Platform } from "react-native";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ModeSelectScreen from "./screens/ModeSelectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import StoryBackstoryScreen from "./screens/StoryBackstoryScreen";
import GameplayScreen from "./screens/GameplayScreen";
import { useWallet } from "./components/gameplayReusables/UseWallet";
import { useAchievements } from "./components/gameplayReusables/UseAchievements.js";
import { hasLevelPreset, getNextLevelId, getLevelConfigById, getAllLevelIds } from "./levels/levelPresets";

/* Placeholder components */
import QuitModal from './components/QuitModal';
import RushHourModal from './screens/RushHourModal';
import PopupModal from './components/PopupModal';
import StoreScreen from './screens/StoreScreen';

// [TEST/DEBUG] Adds a level-select button that toggles "unlock all levels"
// <-> "reset to Level 1". Set to false before release or before anything at all.
const DEBUG_LEVEL_TOGGLE = true;

// Manual screen switching; React Navigation later
const SCREENS = {
  SPLASH: "SPLASH",
  HOME: "HOME",
  MODE_SELECT: "MODE_SELECT",
  SETTINGS: "SETTINGS",
  LEVEL_SELECT: "LEVEL_SELECT",
  STORY_BACKSTORY: "STORY_BACKSTORY",
  GAMEPLAY: "GAMEPLAY",
};

// Holds the screen-switching logic.
function ScreenSwitcher() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);

  // Level picked on LevelSelectScreen; GameplayScreen loads its preset.
  const [currentLevelId, setCurrentLevelId] = useState(1);

  // Levels the player may open (in memory only; resets on restart).
  const [unlockedLevels, setUnlockedLevels] = useState([1]);
  // Level shown in the "unlocked" popup, or null.
  const [unlockNotice, setUnlockNotice] = useState(null);

  // [TEST/DEBUG] True once every level with a preset is unlocked.
  const debugAllUnlocked = getAllLevelIds().every((id) => unlockedLevels.includes(id));

  // [TEST/DEBUG] Unlock everything, or reset progression back to Level 1.
  const handleDebugToggle = () => {
    setUnlockNotice(null);
    if (debugAllUnlocked) {
      setUnlockedLevels([1]);
      setCurrentLevelId(1);
    } else {
      setUnlockedLevels(getAllLevelIds());
    }
  };

  // Called once per won level.
  const handleLevelComplete = (completedLevelId) => {
    const nextId = getNextLevelId(completedLevelId);
    if (nextId === null || unlockedLevels.includes(nextId)) return; // last level or already unlocked
    setUnlockedLevels((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
    setUnlockNotice(nextId);
  };

  // Store overlays the screen so progress isn't lost
  const [showStore, setShowStore] = useState(false);
  const openStore = () => { console.log('[App] openStore called'); setShowStore(true); };
  const closeStore = () => setShowStore(false);


  // Use SCREEN.PLACEHOLDER_GAMEPLAY to show the placeholder screen
  const [showRushHour, setShowRushHour] = useState(false);
  const [showQuit, setShowQuit] = useState(false);

  // Global currency
  const wallet = useWallet(0);
  const achievements = useAchievements(wallet);

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
            unlockedLevels={unlockedLevels}
            onDebugToggle={DEBUG_LEVEL_TOGGLE ? handleDebugToggle : undefined} // [TEST/DEBUG]
            debugAllUnlocked={debugAllUnlocked} // [TEST/DEBUG]
            onSelectLevel={(levelId) => {
              if (!hasLevelPreset(levelId)) {
                // No preset yet — nothing to play.
                console.log(`Level ${levelId} selected but has no preset yet`);
                return;
              }
              setCurrentLevelId(levelId);
              if (levelId === 1) {
                // Level 1 plays its backstory first.
                setScreen(SCREENS.STORY_BACKSTORY);
              } else {
                // TODO: per-level intros.
                setScreen(SCREENS.GAMEPLAY);
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
            levelId={currentLevelId}
            onLevelComplete={handleLevelComplete}
            onBack={() => setScreen(SCREENS.LEVEL_SELECT)}
            onOpenStore={openStore}
            isStoreOpen={showStore}
            wallet={wallet}
            achievements={achievements}
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
      {/* 1. Active screen (stays mounted while the Store is open) */}
      {renderCurrentScreen()}

      {/* 2. Store overlay */}

        {showStore && (
          <Modal>
            <View style={styles.overlay}>
              <StoreScreen onBack={closeStore} wallet={wallet} onGoToLevelSelect={() => {closeStore(); setScreen(SCREENS.LEVEL_SELECT);}} />
            </View>
          </Modal>
        )}

      {/* 3. Global modals */}
      <RushHourModal
        visible={showRushHour}
        onDismiss={() => setShowRushHour(false)}
      />

      <QuitModal visible={showQuit} onQuit={() => setShowQuit(false)} />

      {/* Level-unlocked warning */}
      <PopupModal
        visible={unlockNotice !== null}
        title="NEW LEVEL UNLOCKED!"
        message={unlockNotice !== null ? getLevelConfigById(unlockNotice).title : ""}
        extraMessage="You can play it from the Level Select screen."
        buttonText="Nice!"
        onPress={() => setUnlockNotice(null)}
      />
    </View>
  );
}

function AppInner() {
  // Native: the device screen is the frame.
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

export default function App() {
  const [fontsLoaded] = useFonts({
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
  });
  if (!fontsLoaded) return null;
  return <AppInner />;
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
    aspectRatio: 9 / 19.5, // Modern phone ratio
    overflow: 'hidden',
  },
});