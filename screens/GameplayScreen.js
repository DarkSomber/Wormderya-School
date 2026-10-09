import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity, useWindowDimensions } from 'react-native';
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
import UpgradeToast from '../components/gameplayReusables/UpgradeToast';
import UpgradeHUD from '../components/gameplayReusables/UpgradeHUD';
import { UPGRADE_LIST } from '../components/gameplayReusables/UseUpgrades';

import { getLevelConfigById } from '../levels/levelPresets';
import { getBeltConfig } from '../levels/LevelConfig';
import { useLevelMaker } from '../levels/useLevelMaker';
import { LevelIntroSequence, LevelEndSequence } from '../levels/IntroEndSequence';
import { getRushHourLevelConfig, getRushHourStageForWords } from '../levels/RushHourConfig';

const BELT_ROWS = [0, 1, 2]; // belt rows

// Customer area tuning. These are the only numbers you need to touch to move
// the sprite or the patience meter.
const SPRITE_TOP = -26;         // sprite vertical offset (negative = up)
const PATIENCE_OFFSET_X = 72;   // meter's left edge, in px right of screen center

// Customer swapper sprites (HARDCODED FOR SECOND CUSTOMER)
const CUSTOMER_SPRITES = [
  { source: require('../assets/Final/Customers/SampleCustomer_1.png'), bottom: 0 },
  { source: require('../assets/Final/Customers/CustomerPicky.png'), bottom: -10 },
];

// Safe fallbacks if a prop wasn't passed down. No effects, but the screen
// still runs so the missing prop is easy to spot.
const NO_UPGRADES = {
  ownedPermanent: new Set(),
  activeTemporary: {},
  activeList: [],
  isActive: () => false,
  rewardMultiplier: 1,
  patienceDrainMultiplier: 1,
  extraHealth: 0,
  consumeExtraHealth: () => {},
  buyUpgrade: () => ({ success: false, reason: 'unavailable' }),
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
 *   achievements     the achievements instance from App.js
 *   upgrades         the useUpgrades() instance from App.js
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
  upgrades,
  mode = 'normal',
}) {
  const [sessionId, setSessionId] = useState(0);

  const safeAchievements = achievements ?? NO_ACHIEVEMENTS;

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
        wallet={wallet ?? NO_WALLET}
        achievements={safeAchievements}
        upgrades={upgrades}
        mode={mode}
      />
      {/* Positioned here so it doesn't unmount when there's something on top */}
      <AchievementModal
        visible={safeAchievements.currentAchievement !== null}
        achievement={safeAchievements.currentAchievement}
        onDismiss={safeAchievements.dismissAchievement}
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
function LevelSession({
  levelConfig: baseLevelConfig,
  mode,
  onOpenStore,
  onBack,
  onRetry,
  onLevelComplete,
  isStoreOpen,
  wallet,
  achievements,
  upgrades,
}) {
  // Fallback so a missing prop never crashes the screen.
  const safeUpgrades = upgrades ?? NO_UPGRADES;

  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'end'
  const { width: winW, height: winH } = useWindowDimensions();
  const boxW = winW;
  const boxH = winH;

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
  const [healthRespawnKey, setHealthRespawnKey] = useState(0);

  // ---- Upgrade toast state ----
  const toastedIdsRef = useRef(new Set());
  const [toastMessages, setToastMessages] = useState([]);

  // Drop expired timers when this session starts.
  useEffect(() => {
    safeUpgrades.startNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Announce active upgrades once per session / activation.
  useEffect(() => {
    const messages = [];

    // Permanent upgrades
    for (const id of safeUpgrades.ownedPermanent) {
      if (toastedIdsRef.current.has(id)) continue;
      toastedIdsRef.current.add(id);
      const u = UPGRADE_LIST.find((x) => x.id === id);
      if (u) messages.push(`${u.name} (permanent)`);
    }

    // Temporary upgrades currently running
    for (const [id, entry] of Object.entries(safeUpgrades.activeTemporary)) {
      const stillActive = entry.expiresAt === null || entry.expiresAt > Date.now();
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

    // Consumables in stock
    if (safeUpgrades.extraHealth > 0 && !toastedIdsRef.current.has('stock:extra-health')) {
      toastedIdsRef.current.add('stock:extra-health');
      messages.push(`Extra Health x${safeUpgrades.extraHealth} ready`);
    }

    if (messages.length > 0) {
      if (__DEV__) {
        messages.forEach((m) => console.log(`[Upgrades] ${m}`));
      }
      // Append instead of replace so a toast still on screen isn't cut off.
      setToastMessages((prev) => [...prev, ...messages]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safeUpgrades.ownedPermanent,
    safeUpgrades.activeTemporary,
    safeUpgrades.extraHealth,
  ]);

  // Score lives here (per attempt, can only go up). Currency lives ONLY in
  // the App-level wallet; every scored word is forwarded to it once.
  const { currency, addCurrency } = wallet;
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

  // Always points at the latest levelMaker, so effects and callbacks can call
  // its methods without depending on the object's identity (which may change
  // every render).
  const levelMakerRef = useRef(levelMaker);
  levelMakerRef.current = levelMaker;

  // Runs on every submitted word (auto-submit or Plate button). Plain function
  // that always sees fresh props/state; it's reached through a ref below so
  // useWordInput never holds a stale copy.
  const onWordSubmit = (result) => {
    if (result.valid) {
      addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
      customerRef.current?.restorePatience(100);
      levelMakerRef.current.registerServedWord();
      achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD); // Achievement trigger

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
  };

  const onWordSubmitRef = useRef(onWordSubmit);
  onWordSubmitRef.current = onWordSubmit;
  const handleWordSubmit = useCallback((result) => {
    onWordSubmitRef.current(result);
  }, []);

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
    setLevelResult((prev) => prev ?? (won ? 'win' : 'lose')); // ignore if already ended
  }, []);

  // Win paths: clock ends with enough score (LevelTimer),
  // or all customers served (useLevelMaker).
  const isLevelComplete = levelMaker.isLevelComplete;
  useEffect(() => {
    if (isLevelComplete) handleLevelEnd(true);
  }, [isLevelComplete, handleLevelEnd]);

  useEffect(() => {
    if (levelResult) levelMakerRef.current.stop();
  }, [levelResult]);

  // Report a win once (ref guards against callback identity changes).
  const completionReportedRef = useRef(false);
  useEffect(() => {
    // Rush Hour never reports completion: it must not unlock normal levels.
    if (!isRushHour && levelResult === 'win' && !completionReportedRef.current) {
      completionReportedRef.current = true;
      onLevelComplete?.(levelConfig.id);
    }
  }, [levelResult, onLevelComplete, levelConfig.id, isRushHour]);

  useEffect(() => {
    if (isStoreOpen) levelMakerRef.current.dismissRattyEvent();
  }, [isStoreOpen]);

  // Extra Health absorbs a customer departure once; otherwise it's a loss.
  const handleCustomerLeft = useCallback(() => {
    if (extraHealth > 0) {
      consumeExtraHealth();
      setHealthRespawnKey((k) => k + 1);
      return;
    }
    handleLevelEnd(false); // patience hit 0 -> loss
  }, [extraHealth, consumeExtraHealth, handleLevelEnd]);

  const handleServePlate = () => {
    wordInput.submitWord(); // scoring/patience handled via onSubmit
  };

  const handleIntroComplete = useCallback(() => setPhase('playing'), []);

  // Track the store-open timeout so it can be cleared on unmount.
  const storeTimeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (storeTimeoutRef.current) clearTimeout(storeTimeoutRef.current);
    };
  }, []);

  const handleEndComplete = () => {
    if (isRushHour || levelResult === 'lose') {
      onRetry(); // remounts LevelSession, resetting all state (a Rush Hour run has no "next level")
    } else {
      levelMakerRef.current.dismissRattyEvent();
      storeTimeoutRef.current = setTimeout(() => {
        onOpenStore?.();
      }, 50);
    }
  };

  // Derived instead of set in an effect, so there's no extra gameplay frame
  // between the level ending and the end sequence showing.
  const activePhase = levelResult ? 'end' : phase;

  if (activePhase === 'intro') {
    return (
      <LevelIntroSequence
        levelConfig={levelConfig}
        onComplete={handleIntroComplete}
      />
    );
  }

  if (activePhase === 'end') {
    return (
      <LevelEndSequence
        levelConfig={levelConfig}
        won={levelResult === 'win'}
        finalScore={score}
        rushHourStage={isRushHour ? rushHourStage : null}
        onComplete={handleEndComplete}
      />
    );
  }

  const currentSprite = CUSTOMER_SPRITES[levelMaker.customerIndex % CUSTOMER_SPRITES.length];

  return (
    <View style={styles.screenWrapper}>
      <ImageBackground
        source={require('../assets/Final/GameplayUI/GameplayScreen.png')}
        style={[styles.container, { width: boxW, height: boxH }]}
        resizeMode="stretch"
      >
        {/* 1. HEADER BANNER: flex, same as every row below it, so it scales
            down proportionally on shorter screens. */}
        <View style={styles.headerBackground}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.quitWrapper}>
            <Image source={require('../assets/Final/GameplayUI/quit-sign.png')} style={styles.quitButton} />
          </TouchableOpacity>

          {/* Live wallet balance on the coin board. */}
          <ImageBackground
            source={require('../assets/Final/GameplayUI/CoinPatience.png')}
            style={styles.patienceCoinBoard}
            resizeMode="stretch"
          >
            <Text style={styles.coinText} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(currency)}
            </Text>
          </ImageBackground>
        </View>

        {/* Timer: paused during any popup, while the store is open, or after the
            level ends. Rush Hour: endless (time-out = run over), restored by
            correct words, capped. */}
        <LevelTimer
          targetScore={levelConfig.targetScore}
          currentScore={score}
          initialTimeInSeconds={levelConfig.timeLimitSeconds}
          isPaused={
            levelResult !== null ||
            levelMaker.showRattyEvent ||
            achievements.currentAchievement !== null ||
            isStoreOpen
          }
          onLevelEnd={handleLevelEnd}
          endless={isRushHour}
          timeBonus={isRushHour ? timeBonus : null}
          maxTimeInSeconds={isRushHour ? levelConfig.maxTimeSeconds : undefined}
        />

        {/* 2. Customer area. The sprite and the patience meter are separate
            now: the sprite sits in its own box, and the meter floats on top
            of the area with absolute positioning, so moving one never shifts
            the other. */}
        <View style={styles.customerArea}>
          <View style={styles.customerBox}>
            <Image
              source={currentSprite.source}
              style={[
                styles.characterDog,
                // Per-customer height tweak: a negative `bottom` in
                // CUSTOMER_SPRITES moves the sprite down.
                { top: SPRITE_TOP - currentSprite.bottom },
              ]}
            />
          </View>

          {/* Keyed on customerIndex (and the Extra Health respawn counter) so
              patience resets each time. */}
          <CustomerMood
            key={`customer-${levelMaker.customerIndex}-${healthRespawnKey}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            decayRateMs={levelConfig.patienceDecayMs}
            drainMultiplier={patienceDrainMultiplier}
            style={[styles.patienceMeter, { left: boxW / 2 + PATIENCE_OFFSET_X }]}
          />
        </View>

        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          slots={wordInput.slots}
          onSlotPress={wordInput.returnLetterFromSlot}
          lastResult={wordInput.lastResult}
          inputBoxCount={wordInput.inputBoxCount}
        />

        {/* 3. Table / plate: serves the current word */}
        <View style={styles.table}>
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image
              source={require('../assets/Final/GameplayUI/serve-button.png')}
              style={styles.plate}
            />
          </TouchableOpacity>
        </View>

        {/* 4. Chef */}
        <View style={styles.chefBar}>
          <Image
            source={require('../assets/Placeholder/WormProtagonist_1.png')}
            style={styles.characterChef}
          />
        </View>

        {/* 5. Conveyor belts: one image, three rows on top of it */}
        <ImageBackground
          source={require('../assets/Final/GameplayUI/conveyors.png')}
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
                  ...(levelConfig.letterPool ? { letterPool: levelConfig.letterPool } : {}),
                  ...getBeltConfig(levelConfig, row),
                }}
                onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
              />
            </View>
          ))}
        </ImageBackground>

        {/* Floating status: absolutely positioned, so it takes no layout space
            and can never push the rows (or the background art alignment). */}
        {(isRushHour || extraHealth > 0) && (
          <View style={styles.statusOverlay} pointerEvents="none">
            {isRushHour && <Text style={styles.stageText}>Stage {rushHourStage}</Text>}
            {extraHealth > 0 && (
              <Text style={styles.healthText}>♥ Extra Health: {extraHealth}</Text>
            )}
          </View>
        )}

        <StatusBar style="light" />
      </ImageBackground>

      {/* Upgrade overlays sit after the game board so they draw on top of it. */}
      <UpgradeToast
        messages={toastMessages}
        onDone={() => setToastMessages([])}
      />
      <UpgradeHUD activeList={safeUpgrades.activeList} />

      {/* Mr. Ratty popup (rolled by useLevelMaker) */}
      <MrRattyDiscount
        visible={levelMaker.showRattyEvent}
        onDismiss={() => {
          levelMaker.dismissRattyEvent();
          onOpenStore?.();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* 1 the screen thingy */
  screenWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },
  container: {
    alignItems: 'center',
  },
  headerBackground: {
    width: '100%',
    flex: 130, // scales with everything else
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // anchor children to the TOP, so the overflow hangs downward like the mockup
  },
  quitWrapper: { alignItems: 'center', justifyContent: 'center' },
  quitButton: { width: 130, height: 100, resizeMode: 'contain' },
  patienceCoinBoard: { width: 130, height: 200, alignItems: 'center', justifyContent: 'center' },
  coinText: {
    flexShrink: 1,
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
    marginTop: -125,
    marginLeft: 50,
  },

  // Floating Stage / Extra Health readout. Move it by changing top/left.
  statusOverlay: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  stageText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  healthText: { fontSize: 16, fontWeight: 'bold', color: '#FFD6E0', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 }, marginTop: 2 },

  /* 2 Customer Area*/
  // Wrapper that owns the row's flex space and is the positioning parent.
  customerArea: { flex: 150, width: '100%' },
  // Sprite box: just centers the sprite. Nothing else lives in here.
  customerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // `left` nudges the sprite to where it sat before the split.
  characterDog: { width: 160, height: 160, resizeMode: 'contain', left: -72 },
  // Floats over the area, anchored to its vertical center. `left` is set
  // inline from the screen width. (resizeMode removed: it only applies to
  // Image styles, not View styles.)
  patienceMeter: { position: 'absolute', top: '50%', marginTop: -150, width: 130, height: 150 },

  table: {
    width: '100%',
    flex: 150,
    marginTop: -60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plate: { width: 120, height: 60, marginTop: 60, resizeMode: 'stretch' },

  /* 4 Chef Bar*/
  chefBar: { flex: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 15 },
  characterChef: { width: 115, height: 115, resizeMode: 'contain', left: 125, bottom: 60 },

  /* 5 Conveyor area */
  // height: '150%' removed: it conflicted with flex: 240 (flex wins in a column).
  conveyorGroup: { width: '100%', flex: 240, flexDirection: 'column', bottom: 75 },
  conveyorRow: { justifyContent: 'center', alignItems: 'center', bottom: 10 },
  conveyorBelt: { marginTop: 20 },
});