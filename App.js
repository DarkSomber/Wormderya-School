import React, { useState, useEffect, useRef, useCallback } from "react";
import { useFonts } from "expo-font";
import { GeistPixel_400Regular } from "@expo-google-fonts/geist-pixel";
import { View, StyleSheet, Modal, Platform, BackHandler } from "react-native";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import ModeSelectScreen from "./screens/ModeSelectScreen";
import SettingsScreen from "./screens/SettingsScreen";
import LevelSelectScreen from "./screens/LevelSelectScreen";
import StoryBackstoryScreen from "./screens/StoryBackstoryScreen";
import StoryEndingScreen from "./screens/StoryEndingScreen";
import GameplayScreen from "./screens/GameplayScreen";
import BossGameplayScreen from "./screens/BossGameplayScreen";
import { useWallet } from "./components/gameplayReusables/UseWallet";
import { useAchievements } from "./components/gameplayReusables/UseAchievements.js";
import {
  useUpgrades,
  UPGRADES,
} from "./components/gameplayReusables/UseUpgrades";
import { Asset } from "expo-asset";
import { ACHIEVEMENTS } from "./components/gameplayReusables/Achievements.js";
import {
  hasLevelPreset,
  getNextLevelId,
  getLevelConfigById,
  getAllLevelIds,
} from "./levels/levelPresets";
import {
  loadGameData,
  saveGameData,
  clearGameData,
  createDefaultSave,
  DEFAULT_SAVE,
} from "./components/GameSave";
import audio from "./audio/AudioManager";
import {
  loadWordCache,
  shouldShowOfflineNotice,
} from "./components/gameplayReusables/WordInput";

import QuitModal from "./components/QuitModal";
import RushHourModal from "./screens/RushHourModal";
import PopupModal from "./components/PopupModal";
import StoreScreen from "./screens/StoreScreen";

const DEBUG_LEVEL_TOGGLE = true;

const LEVEL_ACHIEVEMENTS = {
  "level-1": ACHIEVEMENTS.FINISH_LEVEL_ONE,
  "level-2": ACHIEVEMENTS.FINISH_LEVEL_TWO,
  "level-3": ACHIEVEMENTS.FINISH_LEVEL_THREE,
};

const SPLASH_EXTRA_DELAY_MS = 3000;
const PRELOAD_TIMEOUT_MS = 15000;

const PRELOAD_IMAGES = [
  ...Object.values(ACHIEVEMENTS).map((a) => a.icon),
  ...Object.values(UPGRADES).map((u) => u.icon),
  require("./assets/Final/MainBackground.png"),
  require("./assets/Final/WormderyaLogo.png"),
  require("./assets/Final/MainCharacter.png"),
  require("./assets/Final/MainCharacterMenuAnim.gif"),
  require("./assets/Final/LevelSelectionMainBG.png"),
  require("./assets/Final/levels/LevelSelectionMainBGAnim.gif"),
  require("./assets/Final/levels/Bubong.png"),
  require("./assets/Final/levels/TextBox.png"),
  require("./assets/Final/levels/table.png"),
  require("./assets/Final/MainCharacterWorryAnim.gif"),
  require("./assets/Final/SettingsPanel.png"),
  require("./assets/Final/card_closed.png"),
  require("./assets/Final/card_open.png"),
  require("./assets/Final/buttons/buttonStart1.png"),
  require("./assets/Final/buttons/buttonSettings.png"),
  require("./assets/Final/buttons/buttonQuit.png"),
  require("./assets/Final/buttons/buttonStorymode.png"),
  require("./assets/Final/buttons/buttonRushHourmode.png"),
  require("./assets/Final/buttons/buttonBack.png"),
  require("./assets/Final/buttons/buttonLevelSelectBack.png"),
  require("./assets/Final/buttons/buttonSettings-Achievements.png"),
  require("./assets/Final/buttons/buttonSettings-Credits.png"),
  require("./assets/Final/buttons/buttonSettings-Back.png"),
  require("./assets/Final/levels/Level_1_Sinangag.png"),
  require("./assets/Final/levels/Level_2_Adobo.png"),
  require("./assets/Final/levels/Level_3_Sinigang-na-Bangus.png"),
  require("./assets/Final/levels/Level_4_Boss_kare-kare.png"),
  require("./assets/Final/BackstoryScreens/Backstory-Panel-1.1.png"),
  require("./assets/Final/BackstoryScreens/Backstory-Panel-1.2.png"),
  require("./assets/Final/BackstoryScreens/Backstory-Panel-2.png"),
  require("./assets/Final/BackstoryScreens/Backstory-Panel-3.png"),
  require("./assets/Final/BackstoryScreens/Backstory-Panel-4.png"),
  require("./assets/Final/EndingScreens/EndingPanel1.png"),
  require("./assets/Final/EndingScreens/EndingPanel2.png"),
  require("./assets/Final/EndingScreens/EndingPanel3.png"),
  require("./assets/Final/EndingScreens/EndingPanel4.png"),
  require("./assets/Final/Customers/Customer1.png"),
  require("./assets/Final/Customers/CustomerPicky.png"),
  require("./assets/Final/Customers/CustomerBoss.png"),
  require("./assets/Final/GameplayUI/GameplayScreen.png"),
  require("./assets/Final/buttons/buttonPause2.png"),
  require("./assets/Final/GameplayUI/CoinPatience.png"),
  require("./assets/Final/GameplayUI/conveyors.png"),
  require("./assets/Final/GameplayUI/serve-button.png"),
  require("./assets/Final/GameplayUI/Patience_High.png"),
  require("./assets/Final/GameplayUI/Patience_Moderate.png"),
  require("./assets/Final/GameplayUI/Patience_Low.png"),
  require("./assets/Final/RattyBodega/BackgroundRattyStall.png"),
  require("./assets/Final/RattyBodega/RattyStall.png"),
  require("./assets/Final/RattyBodega/MrRatty.png"),
  require("./assets/Placeholder/pixel_coins.png"),
  require("./assets/Placeholder/BuyButton.png"),
  require("./assets/Placeholder/DeclineButton.png"),
  require("./assets/Placeholder/BlankRectangle.png"),
  require("./assets/Final/buttons/button.png"),
].filter(Boolean);

function preloadImages() {
  let timeoutId;
  const loading = Promise.all(
    PRELOAD_IMAGES.map((img) =>
      Asset.loadAsync(img).catch((e) =>
        console.warn("[Splash] image preload failed:", e?.message ?? e),
      ),
    ),
  );
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(resolve, PRELOAD_TIMEOUT_MS);
  });
  return Promise.race([loading, timeout]).finally(() =>
    clearTimeout(timeoutId),
  );
}

const SCREENS = {
  SPLASH: "SPLASH",
  HOME: "HOME",
  MODE_SELECT: "MODE_SELECT",
  SETTINGS: "SETTINGS",
  LEVEL_SELECT: "LEVEL_SELECT",
  STORY_BACKSTORY: "STORY_BACKSTORY",
  GAMEPLAY: "GAMEPLAY",
  STORY_ENDING: "STORY_ENDING",
};

function useGameSave() {
  const [loaded, setLoaded] = useState(false);
  const snapshotRef = useRef({ ...DEFAULT_SAVE });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadGameData();
      if (cancelled) return;
      snapshotRef.current = data;
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((slice, value) => {
    const next = { ...snapshotRef.current, [slice]: value };
    snapshotRef.current = next;
    saveGameData(next);
  }, []);

  const reset = useCallback(async () => {
    snapshotRef.current = createDefaultSave();
    await clearGameData();
  }, []);

  const getSnapshot = useCallback(() => snapshotRef.current, []);

  return { loaded, snapshot: snapshotRef.current, getSnapshot, patch, reset };
}

function ScreenSwitcher() {
  const save = useGameSave();
  const [session, setSession] = useState({
    key: 0,
    screen: SCREENS.HOME,
  });
  const [assetsReady, setAssetsReady] = useState(false);
  const [delayDone, setDelayDone] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState(false);

  useEffect(() => {
    shouldShowOfflineNotice().then(setOfflineNotice);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      preloadImages(),
      loadWordCache(),
    ]).then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!assetsReady) return undefined;
    const timer = setTimeout(() => setDelayDone(true), SPLASH_EXTRA_DELAY_MS);
    return () => clearTimeout(timer);
  }, [assetsReady]);

  if (!(save.loaded && assetsReady && delayDone)) {
    return <SplashScreen />;
  }

  return (
    <>
      <GameSession
        key={session.key}
        save={save}
        initialScreen={session.screen}
        onReset={(screen = SCREENS.LEVEL_SELECT) =>
          setSession((s) => ({ key: s.key + 1, screen }))
        }
      />
      <PopupModal
        visible={offlineNotice}
        title="NO INTERNET CONNECTION"
        message="You are not connected to the internet. You can still play offline, but fewer words will be accepted until you reconnect."
        extraMessage="You can check your connection in the Settings."
        buttonText="Got it"
        onPress={() => setOfflineNotice(false)}
      />
    </>
  );
}

function GameSession({ save, initialScreen, onReset }) {
  const { snapshot, getSnapshot, patch, reset } = save;

  const [screen, setScreen] = useState(initialScreen);

  const [currentLevelId, setCurrentLevelId] = useState(snapshot.currentLevelId);
  const [unlockedLevels, setUnlockedLevels] = useState(snapshot.unlockedLevels);
  const [unlockNotice, setUnlockNotice] = useState(null);
  const [levelSelectFocusId, setLevelSelectFocusId] = useState(null);
  const [showStore, setShowStore] = useState(false);
  const [storeResumesGameplay, setStoreResumesGameplay] = useState(false);
  const [showRushHour, setShowRushHour] = useState(false);
  const [gameMode, setGameMode] = useState("normal");
  const [showQuit, setShowQuit] = useState(false);
  const [endingPending, setEndingPending] = useState(false);
  const [tutorialSeen, setTutorialSeen] = useState(snapshot.tutorialSeen);
  const markTutorialSeen = useCallback(() => {
    setTutorialSeen(true);
    patch("tutorialSeen", true);
  }, [patch]);

  useEffect(() => {
    audio.init();
  }, []);

  useEffect(() => {
    audio.setVolumes(snapshot.settings);
    audio.setPersistHandler((volumes) => patch("settings", volumes));
  }, [patch]);

  const menuMusicOn = screen !== SCREENS.SPLASH && screen !== SCREENS.GAMEPLAY;
  useEffect(() => {
    if (menuMusicOn) audio.setMusic("menu");
  }, [menuMusicOn]);

  useEffect(() => {
    patch("unlockedLevels", unlockedLevels);
  }, [unlockedLevels, patch]);
  useEffect(() => {
    patch("currentLevelId", currentLevelId);
  }, [currentLevelId, patch]);

  const handleWalletChange = useCallback((w) => patch("wallet", w), [patch]);
  const handleAchievementsChange = useCallback(
    (a) => patch("achievements", a),
    [patch],
  );
  const handleUpgradesChange = useCallback(
    (u) => patch("upgrades", u),
    [patch],
  );

  const wallet = useWallet(0, {
    initialState: snapshot.wallet,
    onChange: handleWalletChange,
  });
  const achievements = useAchievements(wallet, {
    initialState: snapshot.achievements,
    onChange: handleAchievementsChange,
  });
  const upgrades = useUpgrades(wallet, {
    initialState: snapshot.upgrades,
    onChange: handleUpgradesChange,
  });

  const debugAllUnlocked = getAllLevelIds().every((id) =>
    unlockedLevels.includes(id),
  );

  const handleDebugToggle = () => {
    setUnlockNotice(null);
    if (debugAllUnlocked) {
      setUnlockedLevels([1]);
      setCurrentLevelId(1);
    } else {
      setUnlockedLevels(getAllLevelIds());
    }
  };

  const handleDebugResetSave = async () => {
    await reset();
    onReset();
  };

  const handleResetProgress = async () => {
    const volumes = audio.getVolumes();
    await reset();
    patch("settings", volumes);
    onReset(SCREENS.HOME);
  };

  const handleLevelComplete = (completedLevelId) => {
    achievements.unlockAchievement(LEVEL_ACHIEVEMENTS[completedLevelId]);
    if (getLevelConfigById(completedLevelId).isBoss) setEndingPending(true);
    const nextId = getNextLevelId(completedLevelId);
    setLevelSelectFocusId(nextId ?? completedLevelId);
    if (nextId === null || unlockedLevels.includes(nextId)) return;
    setUnlockedLevels((prev) =>
      prev.includes(nextId) ? prev : [...prev, nextId],
    );
    setUnlockNotice(nextId);
  };

  const scoreKey =
    gameMode === "rushHour" ? "rushHour" : `level-${currentLevelId}`;
  const getBestScore = useCallback(
    () => getSnapshot().bestScores?.[scoreKey] ?? 0,
    [getSnapshot, scoreKey],
  );
  const reportScore = useCallback(
    (score) => {
      const best = getSnapshot().bestScores ?? {};
      if (score > (best[scoreKey] ?? 0))
        patch("bestScores", { ...best, [scoreKey]: score });
    },
    [getSnapshot, patch, scoreKey],
  );

  const openStore = (opts) => {
    console.log("[Store] opened with", opts);
    audio.playSfx("ratty_shop_appear");
    setStoreResumesGameplay(opts?.resumeGameplay === true);
    setShowStore(true);
  };
  const closeStore = () => {
    if (storeResumesGameplay) upgrades.startNewRound();
    setShowStore(false);
  }
  const exitApp = () => {
    setShowQuit(false);
    if (Platform.OS === "android") BackHandler.exitApp();
    else if (Platform.OS === "web") {
      window.close();
      window.location.replace("about:blank");
    }
  };

  const renderCurrentScreen = () => {
    switch (screen) {
      case SCREENS.MODE_SELECT:
        return (
          <ModeSelectScreen
            onSelectStoryMode={() => {
              setGameMode("normal");
              setScreen(SCREENS.LEVEL_SELECT);
            }}
            onSelectRushHour={() => {
              setGameMode("rushHour");
              setShowRushHour(true);
            }}
            onBack={() => setScreen(SCREENS.HOME)}
          />
        );

      case SCREENS.SETTINGS:
        return (
          <SettingsScreen
            onBack={() => setScreen(SCREENS.HOME)}
            achievements={achievements}
            onResetProgress={handleResetProgress}
          />
        );

      case SCREENS.LEVEL_SELECT:
        return (
          <LevelSelectScreen
            unlockedLevels={unlockedLevels}
            initialLevelId={levelSelectFocusId ?? currentLevelId}
            onDebugToggle={DEBUG_LEVEL_TOGGLE ? handleDebugToggle : undefined}
            onDebugResetSave={
              DEBUG_LEVEL_TOGGLE ? handleDebugResetSave : undefined
            }
            debugAllUnlocked={debugAllUnlocked}
            onSelectLevel={(levelId) => {
              if (!hasLevelPreset(levelId)) return;
              setEndingPending(false);
              setGameMode("normal");
              setLevelSelectFocusId(null);
              setCurrentLevelId(levelId);
              if (levelId === 1) setScreen(SCREENS.STORY_BACKSTORY);
              else setScreen(SCREENS.GAMEPLAY);
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
        if (
          gameMode === "normal" &&
          getLevelConfigById(currentLevelId).isBoss
        ) {
          return (
            <BossGameplayScreen
              mode={gameMode}
              levelId={currentLevelId}
              onLevelComplete={handleLevelComplete}
              onBack={() => {
                if (endingPending) {
                  setEndingPending(false);
                  setScreen(SCREENS.STORY_ENDING);
                } else {
                  setScreen(SCREENS.LEVEL_SELECT);
                }
              }}
              wallet={wallet}
              achievements={achievements}
              upgrades={upgrades}
              getBestScore={getBestScore}
              onReportScore={reportScore}
            />
          );
        }
        return (
          <GameplayScreen
            mode={gameMode}
            levelId={currentLevelId}
            onLevelComplete={handleLevelComplete}
            onBack={() =>
              setScreen(
                gameMode === "rushHour"
                  ? SCREENS.MODE_SELECT
                  : SCREENS.LEVEL_SELECT,
              )
            }
            onOpenStore={openStore}
            isStoreOpen={showStore}
            wallet={wallet}
            achievements={achievements}
            upgrades={upgrades}
            getBestScore={getBestScore}
            onReportScore={reportScore}
          />
        );

      case SCREENS.STORY_ENDING:
        return <StoryEndingScreen onFinish={() => setScreen(SCREENS.HOME)} />;

      case SCREENS.HOME:
      default:
        return (
          <HomeScreen
            onStart={() => {
              markTutorialSeen();
              setScreen(SCREENS.MODE_SELECT);
            }}
            onOpenSettings={() => setScreen(SCREENS.SETTINGS)}
            onQuit={() => {
              setShowQuit(true);
            }}
            showGranny={!tutorialSeen}
            onGrannySeen={markTutorialSeen}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}

      {showStore && (
        <Modal>
          <View style={styles.overlay}>
            <StoreScreen
              onBack={closeStore}
              wallet={wallet}
              achievements={achievements}
              upgrades={upgrades}
              onGoToLevelSelect={() => {
                closeStore();
                if (!storeResumesGameplay) setScreen(SCREENS.LEVEL_SELECT);
              }}
            />
          </View>
        </Modal>
      )}

      <RushHourModal
        visible={showRushHour}
        highScore={getSnapshot().bestScores?.rushHour ?? 0}
        onBack={() => setShowRushHour(false)}
        onDismiss={() => {
          setShowRushHour(false);
          setScreen(SCREENS.GAMEPLAY);
        }}
      />

      <QuitModal
        visible={showQuit}
        onQuit={exitApp}
        onCancel={() => setShowQuit(false)}
      />

      <PopupModal
        visible={
          unlockNotice !== null && achievements.currentAchievement === null
        }
        title="NEW LEVEL UNLOCKED!"
        message={
          unlockNotice !== null ? getLevelConfigById(unlockNotice).title : ""
        }
        extraMessage="You can play it from the Level Select screen."
        buttonText="Nice!"
        onPress={() => setUnlockNotice(null)}
      />
    </View>
  );
}

function AppInner() {
  if (Platform.OS !== "web") return <ScreenSwitcher />;
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
    GeistPixel_400Regular,
  });
  if (!fontsLoaded) return null;
  return <AppInner />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { flex: 1 },
  webBackdrop: {
    flex: 1,
    width: "100vw",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center",
  },
  webPhoneFrame: {
    width: "100%",
    maxWidth: 400,
    height: "100%",
    maxHeight: 820,
    aspectRatio: 9 / 19.5,
    overflow: "hidden",
  },
});