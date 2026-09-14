import React, { useRef, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { ConveyorBelt } from '../components/gameplayReusables/ConveyorBelt';
import { useWordInput, CurrentWordDisplay } from '../components/gameplayReusables/WordInput';
import CustomerMood from '../CustomerMood';
import LevelTimer from '../LevelTimer';
import { useScoreSystem } from '../useScoreSystem';
import LevelResultModal from '../LevelResultModal';

const BELT_ROWS = [0, 1, 2]; // how many belt rows
const TARGET_SCORE = 300;    // points needed to win the level — tune per level later
const LEVEL_TIME_SECONDS = 60;

export default function GameplayScreen({ onOpenStore, onBack }) {
  // One ref per conveyor row. useWordInput only ever calls the ref's
  // existing getLetters()/removeLetterById() — it should never touch the CONVEYOR system
  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const wordInput = useWordInput(conveyorRefs);

  // Ref so CustomerMood's applyWrongWordPenalty/restorePatience can be
  // called imperatively from handleServePlate, per its own doc comment.
  const customerRef = useRef(null);

  const {
    score,
    addScoreFromWord,
    deductScore,
    resetLevelScore,
  } = useScoreSystem();

  // null | 'win' | 'lose' — drives LevelResultModal. Also used to freeze
  // LevelTimer (isPaused) the instant the level ends, so the countdown
  // can't keep ticking (or firing onLevelEnd again) underneath the modal.
  const [levelResult, setLevelResult] = useState(null);

  // Bumped on retry to force LevelTimer/CustomerMood to remount with
  // fresh internal state (they don't expose an imperative reset for
  // patience/time, so remounting via `key` is the simplest reset).
  const [levelKey, setLevelKey] = useState(0);

  const handleLevelEnd = useCallback((won, finalScore) => {
    setLevelResult(won ? 'win' : 'lose');
  }, []);

  // Customer patience hitting 0 is its own loss condition, independent
  // of the clock — same handler, just always "lost".
  const handleCustomerLeft = useCallback(() => {
    if (levelResult) return; // already ended via the timer, ignore
    handleLevelEnd(false, score);
  }, [handleLevelEnd, levelResult, score]);

  const handleServePlate = () => {
    // Thematically: putting the built word "on the plate" and serving it
    // to the customer submits it for validation + scoring. Swap this for
    // a dedicated submit button any time without touching useWordInput. Please I hate myself for this
    const result = wordInput.submitWord();

    if (result.valid) {
      addScoreFromWord(result.word);
      customerRef.current?.restorePatience();
    } else if (result.word.length > 0) {
      // Only penalize an actual wrong attempt, not an empty submit.
      deductScore(10);
      customerRef.current?.applyWrongWordPenalty();
    }
  };

  const handleRetry = () => {
    setLevelResult(null);
    resetLevelScore();
    setLevelKey((k) => k + 1);
  };

  const handleConfirmResult = () => {
    const wasLose = levelResult === 'lose';
    handleRetry();
    if (wasLose && onOpenStore) {
      onOpenStore(); // Switches to StoreScreen on lose, same as before
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>

        {/* 1. HEADER BANNER (Quit button on left, coins on right) */}
        <ImageBackground
          source={require('../assets/Placeholder/TopBoard.png')}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          <Image
            source={require('../assets/Placeholder/QuitButton.png')}
            style={styles.quitButton}
          />
          <Image
            source={require('../assets/Placeholder/pixel_coins.png')}
            style={styles.moneyIcon}
          />
        </ImageBackground>

        {/* Timer — lives right under the header so it's always visible.
            Paused the moment the level ends so it can't tick past 0 or
            re-fire onLevelEnd while the result modal is up. */}
        <LevelTimer
          key={`timer-${levelKey}`}
          targetScore={TARGET_SCORE}
          currentScore={score}
          initialTimeInSeconds={LEVEL_TIME_SECONDS}
          isPaused={levelResult !== null}
          onLevelEnd={handleLevelEnd}
        />

        {/* 2. TOP CHARACTER (Dog) + Customer Mood/patience */}
        <View style={styles.customerBox}>
          <Image
            source={require('../assets/Placeholder/SampleCustomer_1.png')}
            style={styles.characterDog}
          />
          <Image
            source={require('../assets/Placeholder/CustomerPatienceBar_1.png')}
            style={styles.patienceMeter}
          />
        </View>
        <CustomerMood
          key={`customer-${levelKey}`}
          ref={customerRef}
          onCustomerLeft={handleCustomerLeft}
        />

        {/* Current word being built — purely presentational, reads
            straight off useWordInput's state. maxLetters is passed
            through so the row always shows the right number of slots
            (filled + blank placeholders), not just however many letters
            happen to be picked so far. */}
        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          lastResult={wordInput.lastResult}
          maxLetters={wordInput.maxLetters}
        />

        {/* 3. Table where plates are — tapping the plate serves/submits
            the current word for validation + scoring. */}
        <ImageBackground
          source={require('../assets/Placeholder/Table.png')}
          style={styles.table}
          resizeMode='stretch'
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image
              source={require('../assets/Placeholder/Plate.png')}
              style={styles.plate}
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. BOTTOM CHARACTER (Chef) */}
        <View style={styles.chefBar}>
          <Image
            source={require('../assets/Placeholder/WormProtagonist_1.png')}
            style={styles.characterChef}
          />
        </View>

        {/* 5. CONVEYOR BELT — each row is its own ConveyorBelt instance
            (movement/spawn/wrap-around owned entirely by that component).
            onLetterPress here does nothing but hand the tapped letter off
            to the Word Input System via wordInput.selectLetter — the
            belt itself doesn't know a Word Input System exists. */}
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
              config={{ maxLetters: 6, slotWidth: 70, slotHeight: 60 }} // Perfect size 6, 70, 60
              onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
            />
          </ImageBackground>
        ))}

        <StatusBar style="light" />
      </View>

      {/* LEVEL RESULT MODAL — shown once either LevelTimer or CustomerMood
          reports the level is over. */}
      <LevelResultModal
        visible={levelResult !== null}
        type={levelResult || 'win'}
        score={score}
        onConfirm={handleConfirmResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* 1 */
  screenWrapper: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#b87b4e',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  headerBackground: {
    width: '100%',
    height: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  quitButton: {
    width: 90,
    height: 55,
    resizeMode: 'contain',
  },
  moneyIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  /* 2 */
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 15,
  },
  characterDog: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
  patienceMeter: {
    width: 94,
    height: 130,
    marginTop: -80,
    resizeMode: 'contain',
  },

  /* 3 */
  table: {
    width: '100%',
    height: 150,
    marginTop: -60,   // pulls the table up over the bottom of the dog image
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plate: {
    width: 60,
    height: 60,
  },

  /* 4 */
  chefBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 15,
  },
  characterChef: {
    width: 115,
    height: 115,
    resizeMode: 'contain',
  },
  sideColumn: {
    gap: 8,
  },
  sideItem: {
    width: 36,
    height: 36,
  },

  /* 5 */
  conveyor: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conveyorBelt: {
    alignSelf: 'center',
  },
});