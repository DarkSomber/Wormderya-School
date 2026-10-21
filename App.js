import React, { useState, useEffect, useRef, useCallback } from "react";
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
import StoryEndingScreen from "./screens/StoryEndingScreen";
import GameplayScreen from "./screens/GameplayScreen";
import BossGameplayScreen from "./screens/BossGameplayScreen";
import { useWallet } from "./components/gameplayReusables/UseWallet";
import { useAchievements } from "./components/gameplayReusables/UseAchievements.js";
import { useUpgrades } from "./components/gameplayReusables/UseUpgrades";
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

import QuitModal from "./components/QuitModal";
import RushHourModal from "./screens/RushHourModal";
import PopupModal from "./components/PopupModal";
import StoreScreen from "./screens/StoreScreen";

const DEBUG_LEVEL_TOGGLE = true;

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

/**
 * Owns the persisted state. Loads once on mount, keeps a single snapshot
 * in memory, and exposes a `patch` function the sub-hooks call to update
 * their slice. Every patch writes the full snapshot immediately.
 */
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

  // One writer: patch a slice, persist the whole snapshot.
  const patch = useCallback((slice, value) => {
    const next = { ...snapshotRef.current, [slice]: value };
    snapshotRef.current = next;
    saveGameData(next);
  }, []);

  // In-memory snapshot first, so a patch that lands during the clear can't
  // write the old data back. The caller must also remount whatever holds
  // hook state (see ScreenSwitcher's onReset).
  const reset = useCallback(async () => {
    snapshotRef.current = createDefaultSave();
    await clearGameData();
  }, []);

  // Always the latest snapshot, for callbacks that outlive a render.
  const getSnapshot = useCallback(() => snapshotRef.current, []);

  return { loaded, snapshot: snapshotRef.current, getSnapshot, patch, reset };
}

/**
 * Loads the save, then mounts <GameSession>. The hooks inside it take their
 * initial state from the save, and useState ignores a changed initial value,
 * so they must not be created until the save has loaded. Bumping `session.key`
 * (a save reset) remounts GameSession, so wallet, upgrades, achievements and
 * levels all restart from the fresh defaults.
 */
function ScreenSwitcher() {
  const save = useGameSave();
  const [session, setSession] = useState({
    key: 0,
    screen: SCREENS.SPLASH,
  });

  // While the save is loading, keep the splash on screen.
  if (!save.loaded) {
    return <SplashScreen onFinish={() => {}} />;
  }

  return (
    <GameSession
      key={session.key}
      save={save}
      initialScreen={session.screen}
      onReset={() =>
        setSession((s) => ({ key: s.key + 1, screen: SCREENS.LEVEL_SELECT }))
      }
    />
  );
}

function GameSession({ save, initialScreen, onReset }) {
  const { snapshot, getSnapshot, patch, reset } = save;

  const [screen, setScreen] = useState(initialScreen);

  const [currentLevelId, setCurrentLevelId] = useState(snapshot.currentLevelId);
  const [unlockedLevels, setUnlockedLevels] = useState(snapshot.unlockedLevels);
  const [unlockNotice, setUnlockNotice] = useState(null);
  const [showStore, setShowStore] = useState(false);
  // True when the store was opened mid-level (Mr. Ratty's visit): leaving it
  // returns to the running level instead of going to Level Select.
  const [storeResumesGameplay, setStoreResumesGameplay] = useState(false);
  const [showRushHour, setShowRushHour] = useState(false);
  const [gameMode, setGameMode] = useState("normal");
  const [showQuit, setShowQuit] = useState(false);
  const [endingPending, setEndingPending] = useState(false);

  // ---- Audio ----
  // Start the audio engine once.
  useEffect(() => {
    audio.init();
  }, []);

  // Apply the saved slider values and let the Settings screen persist new ones.
  useEffect(() => {
    audio.setVolumes(snapshot.settings);
    audio.setPersistHandler((volumes) => patch("settings", volumes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patch]);

  // Menu music everywhere except the splash and gameplay (LevelSession owns
  // the music while a level is running).
  const menuMusicOn =
    screen !== SCREENS.SPLASH && screen !== SCREENS.GAMEPLAY;
  useEffect(() => {
    if (menuMusicOn) audio.setMusic("menu");
  }, [menuMusicOn]);

  // Push top-level changes into the save snapshot.
  useEffect(() => {
    patch("unlockedLevels", unlockedLevels);
  }, [unlockedLevels, patch]);
  useEffect(() => {
    patch("currentLevelId", currentLevelId);
  }, [currentLevelId, patch]);

  // Wallet / achievements / upgrades. Each receives its slice of the save
  // and reports back via onChange, which we write to the snapshot.
  // onChange handlers are memoized: the hooks re-save whenever their onChange
  // changes identity, so an inline arrow here would re-write on every render.
  const handleWalletChange = useCallback((w) => patch("wallet", w), [patch]);
  const handleAchievementsChange = useCallback(
    (a) => patch("achievements", a),
    [patch],
  );
  const handleUpgradesChange = useCallback((u) => patch("upgrades", u), [patch]);

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

  // Clears the stored save, then remounts the session so every in-memory
  // hook (wallet, upgrades, achievements, levels) restarts from the defaults.
  const handleDebugResetSave = async () => {
    await reset();
    onReset();
  };

  const handleLevelComplete = (completedLevelId) => {
    // The boss level leads to the ending (played when the boss screen's onBack fires).
    if (getLevelConfigById(completedLevelId).isBoss) setEndingPending(true);
    const nextId = getNextLevelId(completedLevelId);
    if (nextId === null || unlockedLevels.includes(nextId)) return;
    setUnlockedLevels((prev) =>
      prev.includes(nextId) ? prev : [...prev, nextId],
    );
    setUnlockNotice(nextId);
  };

  // Best scores power the "new record" jingle. Normal levels are keyed
  // 'level-N'; Rush Hour has one shared key.
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

  // openStore({ resumeGameplay: true }) = mid-level visit (Mr. Ratty): closing the
  // store returns to the running level. Any other call (e.g. after a win, or
  // from a press event) keeps the old behavior of going to Level Select.
  const openStore = (opts) => {
    console.log("[Store] opened with", opts);
    audio.playSfx("ratty_shop_appear");
    setStoreResumesGameplay(opts?.resumeGameplay === true);
    setShowStore(true);
  };
  const closeStore = () => setShowStore(false);

  const renderCurrentScreen = () => {
    switch (screen) {
      case SCREENS.SPLASH:
        return <SplashScreen onFinish={() => setScreen(SCREENS.HOME)} />;

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

      //temp for checking of ending screen
      /*
        case SCREENS.SPLASH:
  return <SplashScreen onFinish={() => setScreen(SCREENS.STORY_ENDING)} />;
        */

      //temp for checking of level 4
      /*
        return (
          <SplashScreen
            onFinish={() => {
              setGameMode("normal");
              setCurrentLevelId(4);
              setScreen(SCREENS.GAMEPLAY); // TEMP: jump straight to boss
            }}
          />
        );
        */

      /*

*/

      case SCREENS.SETTINGS:
        return (
          <SettingsScreen
            onBack={() => setScreen(SCREENS.HOME)}
            achievements={achievements}
          />
        );

      case SCREENS.LEVEL_SELECT:
        return (
          <LevelSelectScreen
            unlockedLevels={unlockedLevels}
            onDebugToggle={DEBUG_LEVEL_TOGGLE ? handleDebugToggle : undefined}
            onDebugResetSave={
              DEBUG_LEVEL_TOGGLE ? handleDebugResetSave : undefined
            }
            debugAllUnlocked={debugAllUnlocked}
            onSelectLevel={(levelId) => {
              if (!hasLevelPreset(levelId)) return;
              setEndingPending(false);
              setGameMode("normal");
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
        if (gameMode === "normal" && getLevelConfigById(currentLevelId).isBoss) {
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
            onStart={() => setScreen(SCREENS.MODE_SELECT)}
            onOpenSettings={() => setScreen(SCREENS.SETTINGS)}
            onQuit={() => {
              setShowQuit(true);
            }}
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
                // Mid-level Ratty visit: stay in the running level.
                if (!storeResumesGameplay) setScreen(SCREENS.LEVEL_SELECT);
              }}
            />
          </View>
        </Modal>
      )}

      <RushHourModal
        visible={showRushHour}
        onDismiss={() => {
          setShowRushHour(false);
          setScreen(SCREENS.GAMEPLAY);
        }}
      />

      <QuitModal visible={showQuit} onQuit={() => setShowQuit(false)} />

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
    PixelifySans_400Regular,
    PixelifySans_500Medium,
    PixelifySans_600SemiBold,
    PixelifySans_700Bold,
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