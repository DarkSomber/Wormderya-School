import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
//import { useSafeAreaInsets } from 'react-native-safe'; // TODO: use this
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity, Alert } from 'react-native';
import Text from '../components/AppText';
import { ConveyorBelt } from '../components/gameplayReusables/ConveyorBelt';
import { useWordInput, CurrentWordDisplay } from '../components/gameplayReusables/WordInput';
import CustomerMood from '../components/gameplayReusables/CustomerMood';
import LevelTimer from '../components/gameplayReusables/LevelTimer';
import { useScoreSystem } from '../components/gameplayReusables/UseScoreSystem';
import { formatCurrency } from '../components/gameplayReusables/UseWallet';
import AchievementModal from '../components/gameplayReusables/AchievementModal';
import { ACHIEVEMENTS } from '../components/gameplayReusables/Achievements.js';
import MrRattyDiscount from '../components/gameplayReusables/MrRattyDiscount'; 
import AppButton from '../components/AppButton'; // why is this unused?


import { getLevelConfigById } from '../levels/levelPresets';
import { getBeltConfig } from '../levels/LevelConfig';
import { useLevelMaker } from '../levels/useLevelMaker';
import { LevelIntroSequence, LevelEndSequence } from '../levels/IntroEndSequence';
import { getRushHourLevelConfig, getRushHourStageForWords } from '../levels/RushHourConfig';

const BELT_ROWS = [0, 1, 2]; // belt rows
const CONVEYOR_ROW_GAP = 10; // gap between rows


/**
 * GameplayScreen
 * --------------
 * Thin shell that owns `sessionId` and the level -> difficulty lookup.
 * Bumping sessionId on retry (or changing level) remounts <LevelSession>,
 * resetting every hook inside it. A full remount can't miss state the way
 * manual resets did (stale `lastResult`, useLevelMaker state).
 *
 * Props:
 *   levelId          number | string  preset to load (default 1)
 *   levelConfig      optional; a ready-made LevelConfig, wins over levelId
 *   mode             'normal' (default) | 'rushHour'. rushHour ignores levelId /
 *                    levelConfig and runs endless: stages come from
 *                    levels/rushHourConfig.js, the clock is restored by correct
 *                    words, and onLevelComplete is never called.
 *   onLevelComplete  optional; called once when the level is won
 *   wallet           the useWallet() instance from App.js (single shared balance)
 */
export default function GameplayScreen({
  onOpenStore,
  onBack,
  isStoreOpen,
  onLevelComplete,
  levelId = 1,
  levelConfig: levelConfigOverride,
  wallet,
  achievements,
  mode = 'normal',
}) {
  const [sessionId, setSessionId] = useState(0);

  // Normal: the chosen level. Rush Hour: stage 1 as the starting config (its id is
  // constant, so the session key below only changes on retry). LevelSession then
  // derives the live per-stage config itself.
  const levelConfig = useMemo(
    () => (mode === 'rushHour'
      ? getRushHourLevelConfig(1)
      : levelConfigOverride ?? getLevelConfigById(levelId)),
    [mode, levelConfigOverride, levelId],
  );

  const handleRetry = useCallback(() => {
    setSessionId((id) => id + 1);
  }, []);

  return (
    <>
    <LevelSession
      key={`${levelConfig.id}:${sessionId}`}
      levelConfig={levelConfig}
      onOpenStore={onOpenStore}
      onBack={onBack}
      onRetry={handleRetry}
      onLevelComplete={onLevelComplete}
      isStoreOpen={isStoreOpen}
      wallet={wallet}
      achievements={achievements}
      mode={mode}
    />
    <AchievementModal   //Positioned here so it doesn't unmount when there's something on top
        visible={achievements.currentAchievement !== null}
        achievement={achievements.currentAchievement}
        onDismiss={achievements.dismissAchievement}
      />
    </>
    
  );
}

/**
 * LevelSession
 * ------------
 * One attempt at a level. Remounted via `key`, so all hooks start clean.
 *
 * levelId -> getLevelConfigById -> LevelConfig
 *   -> useLevelMaker (customers, Ratty, isLevelComplete)
 *   -> useScoreSystem, CustomerMood, LevelTimer
 *   -> LevelEndSequence (score/stars; calls onRetry or onOpenStore)
 */
  function LevelSession({ levelConfig: baseLevelConfig, mode, onOpenStore, onBack, onRetry, onLevelComplete, isStoreOpen, wallet, achievements }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'end'

  // --- Rush Hour session state (all reset by the remount on retry) ---
  // Lives here, not in App: it never touches currentLevelId / unlockedLevels.
  const isRushHour = mode === 'rushHour';
  const [rushHourStage, setRushHourStage] = useState(1);
  const [timeBonus, setTimeBonus] = useState(null); // { id, seconds } -> LevelTimer
  const rushHourWordsRef = useRef(0);

  // The config the rest of this component reads. Normal: the level as given.
  // Rush Hour: rebuilt as the stage advances (same shape, same fields).
  const levelConfig = useMemo(
    () => (isRushHour ? getRushHourLevelConfig(rushHourStage) : baseLevelConfig),
    [isRushHour, rushHourStage, baseLevelConfig],
  );

  // One ref per conveyor row.
  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const customerRef = useRef(null);

  // Score lives here (per attempt, can only go up). Currency lives ONLY in
  // the App-level wallet; every scored word is forwarded to it once.
  const { currency, addCurrency } = wallet;
  const { score, addScoreFromWord } = useScoreSystem({ onCurrencyEarned: addCurrency });

  const levelMaker = useLevelMaker(levelConfig, isStoreOpen);

  // Runs on every submitted word (auto-submit or Plate button).
  const handleWordSubmit = useCallback(
    (result) => {
      if (result.valid) {
        addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
        customerRef.current?.restorePatience(100);
        levelMaker.registerServedWord();
        achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD); //Achievement trigger

        if (isRushHour) {
          // Restore some time (LevelTimer applies it once per id and caps it),
          // then advance the stage every wordsPerStage correct words.
          setTimeBonus((prev) => ({ id: (prev ? prev.id : 0) + 1, seconds: levelConfig.timeBonusSeconds }));
          rushHourWordsRef.current += 1;
          setRushHourStage(getRushHourStageForWords(rushHourWordsRef.current));
        }
      } else if (result.word.length > 0) {
        // Wrong word: patience penalty only. Score never decreases.
        customerRef.current?.applyWrongWordPenalty();
      }
    },
    [addScoreFromWord, levelConfig.scoreMultiplier, levelConfig.timeBonusSeconds, levelMaker, achievements, isRushHour],
  );

  // Map LevelConfig to the narrow shape useWordInput/ConveyorBelt expect.
  const wordInput = useWordInput(
    conveyorRefs,
    {
      scoreMultiplier: levelConfig.scoreMultiplier,
      wordRules: {
        minLength: levelConfig.wordDifficulty.minLength,
        maxLength: levelConfig.wordDifficulty.maxLength,
      },
    },
    levelConfig.inputBoxCount, // player input boxes: independent of any belt's letter count
    handleWordSubmit,
  );

  // null | 'win' | 'lose'
  const [levelResult, setLevelResult] = useState(null);

  const handleLevelEnd = useCallback((won) => {
    setLevelResult((prev) => prev ?? (won ? "win" : "lose")); // ignore if already ended
  }, []);

  // Win paths: clock ends with enough score (LevelTimer),
  // or all customers served (useLevelMaker).
  useEffect(() => {
    if (levelMaker.isLevelComplete) {
      handleLevelEnd(true);
    }
  }, [levelMaker.isLevelComplete, handleLevelEnd]);

  useEffect(() => {
    if (levelResult) levelMaker.stop();
  }, [levelResult, levelMaker]);

  // Report a win once (ref guards against callback identity changes).
  const completionReportedRef = useRef(false);
  useEffect(() => {
    // Rush Hour never reports completion: it must not unlock normal levels.
    if (!isRushHour && levelResult === "win" && !completionReportedRef.current) {
      completionReportedRef.current = true;
      onLevelComplete?.(levelConfig.id);
    }
  }, [levelResult, onLevelComplete, levelConfig.id, isRushHour]);

  useEffect(() => {
    if (isStoreOpen) levelMaker.dismissRattyEvent();
  }, [isStoreOpen, levelMaker]);

  const handleCustomerLeft = useCallback(() => {
    handleLevelEnd(false); // patience hit 0 -> always a loss
  }, [handleLevelEnd]);

  const handleServePlate = () => {
    wordInput.submitWord(); // scoring/patience handled via onSubmit
  };

  const handleIntroComplete = () => setPhase("playing");

  const handleEndComplete = () => {
    if (isRushHour || levelResult === "lose") {
      onRetry(); // remounts LevelSession, resetting all state (a Rush Hour run has no "next level")
    } else {
      //onOpenStore?.(); // swap for next-level navigation later (!Remember to remove this.)
      levelMaker.dismissRattyEvent();
      setTimeout(() => {
        onOpenStore?.();
      }, 50)
    }
  };

  // When the level ends, switch to the 'end' phase.
  useEffect(() => {
    if (levelResult) setPhase("end");
  }, [levelResult]);

  if (phase === "intro") {
    return (
      <LevelIntroSequence
        levelConfig={levelConfig}
        onComplete={handleIntroComplete}
      />
    );
  }

  if (phase === "end") {
    return (
      <LevelEndSequence
        levelConfig={levelConfig}
        won={levelResult === "win"}
        finalScore={score}
        rushHourStage={isRushHour ? rushHourStage : null}
        onComplete={handleEndComplete}
      />
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>
        {/* 1. HEADER BANNER */}
        <ImageBackground
          source={require("../assets/Placeholder/TopBoard.png")}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          {/*<Image source={require('../assets/Placeholder/QuitButton.png')} style={styles.quitButton} />*/
          /*Temporary fix for the text in the exit button; fix the template first*/}
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.quitWrapper}>
            <Image source={require('../assets/Placeholder/QuitButton.png')} style={styles.quitButton}/>
              <Text style={styles.quitText} numberOfLines={1}> 
                Return
              </Text>
          </TouchableOpacity>

          {/* Live wallet balance: [ NUMBER ] [ COIN ] */}
          <View style={styles.coinDisplay}>
            <Text style={styles.coinText} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(currency)}
            </Text>
            <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.moneyIcon} />
          </View>
        </ImageBackground>

        {/* Timer — paused during any popups or after the level ends. */}
        {/* Timer — paused during Ratty's popup or after the level ends.
            Rush Hour: endless (time-out = run over), restored by correct words, capped. */}
        <LevelTimer
          targetScore={levelConfig.targetScore}
          currentScore={score}
          initialTimeInSeconds={levelConfig.timeLimitSeconds}
          isPaused={levelResult !== null || levelMaker.showRattyEvent || achievements.currentAchievement !== null} //Added Achievements popup pause
          onLevelEnd={handleLevelEnd}
          endless={isRushHour}
          timeBonus={isRushHour ? timeBonus : null}
          maxTimeInSeconds={isRushHour ? levelConfig.maxTimeSeconds : undefined}
        />
        {isRushHour && <Text style={styles.stageText}>Stage {rushHourStage}</Text>}

        {/* 2. Customer + patience meter. Keyed on customerIndex so patience
            resets for each new customer. */}
        <View style={styles.customerBox}>
          <Image
            source={require("../assets/Placeholder/SampleCustomer_1.png")}
            style={styles.characterDog}
          />
          <CustomerMood
            key={`customer-${levelMaker.customerIndex}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            decayRateMs={levelConfig.patienceDecayMs}
            style={styles.patienceMeter}
          />
        </View>

        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          slots={wordInput.slots}
          onSlotPress={wordInput.returnLetterFromSlot}
          lastResult={wordInput.lastResult}
          inputBoxCount={wordInput.inputBoxCount}
        />

        {/* 3. Table / plate — serves the current word */}
        <ImageBackground
          source={require("../assets/Placeholder/Table.png")}
          style={styles.table}
          resizeMode="stretch"
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image
              source={require("../assets/Placeholder/Plate.png")}
              style={styles.plate}
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. Chef */}
        <View style={styles.chefBar}>
          <Image
            source={require("../assets/Placeholder/WormProtagonist_1.png")}
            style={styles.characterChef}
          />
        </View>

        {/* 5. Conveyor belts (speed from LevelConfig) */}
        <View style={styles.conveyorGroup}>
          {BELT_ROWS.map((row) => (
            <ImageBackground
              key={row}
              source={require("../assets/Placeholder/Conveyor.png")}
              style={styles.conveyor}
              resizeMode="stretch"
            >
              <ConveyorBelt
                ref={conveyorRefs[row]}
                style={styles.conveyorBelt}
                config={{
                  slotDurationMs: levelConfig.conveyorSpeed,
                  slotWidth: 70,
                  slotHeight: 60,
                  // Only set when a level has one (null would override the default).
                  ...(levelConfig.letterPool ? { letterPool: levelConfig.letterPool } : {}),
                  ...getBeltConfig(levelConfig, row), // this belt's letter count + letterDistribution
                }}
                onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
              />
            </ImageBackground>
          ))}
        </View>

        <StatusBar style="light" />
      </View>

      {/* Mr. Ratty popup (rolled by useLevelMaker) */}
      <MrRattyDiscount
        visible={levelMaker.showRattyEvent}
        onDismiss={levelMaker.dismissRattyEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* 1 the screen thingy */
  screenWrapper: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#b87b4e",
    alignItems: "center",
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  headerBackground: {
    width: '105%', flex: 130, flexDirection: 'row', //the width: 105% is a temp fix please fix this
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15,
  },
  quitWrapper: { width: 90, height: 55, left: 20, alignItems: 'center',},
  quitButton: {...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'contain',},
  quitText: {color: 'red', fontSize: 20, textAlign: 'center', top: 14}, //Brute forced yung top since out of bound
  coinDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 1, maxWidth: 170, gap: 10 },
  coinText: { flexShrink: 1, fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  moneyIcon: { width: 40, height: 40, resizeMode: 'contain' },

  stageText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },

  /* 2 Customer Area*/
  customerBox: { flex: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 15 },
  characterDog: { width: 160, height: 160, resizeMode: 'contain' },
  patienceMeter: { width: 94, height: 130, marginTop: -80, resizeMode: 'contain' },

  table: {
    width: "100%",
    flex: 150,
    marginTop: -60,
    zIndex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  plate: { width: 60, height: 60 },

  /* 4 Chef Bar*/
  chefBar: { flex: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 15,  },
  characterChef: { width: 115, height: 115, resizeMode: 'contain', left: 125, bottom: 30 },

  /* 5 Conveyor area */
  conveyorGroup: { width: '100%', flex: 240, flexDirection: 'column', gap: CONVEYOR_ROW_GAP, bottom: 50 },
  conveyor: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});