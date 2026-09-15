import React, { useRef, useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { ConveyorBelt } from '../components/gameplayReusables/ConveyorBelt';
import { useWordInput, CurrentWordDisplay } from '../components/gameplayReusables/WordInput';
import CustomerMood from '../CustomerMood';
import LevelTimer from '../LevelTimer';
import { useScoreSystem } from '../UseScoreSystem';
import MrRattyDiscount from '../MrRattyDiscount';

import { LEVEL_1_CONFIG } from '../levels/levelPresets';
import { useLevelMaker } from '../levels/useLevelMaker';
import { LevelIntroSequence, LevelEndSequence } from '../levels/IntroEndSequence';

const BELT_ROWS = [0, 1, 2]; // how many belt rows

/**
 * GameplayScreen
 * ----------------
 * Thin outer shell. Its only job is owning `sessionId` — bumping it on
 * retry forces React to fully unmount + remount <LevelSession>, which
 * throws away EVERY hook inside it (useWordInput, useScoreSystem,
 * useLevelMaker, phase state, all of it) and starts each fresh.
 *
 * This replaces the old approach of manually calling resetLevelScore()
 * + bumping a levelKey prop threaded into individual components: that
 * approach silently missed useWordInput's `lastResult` and all of
 * useLevelMaker's internal state, which is exactly what caused stale
 * "error from last round" state to reappear after Retry. A full
 * component remount can't miss a hook the way manual resets can.
 */
export default function GameplayScreen({ onOpenStore, onBack, levelConfig = LEVEL_1_CONFIG }) {
  const [sessionId, setSessionId] = useState(0);

  const handleRetry = useCallback(() => {
    setSessionId((id) => id + 1);
  }, []);

  return (
    <LevelSession
      key={sessionId}
      levelConfig={levelConfig}
      onOpenStore={onOpenStore}
      onBack={onBack}
      onRetry={handleRetry}
    />
  );
}

/**
 * LevelSession
 * -------------
 * Everything that plays out over the course of ONE attempt at a level.
 * Every hook here starts clean whenever GameplayScreen remounts it with
 * a new `key` — no manual per-hook reset calls needed.
 *
 * Data flow:
 *   LevelConfig (levels/levelPresets.js)
 *        |
 *        v
 *   useLevelMaker(levelConfig)  --------- customer cycling, Ratty timer, isLevelComplete
 *        |
 *        v
 *   LevelSession (this component) ------- reads levelMaker + score, decides what's on screen
 *        |                 \
 *        v                  v
 *   useScoreSystem      CustomerMood / LevelTimer (imperative + prop-driven)
 *        |
 *        v
 *   LevelEndSequence (levels/IntroEndSequence.js) --------- shows final score/stars,
 *                                                            calls onRetry() or onOpenStore()
 */
function LevelSession({ levelConfig, onOpenStore, onBack, onRetry }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'end'

  // One ref per conveyor row.
  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const customerRef = useRef(null);

  const { score, addScoreFromWord, deductScore } = useScoreSystem();

  const levelMaker = useLevelMaker(levelConfig);

  // Fires once per submitted word — whether it was auto-submitted (belt
  // filled to maxLetters) or manually served via the Plate button.
  const handleWordSubmit = useCallback((result) => {
    if (result.valid) {
      addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
      customerRef.current?.restorePatience(100);
      levelMaker.registerServedWord();
    } else if (result.word.length > 0) {
      deductScore(10);
      customerRef.current?.applyWrongWordPenalty();
    }
  }, [addScoreFromWord, deductScore, levelConfig.scoreMultiplier, levelMaker]);

  // Map the wide LevelConfig down to the narrow shape useWordInput/
  // ConveyorBelt already expect.
  const wordInput = useWordInput(
    conveyorRefs,
    {
      scoreMultiplier: levelConfig.scoreMultiplier,
      wordRules: { minLength: levelConfig.wordDifficulty.minLength },
    },
    levelConfig.maxLettersOnBelt,
    handleWordSubmit
  );

  // null | 'win' | 'lose'
  const [levelResult, setLevelResult] = useState(null);

  const handleLevelEnd = useCallback((won) => {
    setLevelResult((prev) => prev ?? (won ? 'win' : 'lose')); // ignore if already ended
  }, []);

  // Win path #1: clock hits 0 with enough score (LevelTimer calls this).
  // Win path #2: all customers served before time runs out (useLevelMaker).
  useEffect(() => {
    if (levelMaker.isLevelComplete) {
      handleLevelEnd(true);
    }
  }, [levelMaker.isLevelComplete, handleLevelEnd]);

  const handleCustomerLeft = useCallback(() => {
    handleLevelEnd(false); // patience hit 0 -> always a loss, independent of the clock
  }, [handleLevelEnd]);

  const handleServePlate = () => {
    wordInput.submitWord(); // scoring/patience handled by handleWordSubmit via onSubmit
  };

  const handleIntroComplete = () => setPhase('playing');

  const handleEndComplete = () => {
    if (levelResult === 'lose') {
      onRetry(); // remounts the whole LevelSession — no manual state resets needed
    } else {
      onOpenStore?.(); // or swap for level-select / next-level navigation later
    }
  };

  // Once the level actually ends, flip to the 'end' phase so
  // LevelEndSequence takes over rendering.
  useEffect(() => {
    if (levelResult) setPhase('end');
  }, [levelResult]);

  if (phase === 'intro') {
    return <LevelIntroSequence levelConfig={levelConfig} onComplete={handleIntroComplete} />;
  }

  if (phase === 'end') {
    return (
      <LevelEndSequence
        levelConfig={levelConfig}
        won={levelResult === 'win'}
        finalScore={score}
        onComplete={handleEndComplete}
      />
    );
  }

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>

        {/* 1. HEADER BANNER */}
        <ImageBackground
          source={require('../assets/Placeholder/TopBoard.png')}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          <Image source={require('../assets/Placeholder/QuitButton.png')} style={styles.quitButton} />
          <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.moneyIcon} />
        </ImageBackground>

        {/* Timer — paused while Mr. Ratty's popup is up, or once the
            level has already ended, so it can't double-fire. */}
        <LevelTimer
          targetScore={levelConfig.targetScore}
          currentScore={score}
          initialTimeInSeconds={levelConfig.timeLimitSeconds}
          isPaused={levelResult !== null || levelMaker.showRattyEvent}
          onLevelEnd={handleLevelEnd}
        />

        {/* 2. Customer + patience meter. Remounted (fresh patience) every
            time useLevelMaker advances to the next customer — keyed on
            customerIndex so mid-level customer changes reset it too,
            not just full-session retries. */}
        <View style={styles.customerBox}>
          <Image
            source={require('../assets/Placeholder/SampleCustomer_1.png')}
            style={styles.characterDog}
          />
          <CustomerMood
            key={`customer-${levelMaker.customerIndex}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            style={styles.patienceMeter}
          />
        </View>

        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          lastResult={wordInput.lastResult}
          maxLetters={wordInput.maxLetters}
        />

        {/* 3. Table / plate — serves the current word */}
        <ImageBackground
          source={require('../assets/Placeholder/Table.png')}
          style={styles.table}
          resizeMode='stretch'
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image source={require('../assets/Placeholder/Plate.png')} style={styles.plate} />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. Chef */}
        <View style={styles.chefBar}>
          <Image source={require('../assets/Placeholder/WormProtagonist_1.png')} style={styles.characterChef} />
        </View>

        {/* 5. Conveyor belts — conveyorSpeed comes straight from LevelConfig */}
        <View style={styles.conveyorGroup}>
          {BELT_ROWS.map((row) => (
            <ImageBackground
              key={row}
              source={require('../assets/Placeholder/Conveyor.png')}
              style={styles.conveyor}
              resizeMode="stretch"
            >
              <ConveyorBelt
                ref={conveyorRefs[row]}
                style={styles.conveyorBelt}
                config={{
                  maxLetters: levelConfig.maxLettersOnBelt,
                  slotDurationMs: levelConfig.conveyorSpeed,
                  slotWidth: 70,
                  slotHeight: 60,
                }}
                onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
              />
            </ImageBackground>
          ))}
        </View>

        <StatusBar style="light" />
      </View>

      {/* Mr. Ratty — pops up whenever useLevelMaker's timer rolls it. */}
      <MrRattyDiscount
        visible={levelMaker.showRattyEvent}
        onDismiss={levelMaker.dismissRattyEvent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* 1 */
  screenWrapper: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1, width: '100%', maxWidth: 420, backgroundColor: '#b87b4e',
    alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0,
  },
  headerBackground: {
    width: '100%', flex: 130, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15,
  },
  quitButton: { width: 90, height: 55, resizeMode: 'contain' },
  moneyIcon: { width: 40, height: 40, resizeMode: 'contain' },

  /* 2 */
  customerBox: { flex: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 15 },
  characterDog: { width: 160, height: 160, resizeMode: 'contain' },
  patienceMeter: { width: 94, height: 130, marginTop: -80, resizeMode: 'contain' },

  /* 3 */
  table: {
    width: '100%', flex: 150, marginTop: -60, zIndex: 2,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  plate: { width: 60, height: 60 },

  /* 4 */
  chefBar: { flex: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 15 },
  characterChef: { width: 115, height: 115, resizeMode: 'contain' },

  /* 5 */
  conveyorGroup: { width: '100%', flex: 240, flexDirection: 'column' },
  conveyor: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});