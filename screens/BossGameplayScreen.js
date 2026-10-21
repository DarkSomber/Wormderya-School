import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  StyleSheet,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import Text from "../components/AppText";
import { ConveyorBelt } from "../components/gameplayReusables/ConveyorBelt";
import {
  useWordInput,
  CurrentWordDisplay,
} from "../components/gameplayReusables/WordInput";
import { useValuePop } from "../components/gameplayReusables/WordInput/LetterAnimations";
import PlateButton from "../components/PlateButton";
import Twinkle from "../components/Twinkle";
import CustomerMood from "../components/gameplayReusables/CustomerMood";
import LevelTimer from "../components/gameplayReusables/LevelTimer";
import { useScoreSystem } from "../components/gameplayReusables/UseScoreSystem";
import { formatCurrency } from "../components/gameplayReusables/UseWallet";
import AchievementModal from "../components/gameplayReusables/AchievementModal";
import { ACHIEVEMENTS } from "../components/gameplayReusables/Achievements.js";
import UpgradeToast from "../components/gameplayReusables/UpgradeToast";
import UpgradeHUD from "../components/gameplayReusables/UpgradeHUD";
import { UPGRADE_LIST } from "../components/gameplayReusables/UseUpgrades";

import { getLevelConfigById } from "../levels/levelPresets";
import { getBeltConfig } from "../levels/LevelConfig";
import { useLevelMaker } from "../levels/useLevelMaker";
import {
  LevelIntroSequence,
  LevelEndSequence,
} from "../levels/IntroEndSequence";
/* global __DEV__ */

import audio from "../audio/AudioManager";
import { customerVoice } from "../audio/customerVoice";

const BELT_ROWS = [0, 1, 2];
const COIN_SPOTS = [
  { x: 0, y: 0.15, size: 9, delay: 0 },
  { x: 1, y: 0.3, size: 7, delay: 120 },
  { x: 0.5, y: -0.05, size: 8, delay: 240 },
];

// Customer / Boss area layout tuning
const SPRITE_TOP = -26;
const PATIENCE_OFFSET_X = 72;

// Boss Customer Configuration
const BOSS_SPRITES = [
  {
    source: require("../assets/Final/Customers/CustomerBoss.png"),
    bottom: -10,
    voice: 2,
  },
];

const PATIENCE_RANK = { happy: 0, impatient: 1, angry: 2 };
const patienceBand = (p) => (p > 70 ? "happy" : p > 30 ? "impatient" : "angry");

const NO_UPGRADES = {
  ownedPermanent: new Set(),
  activeTemporary: {},
  activeList: [],
  isActive: () => false,
  rewardMultiplier: 1,
  patienceDrainMultiplier: 1,
  extraHealth: 0,
  consumeExtraHealth: () => {},
  buyUpgrade: () => ({ success: false, reason: "unavailable" }),
  startNewRound: () => {},
};

const NO_WALLET = {
  currency: 0,
  addCurrency: () => {},
};

const NO_ACHIEVEMENTS = {
  currentAchievement: null,
  dismissAchievement: () => {},
  unlockAchievement: () => {},
};

/**
 * BossGameplayScreen
 * ------------------
 * Boss-themed gameplay shell maintaining customer patience logic and core game loops.
 */
export default function BossGameplayScreen({
  onOpenStore,
  onBack,
  isStoreOpen,
  onLevelComplete,
  levelId = "boss_1",
  levelConfig: levelConfigOverride,
  wallet,
  achievements,
  upgrades,
  getBestScore,
  onReportScore,
}) {
  const [sessionId, setSessionId] = useState(0);
  const safeAchievements = achievements ?? NO_ACHIEVEMENTS;

  const levelConfig = useMemo(
    () => levelConfigOverride ?? getLevelConfigById(levelId),
    [levelConfigOverride, levelId],
  );

  const handleRetry = useCallback(() => {
    setSessionId((id) => id + 1);
  }, []);

  return (
    <>
      <BossLevelSession
        key={`${levelConfig.id}:${sessionId}`}
        levelConfig={levelConfig}
        onOpenStore={onOpenStore}
        onBack={onBack}
        onRetry={handleRetry}
        onLevelComplete={onLevelComplete}
        isStoreOpen={isStoreOpen}
        wallet={wallet ?? NO_WALLET}
        achievements={safeAchievements}
        upgrades={upgrades}
        getBestScore={getBestScore}
        onReportScore={onReportScore}
      />
      <AchievementModal
        visible={safeAchievements.currentAchievement !== null}
        achievement={safeAchievements.currentAchievement}
        onDismiss={safeAchievements.dismissAchievement}
      />
    </>
  );
}

function BossLevelSession({
  levelConfig,
  onOpenStore,
  onBack,
  onRetry,
  onLevelComplete,
  isStoreOpen,
  wallet,
  achievements,
  upgrades,
  getBestScore,
  onReportScore,
}) {
  const safeUpgrades = upgrades ?? NO_UPGRADES;
  const [phase, setPhase] = useState("intro");
  const { width: winW, height: winH } = useWindowDimensions();

  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const customerRef = useRef(null);
  const [healthRespawnKey, setHealthRespawnKey] = useState(0);

  const toastedIdsRef = useRef(new Set());
  const [toastMessages, setToastMessages] = useState([]);

  useEffect(() => {
    safeUpgrades.startNewRound();
  }, []);

  useEffect(() => {
    const messages = [];
    for (const id of safeUpgrades.ownedPermanent) {
      if (toastedIdsRef.current.has(id)) continue;
      toastedIdsRef.current.add(id);
      const u = UPGRADE_LIST.find((x) => x.id === id);
      if (u) messages.push(`${u.name} (permanent)`);
    }

    for (const [id, entry] of Object.entries(safeUpgrades.activeTemporary)) {
      const stillActive =
        entry.expiresAt === null || entry.expiresAt > Date.now();
      if (!stillActive) continue;
      const key = `tmp:${id}:${entry.expiresAt}`;
      if (toastedIdsRef.current.has(key)) continue;
      toastedIdsRef.current.add(key);
      const u = UPGRADE_LIST.find((x) => x.id === id);
      if (u) {
        const secs = u.durationMs ? Math.round(u.durationMs / 1000) : null;
        messages.push(secs ? `${u.name} (${secs}s)` : u.name);
      }
    }

    if (
      safeUpgrades.extraHealth > 0 &&
      !toastedIdsRef.current.has("stock:extra-health")
    ) {
      toastedIdsRef.current.add("stock:extra-health");
      messages.push(`Extra Health x${safeUpgrades.extraHealth} ready`);
    }

    if (messages.length > 0) {
      setToastMessages((prev) => [...prev, ...messages]);
    }
  }, [
    safeUpgrades.ownedPermanent,
    safeUpgrades.activeTemporary,
    safeUpgrades.extraHealth,
  ]);

  const { currency, addCurrency } = wallet;
  const coinPop = useValuePop(currency);
  const {
    rewardMultiplier,
    patienceDrainMultiplier,
    extraHealth,
    consumeExtraHealth,
  } = safeUpgrades;

  const { score, addScoreFromWord } = useScoreSystem({
    onCurrencyEarned: addCurrency,
    getRewardMultiplier: () => rewardMultiplier,
  });

  const levelMaker = useLevelMaker(levelConfig, isStoreOpen);
  const levelMakerRef = useRef(levelMaker);
  levelMakerRef.current = levelMaker;

  const customerVoiceId =
    BOSS_SPRITES[levelMaker.customerIndex % BOSS_SPRITES.length].voice;

  const onWordSubmit = (result) => {
    if (result.word.length > 0) audio.playSfx("serve_word");

    if (result.valid) {
      audio.playSfx("correct");
      customerVoice.served(customerVoiceId, {
        lastForCustomer:
          levelMaker.wordsServedForCustomer + 1 >= levelConfig.wordsPerCustomer,
      });
      addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
      customerRef.current?.restorePatience(100);
      levelMakerRef.current.registerServedWord();
      achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD);
    } else if (result.word.length > 0) {
      audio.playSfx("wrong");
      customerVoice.wrong(customerVoiceId);
      customerRef.current?.applyWrongWordPenalty();
    }
  };

  const onWordSubmitRef = useRef(onWordSubmit);
  onWordSubmitRef.current = onWordSubmit;
  const handleWordSubmit = useCallback((result) => {
    onWordSubmitRef.current(result);
  }, []);

  const wordInput = useWordInput(
    conveyorRefs,
    {
      scoreMultiplier: levelConfig.scoreMultiplier,
      wordRules: {
        minLength: levelConfig.wordDifficulty.minLength,
        maxLength: levelConfig.wordDifficulty.maxLength,
      },
    },
    levelConfig.inputBoxCount,
    handleWordSubmit,
    { slotHoldMs: levelConfig.slotHoldMs },
  );

  const [levelResult, setLevelResult] = useState(null);

  const patienceBandRef = useRef("happy");
  const voiceIdRef = useRef(customerVoiceId);
  voiceIdRef.current = customerVoiceId;
  const handlePatienceChange = useCallback((patience) => {
    const band = patienceBand(patience);
    const previous = patienceBandRef.current;
    patienceBandRef.current = band;
    if (PATIENCE_RANK[band] > PATIENCE_RANK[previous]) {
      customerVoice.patience(voiceIdRef.current, band);
    }
  }, []);

  const handleLevelEnd = useCallback((won) => {
    setLevelResult((prev) => prev ?? (won ? "win" : "lose"));
  }, []);

  const isLevelComplete = levelMaker.isLevelComplete;
  useEffect(() => {
    if (isLevelComplete) handleLevelEnd(true);
  }, [isLevelComplete, handleLevelEnd]);

  useEffect(() => {
    if (levelResult) levelMakerRef.current.stop();
  }, [levelResult]);

  const completionReportedRef = useRef(false);
  useEffect(() => {
    if (levelResult === "win" && !completionReportedRef.current) {
      completionReportedRef.current = true;
      achievements.unlockAchievement(ACHIEVEMENTS.BOSS_LEVEL_FINISH);
      onLevelComplete?.(levelConfig.id);
    }
  }, [levelResult, onLevelComplete, levelConfig.id]);

  const handleCustomerLeft = useCallback(() => {
    if (extraHealth > 0) {
      consumeExtraHealth();
      setHealthRespawnKey((k) => k + 1);
      return;
    }
    handleLevelEnd(false);
  }, [extraHealth, consumeExtraHealth, handleLevelEnd]);

  const handleServePlate = () => {
    wordInput.submitWord();
  };

  const handleIntroComplete = useCallback(() => setPhase("playing"), []);

  // Lose: retry the boss. Win: leave through onBack, which App routes to the
  // ending (the boss has no shop visit afterwards).
  const handleEndComplete = () => {
    if (levelResult === "lose") {
      onRetry();
    } else {
      onBack?.();
    }
  };

  const activePhase = levelResult ? "end" : phase;

  const isPlaying = activePhase === "playing";
  const musicTrack = isPlaying ? "level" : isStoreOpen ? "menu" : null;
  useEffect(() => {
    audio.setMusic(musicTrack);
  }, [musicTrack]);

  const duckMusic = isPlaying && !!isStoreOpen;
  useEffect(() => {
    audio.setDuck(duckMusic);
    return () => audio.setDuck(false);
  }, [duckMusic]);

  useEffect(() => {
    if (!isPlaying || levelMaker.isLevelComplete) return;
    customerVoice.greet(customerVoiceId);
  }, [isPlaying, levelMaker.customerIndex]);

  useEffect(() => () => audio.stopVoice(), []);

  const [bestBefore] = useState(() => getBestScore?.() ?? 0);
  const runCounts = levelResult === "win";
  const isNewRecord = runCounts && bestBefore > 0 && score > bestBefore;

  const endHandledRef = useRef(false);
  useEffect(() => {
    if (!levelResult || endHandledRef.current) return;
    endHandledRef.current = true;
    if (isNewRecord) audio.playSfx("new_record");
    else audio.playSfx(levelResult === "win" ? "win" : "lose");
    if (levelResult === "lose") audio.stopVoice();
    if (runCounts) onReportScore?.(score);
  }, [levelResult]);

  if (activePhase === "intro") {
    return (
      <LevelIntroSequence
        levelConfig={levelConfig}
        onComplete={handleIntroComplete}
      />
    );
  }

  if (activePhase === "end") {
    return (
      <LevelEndSequence
        levelConfig={levelConfig}
        won={levelResult === "win"}
        finalScore={score}
        newRecord={isNewRecord}
        onComplete={handleEndComplete}
      />
    );
  }

  const currentBossSprite =
    BOSS_SPRITES[levelMaker.customerIndex % BOSS_SPRITES.length];

  return (
    <View style={styles.screenWrapper}>
      <ImageBackground
        source={require("../assets/Final/GameplayUI/GameplayScreen.png")}
        style={[styles.container, { width: winW, height: winH }]}
        resizeMode="stretch"
      >
        {/* Boss Stage Header Banner */}
        <View style={styles.headerBackground}>
          <TouchableOpacity
            onPress={() => {
              audio.playSfx("click");
              onBack?.();
            }}
            activeOpacity={0.7}
            style={styles.quitWrapper}
          >
            <Image
              source={require("../assets/Final/GameplayUI/quit-sign.png")}
              style={styles.quitButton}
            />
          </TouchableOpacity>

          <ImageBackground
            source={require("../assets/Final/GameplayUI/CoinPatience.png")}
            style={styles.patienceCoinBoard}
            resizeMode="stretch"
          >
            <Animated.View
              style={[styles.coinPop, { transform: [{ scale: coinPop.scale }] }]}
            >
              <Text
                style={styles.coinText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatCurrency(currency)}
              </Text>
              {coinPop.burst > 0 && (
                <Twinkle key={coinPop.burst} loop={false} spots={COIN_SPOTS} />
              )}
            </Animated.View>
          </ImageBackground>
        </View>

        <LevelTimer
          targetScore={levelConfig.targetScore}
          currentScore={score}
          initialTimeInSeconds={levelConfig.timeLimitSeconds}
          isPaused={
            levelResult !== null ||
            achievements.currentAchievement !== null ||
            isStoreOpen
          }
          onLevelEnd={handleLevelEnd}
        />

        {/* Boss Stage Title Indicator */}
        <View style={styles.bossTitleOverlay} pointerEvents="none">
          <Text style={styles.bossTitleText}>BOSS STAGE</Text>
        </View>

        {/* Boss Character Area (Maintains Patience System) */}
        <View style={styles.customerArea}>
          <View style={styles.customerBox}>
            <Image
              source={currentBossSprite.source}
              style={[
                styles.characterBoss,
                { top: SPRITE_TOP - currentBossSprite.bottom },
              ]}
            />
          </View>

          <CustomerMood
            key={`boss-${levelMaker.customerIndex}-${healthRespawnKey}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            onPatienceChange={handlePatienceChange}
            decayRateMs={levelConfig.patienceDecayMs}
            drainMultiplier={patienceDrainMultiplier}
            style={[
              styles.patienceMeter,
              { left: winW / 2 + PATIENCE_OFFSET_X },
            ]}
          />
        </View>

        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          slots={wordInput.slots}
          onSlotPress={wordInput.returnLetterFromSlot}
          onHolePress={wordInput.selectHoleSlot}
          targetHoleId={wordInput.targetHoleId}
          lastResult={wordInput.lastResult}
          inputBoxCount={wordInput.inputBoxCount}
        />

        {/* Plate / Serve action */}
        <View style={styles.table}>
          <PlateButton onPress={handleServePlate} style={styles.plate} />
        </View>

        {/* Chef Player Character */}
        <View style={styles.chefBar}>
          <Image
            source={require("../assets/Final/MainCharacter.png")}
            style={styles.characterChef}
          />
        </View>

        {/* Conveyor Belts */}
        <ImageBackground
          source={require("../assets/Final/GameplayUI/conveyors.png")}
          style={styles.conveyorGroup}
          resizeMode="stretch"
        >
          {BELT_ROWS.map((row) => (
            <View key={row} style={styles.conveyorRow}>
              <ConveyorBelt
                ref={conveyorRefs[row]}
                style={styles.conveyorBelt}
                config={{
                  slotDurationMs: levelConfig.conveyorSpeed,
                  slotWidth: 70,
                  slotHeight: 60,
                  ...getBeltConfig(levelConfig, row),
                }}
                onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
              />
            </View>
          ))}
        </ImageBackground>

        {extraHealth > 0 && (
          <View style={styles.statusOverlay} pointerEvents="none">
            <Text style={styles.healthText}>♥ Extra Health: {extraHealth}</Text>
          </View>
        )}

        <StatusBar style="light" />
      </ImageBackground>

      <UpgradeToast
        messages={toastMessages}
        onDone={() => setToastMessages([])}
      />
      <UpgradeHUD activeList={safeUpgrades.activeList} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  container: {
    alignItems: "center",
  },
  headerBackground: {
    width: "100%",
    flex: 130,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  quitWrapper: { alignItems: "center", justifyContent: "center" },
  quitButton: { width: 130, height: 100, resizeMode: "contain" },
  patienceCoinBoard: {
    width: 130,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  coinPop: { marginTop: -125, marginLeft: 50, maxWidth: 80 },
  coinText: {
    flexShrink: 1,
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },

  bossTitleOverlay: {
    position: "absolute",
    top: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bossTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF4D4D",
    textShadowColor: "#000",
    textShadowRadius: 3,
    textShadowOffset: { width: 1, height: 1 },
  },

  statusOverlay: {
    position: "absolute",
    top: 36,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  healthText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFD6E0",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },

  customerArea: { flex: 150, width: "100%" },
  customerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  characterBoss: { width: 180, height: 180, resizeMode: "contain", left: -72, marginBottom: 10 },
  patienceMeter: {
    position: "absolute",
    top: "50%",
    marginTop: -150,
    width: 130,
    height: 150,
  },

  table: {
    width: "100%",
    flex: 150,
    marginTop: -60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  plate: { width: 120, height: 60, marginTop: 60 },

  chefBar: {
    flex: 130,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 15,
  },
  characterChef: {
    width: 115,
    height: 115,
    resizeMode: "contain",
    left: 125,
    bottom: 60,
  },

  conveyorGroup: {
    width: "100%",
    flex: 240,
    flexDirection: "column",
    bottom: 75,
  },
  conveyorRow: { justifyContent: "center", alignItems: "center", bottom: 10 },
  conveyorBelt: { marginTop: 20 },
});