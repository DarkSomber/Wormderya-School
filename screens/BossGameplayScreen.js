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
  Easing,
  StyleSheet,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import Text from "../components/AppText";
import { ConveyorBelt, createWordSpawner } from "../components/gameplayReusables/ConveyorBelt";
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
import PauseModal from "../components/PauseModal";
import { ACHIEVEMENTS } from "../components/gameplayReusables/Achievements.js";
import ServeCounter from "../components/gameplayReusables/ServeCounter";
import UpgradeHUD from "../components/gameplayReusables/UpgradeHUD";
import { UPGRADE_LIST } from "../components/gameplayReusables/UseUpgrades";
import AnimatedNpc from "../components/gameplayReusables/AnimatedNpc.js";
import HintBubble from "../components/gameplayReusables/HintBubble";
import { useHint } from "../components/gameplayReusables/UseHint";
import { HINT_BONUS_RATIO } from "../components/gameplayReusables/hints.js";

import {
  useStage,
  Stage,
  Slot,
  GAMEPLAY_RECTS as RECTS,
  PATIENCE_METER_BOX,
} from "../components/gameplayReusables/Stage";
import { getLevelConfigById } from "../levels/levelPresets";
import { getBeltConfig } from "../levels/LevelConfig";
import { useLevelMaker } from "../levels/useLevelMaker";
import {
  LevelIntroSequence,
  LevelEndSequence,
} from "../levels/IntroEndSequence";

import audio from "../audio/AudioManager";
import { customerVoice } from "../audio/customerVoice";

const BELT_ROWS = [0, 1, 2];
const COIN_SPOTS = [
  { x: 0, y: 0.15, size: 9, delay: 0 },
  { x: 1, y: 0.3, size: 7, delay: 120 },
  { x: 0.5, y: -0.05, size: 8, delay: 240 },
];

const BOSS_SPRITES = [
  {
    source: require("../assets/Final/Customers/CustomerBoss.png"),
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
  const [showPause, setShowPause] = useState(false); 
  const { scale, w, h } = useStage();

  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const customerRef = useRef(null);
  const customerSpriteRef = useRef(null);
  const [healthRespawnKey, setHealthRespawnKey] = useState(0);

  const toastedIdsRef = useRef(new Set());
  const [toastMessages, setToastMessages] = useState([]);

  useEffect(() => {
    if (phase === "playing") safeUpgrades.startNewRound();
  }, [phase]);

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

  const { score, addScoreFromWord, addBonusScore } = useScoreSystem({
    onCurrencyEarned: addCurrency,
    getRewardMultiplier: () => rewardMultiplier,
  });

  const levelMaker = useLevelMaker(levelConfig, isStoreOpen || showPause);

  const customersServed = Math.min(levelMaker.customerIndex, levelConfig.totalCustomers);
  const wordsServed =
    levelMaker.customerIndex * levelConfig.wordsPerCustomer + levelMaker.wordsServedForCustomer;
  const totalWords = levelConfig.totalCustomers * levelConfig.wordsPerCustomer;
  const levelMakerRef = useRef(levelMaker);
  levelMakerRef.current = levelMaker;

  const hint = useHint({
    riddle: true,
    rules: {
      minLength: levelConfig.wordDifficulty.minLength,
      maxLength: levelConfig.wordDifficulty.maxLength,
      inputBoxCount: levelConfig.inputBoxCount,
    },
  });

  const spawnerRef = useRef(null);
  if (!spawnerRef.current) spawnerRef.current = createWordSpawner(levelConfig.spawnAssist);
  spawnerRef.current.setTarget(hint.hint.answer);

  const customerVoiceId =
    BOSS_SPRITES[levelMaker.customerIndex % BOSS_SPRITES.length].voice;

  const onWordSubmit = (result) => {
    if (result.word.length > 0) audio.playSfx("serve_word");

    if (result.valid) {
      audio.playSfx("correct");
      customerSpriteRef.current?.bounce(3); 
      customerVoice.served(customerVoiceId, {
        lastForCustomer:
          levelMaker.wordsServedForCustomer + 1 >= levelConfig.wordsPerCustomer,
      });
      const earned = addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
      const hintHit = hint.isMatch(result.word);
      const bonus = hintHit
        ? addBonusScore(Math.round(earned * HINT_BONUS_RATIO.boss))
        : 0;
      if (!hintHit) hint.reveal();
      hopChef(hintHit);
      hint.advance(bonus);
      customerRef.current?.restorePatience(100);
      levelMakerRef.current.registerServedWord();
    } else if (result.word.length > 0) {
      audio.playSfx("wrong");
      customerSpriteRef.current?.shake(2000); 
      customerVoice.wrong(customerVoiceId);
      hint.reveal();
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

  spawnerRef.current.setHeld(wordInput.currentWord.map((tile) => tile.character));

  const [levelResult, setLevelResult] = useState(null);
  const [isWorried, setIsWorried] = useState(false);
  const chefX = useRef(new Animated.Value(0)).current;
  const chefY = useRef(new Animated.Value(0)).current;
  const chefSquash = useRef(new Animated.Value(0)).current;
  const hopChef = (big = false) => {
    const k = big ? 1.7 : 1;
    const t = (v, to, duration, easing) =>
      Animated.timing(v, { toValue: to, duration, easing, useNativeDriver: true });
    const hop = (toX, h, ms) =>
      Animated.sequence([
        Animated.parallel([
          t(chefX, toX, ms, Easing.inOut(Easing.sin)),
          Animated.sequence([
            t(chefY, -h, ms * 0.5, Easing.out(Easing.quad)),
            t(chefY, 0, ms * 0.5, Easing.in(Easing.quad)),
          ]),
        ]),
        Animated.sequence([
          t(chefSquash, 1, 60, Easing.out(Easing.quad)),
          t(chefSquash, 0, 140, Easing.out(Easing.back(2))),
        ]),
      ]);
    [chefX, chefY, chefSquash].forEach((v) => { v.stopAnimation(); v.setValue(0); });
    Animated.sequence([
      hop(8 * k, 12 * k, 240),
      hop(-8 * k, 12 * k, 300),
      hop(0, 5 * k, 200),
    ]).start();
  };
  const chefHopStyle = {
    transformOrigin: '50% 100%', 
    transform: [
      { translateX: chefX },
      { translateY: chefY },
      { scaleX: chefSquash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
      { scaleY: chefSquash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
    ],
  };
  const [wormReady, setWormReady] = useState(false);
  useEffect(() => {
    if (!isWorried) { setWormReady(false); return undefined; }
    const t = setTimeout(() => setWormReady(true), 400);
    return () => clearTimeout(t);
  }, [isWorried]);
  const [statsPing, setStatsPing] = useState(0); 

  const patienceBandRef = useRef("happy");
  const voiceIdRef = useRef(customerVoiceId);
  voiceIdRef.current = customerVoiceId;
  const handlePatienceChange = useCallback((patience) => {
    const band = patienceBand(patience);
    const previous = patienceBandRef.current;
    patienceBandRef.current = band;
    if (band !== previous) {
      customerSpriteRef.current?.jump();
      setIsWorried(band === "angry");
    }
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
    if (wordInput.currentWord.length === 0) return;
    wordInput.submitWord(); 
  };
  const serveDisabled = wordInput.currentWord.length === 0;

  const handleIntroComplete = useCallback(() => setPhase("playing"), []);

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
        customersServed={customersServed}
        wordsServed={wordsServed}
        onComplete={handleEndComplete}
      />
    );
  }

  const currentBossSprite =
    BOSS_SPRITES[levelMaker.customerIndex % BOSS_SPRITES.length];

  return (
    <View style={styles.screenWrapper}>
      <Stage
        source={require("../assets/Final/GameplayUI/GameplayScreen.png")}
        w={w}
        h={h}
      >
        <Slot rect={RECTS.quit}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => {
              audio.playSfx("click");
              setShowPause(true);
            }}
          >
            <Image
              source={require("../assets/Final/buttons/buttonPause2.png")}
              style={{ width: "100%", height: "100%", resizeMode: "contain" }}
            />
          </TouchableOpacity>
        </Slot>

        <ServeCounter
          customersServed={customersServed}
          totalCustomers={levelConfig.totalCustomers}
          wordsServed={wordsServed}
          totalWords={totalWords}
          scale={scale}
          ping={statsPing}
        />

        <Slot rect={RECTS.coin}>
          <ImageBackground
            source={require("../assets/Final/GameplayUI/CoinPatience.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="stretch"
          >
            <View
              style={{
                position: "absolute",
                left: "46%",
                width: "48%",
                top: "10%",
                height: "15%",
                justifyContent: "center",
              }}
            >
              <Animated.View style={{ transform: [{ scale: coinPop.scale }] }}>
                <Text
                  style={{
                    fontSize: 50 * scale,
                    fontWeight: "bold",
                    color: "#fff",
                    textShadowColor: "#000",
                    textShadowRadius: 2,
                    textShadowOffset: { width: 1, height: 1 },
                  }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(currency)}
                </Text>
              </Animated.View>
              {coinPop.burst > 0 && (
                <Twinkle key={coinPop.burst} loop={false} spots={COIN_SPOTS} />
              )}
            </View>

            <View style={{ position: "absolute", ...PATIENCE_METER_BOX }}>
              <CustomerMood
                key={`boss-${levelMaker.customerIndex}-${healthRespawnKey}`}
                ref={customerRef}
                onCustomerLeft={handleCustomerLeft}
                onPatienceChange={handlePatienceChange}
                decayRateMs={levelConfig.patienceDecayMs}
                drainMultiplier={patienceDrainMultiplier}
                isPaused={showPause || levelResult !== null || achievements.currentAchievement !== null || !!isStoreOpen}
                style={{ width: "100%", height: "100%", marginTop: 0 }}
                resizeMode="stretch"
              />
            </View>
          </ImageBackground>
        </Slot>

        <Slot rect={{ x: 175, y: 120, w: 512, h: 1088 }}>
          <LevelTimer
            targetScore={levelConfig.targetScore}
            currentScore={score}
            initialTimeInSeconds={levelConfig.timeLimitSeconds}
            isPaused={
              levelResult !== null ||
              achievements.currentAchievement !== null ||
              showPause ||
              isStoreOpen
            }
            onLevelEnd={handleLevelEnd}
          />
        </Slot>

        <Slot
          rect={{ x: 175, y: 8, w: 162, h: 50 }}
          style={{ alignItems: "center", justifyContent: "center" }}
        >
          <Text
            style={{
              fontSize: 28 * scale,
              fontWeight: "bold",
              color: "#FF4D4D",
              textShadowColor: "#000",
              textShadowRadius: 3,
              textShadowOffset: { width: 1, height: 1 },
            }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            BOSS STAGE
          </Text>
        </Slot>

        <Slot
          rect={RECTS.customer}
          style={{ alignItems: "center", justifyContent: "flex-end" }}
        >
          <AnimatedNpc
            ref={customerSpriteRef}
            source={currentBossSprite.source}
            npcKey={levelMaker.customerIndex}
            unit={scale}
            imageStyle={{ width: "115%", height: "100%", resizeMode: "contain" }}
          />
        </Slot>

        <Slot rect={RECTS.hint}>
          <HintBubble text={hint.hint.text} reward={hint.reward} answer={hint.revealed} scale={scale} boss />
        </Slot>

        <Slot rect={RECTS.word}>
          <CurrentWordDisplay
            currentWord={wordInput.currentWord}
            slots={wordInput.slots}
            onSlotPress={wordInput.returnLetterFromSlot}
            onHolePress={wordInput.selectHoleSlot}
            targetHoleId={wordInput.targetHoleId}
            lastResult={wordInput.lastResult}
            inputBoxCount={wordInput.inputBoxCount}
            resultMaxWidth={(RECTS.hint.x - RECTS.word.x - 20) * scale}
            resultAlign="left"
          />
        </Slot>

        <Slot rect={{ ...RECTS.serve, y: 556 }}>
          <PlateButton style={{ flex: 1 }} onPress={handleServePlate} disabled={serveDisabled} />
        </Slot>

      <Slot rect={RECTS.chef} scale={scale}>
        <Animated.View pointerEvents="none" style={[{ flex: 1 }, chefHopStyle]}>
          <Image
            source={require('../assets/Final/MainCharacter.png')}
            style={{ width: '100%', height: '100%', opacity: isWorried && wormReady ? 0 : 1 }}
            resizeMode="contain"
          />
          {isWorried && (
            <AnimatedNpc
              source={require('../assets/Final/MainCharacterWorryAnim.gif')}
              npcKey="chef"
              unit={scale}
              worried
              animatedGif
              gifVisible={wormReady}
              onGifLoad={() => setWormReady(true)}
              imageStyle={{
                position: 'absolute',
                left: '-23.4375%',
                top: '-18.75%',
                width: '137.5%',
                height: '125%',
                resizeMode: 'stretch',
              }}
            />
          )}
        </Animated.View>
        <TouchableOpacity
          activeOpacity={1}
          style={{ position: 'absolute', left: '6%', top: 0, width: '94%', height: '89%' }}
          onPress={() => setStatsPing((n) => n + 1)}
        />
      </Slot>

        <Slot rect={RECTS.conveyors}>
          <Image
            source={require("../assets/Final/GameplayUI/conveyors.png")}
            style={{ width: "100%", height: "100%" }}
            resizeMode="stretch"
          />
        </Slot>

        {BELT_ROWS.map((row) => (
          <Slot key={row} rect={RECTS[`belt${row}`]}>
            <ConveyorBelt
              ref={conveyorRefs[row]}
              style={{ width: "100%", height: "100%" }}
              config={{
                slotDurationMs: levelConfig.conveyorSpeed,
                slotWidth: 100 * scale,
                slotHeight: 94 * scale,
                flyDy: (RECTS[`belt${row}`].y + RECTS[`belt${row}`].h / 2 - (RECTS.word.y + 24)) * scale,
                ...getBeltConfig(levelConfig, row),
              }}
              onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
            isPaused={showPause}
              spawner={spawnerRef.current}
              beltIndex={row}
            />
          </Slot>
        ))}
      </Stage>
      <StatusBar style="light" />

      <PauseModal
        visible={showPause}
        onExit={() => {
          setShowPause(false);
          onBack?.();
        }}
        onRetry={() => {
          setShowPause(false);
          onRetry?.();
        }}
        onResume={() => setShowPause(false)}
      />

      <UpgradeHUD upgrades={safeUpgrades} scale={scale} />
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
});