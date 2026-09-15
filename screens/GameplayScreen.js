import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity, Text } from 'react-native';
import { ConveyorBelt } from '../components/gameplayReusables/ConveyorBelt';
import { useWordInput, CurrentWordDisplay } from '../components/gameplayReusables/WordInput';
import CustomerMood from '../components/gameplayReusables/CustomerMood';
import LevelTimer from '../components/gameplayReusables/LevelTimer';
import { useScoreSystem } from '../components/gameplayReusables/UseScoreSystem';
import { CURRENCY_PER_WORD } from '../components/gameplayReusables/UseWallet';
import QuitModal from '../components/QuitModal';

import { LEVEL_1_CONFIG } from '../levels/levelPresets';
import { useLevelMaker } from '../levels/useLevelMaker';
import { LevelIntroSequence, LevelEndSequence } from '../levels/IntroEndSequence';

const BELT_ROWS = [0, 1, 2]; // how many belt rows

const CUSTOMER_IMAGES = [
  require('../assets/Placeholder/SampleCustomer_1.png'),
  require('../assets/Placeholder/SampleCustomer_2.png'),
  require('../assets/Placeholder/SampleCustomer_3.png'),
];

/**
 * GameplayScreen
 * ----------------
 * `wallet` is the useWallet() instance created once in App.js — passed
 * straight through to LevelSession, which hands it to useScoreSystem so
 * every correctly-served word also earns currency (see UseWallet.js's
 * CURRENCY_PER_WORD for the earn rate and why it's separate from score).
 *
 * `isStoreOpen` comes from App.js's `showStore` state. The Store renders
 * as a Modal *on top of* this screen rather than replacing it (see the
 * comment in App.js), so GameplayScreen never unmounts while shopping —
 * which means it's this screen's job to freeze itself while the Store is
 * up, or the timer/patience/belts would all keep running in the background.
 */
export default function GameplayScreen({ onOpenStore, onBack, levelConfig = LEVEL_1_CONFIG, wallet, isStoreOpen }) {
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
      wallet={wallet}
      isStoreOpen={isStoreOpen}
    />
  );
}

function LevelSession({ levelConfig, onOpenStore, onBack, onRetry, wallet, isStoreOpen }) {
  const [phase, setPhase] = useState('intro');

  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const customerRef = useRef(null);

  // Every valid word both scores AND earns wallet currency —
  // onCurrencyEarned is the hook-up point. This is the #1 place to
  // check if currency ever stops flowing: if this arrow function isn't
  // here, or `wallet` isn't passed down from App.js, words score but
  // never pay out.
  const { score, addScoreFromWord, deductScore } = useScoreSystem(
    () => wallet.addCurrency(CURRENCY_PER_WORD)
  );

  const levelMaker = useLevelMaker(levelConfig);

  const customerImage = useMemo(
    () => CUSTOMER_IMAGES[Math.floor(Math.random() * CUSTOMER_IMAGES.length)],
    [levelMaker.customerIndex]
  );

  // Mr. Ratty spawning sends the player to the Store — the discount/
  // inflate popup itself is shown there (ShopOutcomeModal, in
  // StoreScreen.js) as the result of an actual buy/decline action,
  // not guessed here.
  useEffect(() => {
    if (levelMaker.showRattyEvent) {
      levelMaker.dismissRattyEvent(); // clear the flag so it doesn't refire on return
      onOpenStore?.();
    }
  }, [levelMaker.showRattyEvent, levelMaker, onOpenStore]);

  const [showQuitModal, setShowQuitModal] = useState(false);

  const [levelResult, setLevelResult] = useState(null);

  // Freeze everything gameplay-related — timer, customer patience, and
  // all three conveyor belts — while the Store overlay is open (Mr.
  // Ratty), the Quit confirmation is up, or the level has already ended.
  // GameplayScreen stays mounted underneath the Store's Modal (see
  // App.js's comment on why), so without this flag the round keeps
  // ticking away in the background the whole time the player is
  // shopping/upgrading.
  const isPaused = isStoreOpen || showQuitModal || levelResult !== null;

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

  const wordInput = useWordInput(
    conveyorRefs,
    {
      scoreMultiplier: levelConfig.scoreMultiplier,
      wordRules: { minLength: levelConfig.wordDifficulty.minLength },
    },
    levelConfig.maxLettersOnBelt,
    handleWordSubmit
  );

  const handleLevelEnd = useCallback((won) => {
    setLevelResult((prev) => prev ?? (won ? 'win' : 'lose'));
  }, []);

  useEffect(() => {
    if (levelMaker.isLevelComplete) {
      handleLevelEnd(true);
    }
  }, [levelMaker.isLevelComplete, handleLevelEnd]);

  const handleCustomerLeft = useCallback(() => {
    handleLevelEnd(false);
  }, [handleLevelEnd]);

  const handleServePlate = () => {
    if (isPaused) return; // belt-and-braces: ignore taps that leak past the Store/Quit modal
    wordInput.submitWord();
  };

  const handleIntroComplete = () => setPhase('playing');

  // Win -> the Store (spend what was earned before moving on).
  // Lose -> retry the same level from scratch.
  const handleEndComplete = () => {
    if (levelResult === 'lose') {
      onRetry();
    } else {
      onOpenStore?.();
    }
  };

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
          <TouchableOpacity onPress={() => setShowQuitModal(true)} activeOpacity={0.7} style={styles.quitButtonWrapper}>
              <Image source={require('../assets/Placeholder/QuitButton.png')} style={styles.quitButton} />
              <Text style={styles.quitButtonText}>QUIT</Text>
            </TouchableOpacity>
          {/* Wallet balance — was just the icon before, with no number
              next to it, so the coin count never actually showed. */}
          <View style={styles.coinDisplay}>
            <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.moneyIcon} />
            <Text style={styles.coinText}>{wallet.currency}</Text>
          </View>
        </ImageBackground>

        {/* Timer — paused while the Store (Mr. Ratty) or Quit confirmation
            is up, so neither can be dodged/exploited by a countdown that
            keeps running in the background. */}
        <LevelTimer
          targetScore={levelConfig.targetScore}
          currentScore={score}
          initialTimeInSeconds={levelConfig.timeLimitSeconds}
          isPaused={isPaused}
          onLevelEnd={handleLevelEnd}
        />
        {/* 2. Customer + patience meter */}
        <View style={styles.customerBox}>
          <Image
            source={customerImage}
            style={styles.characterDog}
          />
          <CustomerMood
            key={`customer-${levelMaker.customerIndex}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            style={styles.patienceMeter}
            isPaused={isPaused}
          />
        </View>

        <View style={styles.wordInputRow}>
          <CurrentWordDisplay
            currentWord={wordInput.currentWord}
            lastResult={wordInput.lastResult}
            maxLetters={wordInput.maxLetters}
          />
          {/* Undo — removes just the most recently selected letter, so
              a mis-tap doesn't force clearing/resubmitting the whole word. */}
          <TouchableOpacity
            onPress={wordInput.removeLastLetter}
            activeOpacity={0.7}
            disabled={wordInput.currentWord.length === 0}
            style={[styles.undoButton, wordInput.currentWord.length === 0 && styles.undoButtonDisabled]}
          >
            <Text style={styles.undoButtonText}>⌫</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Table / plate */}
        <ImageBackground
          source={require('../assets/Placeholder/Table.png')}
          style={styles.table}
          resizeMode='stretch'
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7} disabled={isPaused}>
            <Image source={require('../assets/Placeholder/Plate.png')} style={styles.plate} />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. Chef */}
        <View style={styles.chefBar}>
          <Image source={require('../assets/Placeholder/WormProtagonist_1.png')} style={styles.characterChef} />
        </View>

        {/* 5. Conveyor belts — frozen mid-slide while isPaused (Store open,
            Quit confirmation up, or level already ended), so letters don't
            keep scrolling behind the Store overlay. */}
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
                isPaused={isPaused}
              />
            </ImageBackground>
          ))}
        </View>

        <StatusBar style="light" />
      </View>

      {/* Quit confirmation */}
      <QuitModal
        visible={showQuitModal}
        onQuit={() => {
          setShowQuitModal(false);
          onBack?.();
        }}
        onCancel={() => setShowQuitModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  coinDisplay: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  moneyIcon: { width: 40, height: 40, resizeMode: 'contain' },
  coinText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  customerBox: { flex: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 15 },
  characterDog: { width: 160, height: 160, resizeMode: 'contain' },
  patienceMeter: { width: 94, height: 130, marginTop: -80, resizeMode: 'contain' },

  wordInputRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  undoButton: {
    width: 40, height: 40, borderRadius: 8, backgroundColor: '#5a3a20',
    alignItems: 'center', justifyContent: 'center',
  },
  undoButtonDisabled: { opacity: 0.4 },
  undoButtonText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  table: {
    width: '100%', flex: 150, marginTop: -60, zIndex: 2,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  plate: { width: 60, height: 60 },

  chefBar: { flex: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 15 },
  characterChef: { width: 115, height: 115, resizeMode: 'contain' },

  conveyorGroup: { width: '100%', flex: 240, flexDirection: 'column' },
  conveyor: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

  quitButtonWrapper: {
  justifyContent: 'center',
  alignItems: 'center',
  },

  quitButtonText: {
  position: 'absolute',
  fontSize: 16,
  fontWeight: 'bold',
  color: '#fff',
  },
});