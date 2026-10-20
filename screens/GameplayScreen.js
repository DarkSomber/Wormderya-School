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
import { useStage, Stage, Slot } from '../components/gameplayReusables/Stage';

import { getLevelConfigById } from '../levels/levelPresets';
import { getBeltConfig } from '../levels/LevelConfig';
import { useLevelMaker } from '../levels/useLevelMaker';
import { LevelIntroSequence, LevelEndSequence } from '../levels/IntroEndSequence';
import { getRushHourLevelConfig, getRushHourStageForWords } from '../levels/RushHourConfig';
/* global __DEV__ */

import audio from '../audio/AudioManager';
import { customerVoice } from '../audio/customerVoice';

const RECTS = {
  quit:      { x: 3,   y: 0,   w: 171, h: 147 },
  coin:      { x: 326, y: 0,   w: 186, h: 300 }, // board + patience meter (one PNG)
  customer:  { x: 0,  y: 125, w: 230, h: 250 },
  word:      { x: 30,  y: 380, w: 452, h: 100 },
  serve:     { x: 175, y: 460, w: 161, h: 84  },
  chef:      { x: 330, y: 480, w: 200, h: 200 },
  conveyors: { x: 0,   y: 665, w: 512, h: 328 }, // the brown belt bars image
  belt0:     { x: 0,   y: 663, w: 512, h: 94  },
  belt1:     { x: 0,   y: 777, w: 512, h: 94  },
  belt2:     { x: 0,   y: 885, w: 512, h: 94  },
};
const BELT_ROWS = [0, 1, 2]; // belt rows

// Customer area tuning. These are the only numbers you need to touch to move
// the sprite or the patience meter.
const SPRITE_TOP = -26;         // sprite vertical offset (negative = up)
const PATIENCE_OFFSET_X = 72;   // meter's left edge, in px right of screen center

// Customer swapper sprites (HARDCODED FOR SECOND CUSTOMER)
// `voice` picks the VA files (greetings_<voice>, goodbye_<voice>, ...), 1-3.
// When the third customer sprite is added, give it `voice: 3`.
const CUSTOMER_SPRITES = [
  { source: require('../assets/Final/Customers/Customer1.png'), voice: 1 },
  { source: require('../assets/Final/Customers/CustomerPicky.png'), bottom: -10, voice: 2 },
];

// Patience meter bands (same thresholds CustomerMood uses for its face).
const PATIENCE_RANK = { happy: 0, impatient: 1, angry: 2 };
const patienceBand = (p) => (p > 70 ? 'happy' : p > 30 ? 'impatient' : 'angry');

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
 *   getBestScore     () => number; the best score before this run (for the "new record" jingle)
 *   onReportScore    (score) => void; called once when a run counts (a win, or any Rush Hour run)
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
  getBestScore,
  onReportScore,
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
        getBestScore={getBestScore}
        onReportScore={onReportScore}
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
  getBestScore,
  onReportScore,
}) {
  // Fallback so a missing prop never crashes the screen.
  const safeUpgrades = upgrades ?? NO_UPGRADES;

  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'end'
  const { scale, scaleX, scaleY, w, h } = useStage();

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

  // Which customer is up decides whose voice lines play.
  const customerVoiceId = CUSTOMER_SPRITES[levelMaker.customerIndex % CUSTOMER_SPRITES.length].voice;

  // Runs on every submitted word (auto-submit or Plate button). Plain function
  // that always sees fresh props/state; it's reached through a ref below so
  // useWordInput never holds a stale copy.
  const onWordSubmit = (result) => {
    if (result.word.length > 0) audio.playSfx('serve_word');

    if (result.valid) {
      audio.playSfx('correct');
      customerVoice.served(customerVoiceId, {
        lastForCustomer: levelMaker.wordsServedForCustomer + 1 >= levelConfig.wordsPerCustomer,
      });
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
      audio.playSfx('wrong');
      customerVoice.wrong(customerVoiceId);
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
    levelConfig.inputBoxCount, // max player input boxes (they appear as tiles are picked): independent of any belt's letter count
    handleWordSubmit,
    { slotHoldMs: levelConfig.slotHoldMs },
  );

  // null | 'win' | 'lose'
  const [levelResult, setLevelResult] = useState(null);

  // CustomerMood reports every patience change. Only a drop into a worse band
  // speaks ("ehem" at impatient, a sigh at angry); a fresh customer starts happy.
  const patienceBandRef = useRef('happy');
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

  // ---- Audio ----
  // Level music only while actually playing. The intro countdown and the end
  // screen fade it out (which also fades out the menu music on entry). Ratty's
  // shop after a level is won gets the menu track, so the shop isn't silent and
  // Level Select (also the menu track) carries on without a restart.
  const isPlaying = activePhase === 'playing';
  const musicTrack = isPlaying ? 'level' : isStoreOpen ? 'menu' : null;
  useEffect(() => {
    audio.setMusic(musicTrack);
  }, [musicTrack]);

  // Shop opened mid-level (Mr. Ratty's visit): keep the level music quiet under it.
  const duckMusic = isPlaying && !!isStoreOpen;
  useEffect(() => {
    audio.setDuck(duckMusic);
    return () => audio.setDuck(false);
  }, [duckMusic]);

  // Each customer greets when they step up (first one when the clock starts).
  useEffect(() => {
    if (!isPlaying || levelMaker.isLevelComplete) return;
    customerVoice.greet(customerVoiceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, levelMaker.customerIndex]);

  // Nobody keeps talking after the player leaves.
  useEffect(() => () => audio.stopVoice(), []);

  // Record check: only wins count in normal mode; every Rush Hour run counts.
  // The best score is read once at mount, so retries compare against the live best.
  const [bestBefore] = useState(() => getBestScore?.() ?? 0);
  const runCounts = levelResult !== null && (isRushHour || levelResult === 'win');
  const isNewRecord = runCounts && bestBefore > 0 && score > bestBefore;

  const endHandledRef = useRef(false);
  useEffect(() => {
    if (!levelResult || endHandledRef.current) return;
    endHandledRef.current = true;
    if (isNewRecord) audio.playSfx('new_record');
    else audio.playSfx(levelResult === 'win' ? 'win' : 'lose');
    if (levelResult === 'lose') audio.stopVoice(); // a customer who walked out stops talking
    if (runCounts) onReportScore?.(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelResult]);

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
        newRecord={isNewRecord}
        onComplete={handleEndComplete}
      />
    );
  }

  const currentSprite = CUSTOMER_SPRITES[levelMaker.customerIndex % CUSTOMER_SPRITES.length];

  return (
  <View style={styles.screenWrapper}>
    <Stage source={require('../assets/Final/GameplayUI/GameplayScreen.png')} w={w} h={h} scale={scale}>

      <Slot rect={RECTS.quit} scale={scale} scaleX={scaleX} scaleY={scaleY}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => { audio.playSfx('click'); onBack?.(); }}>
          <Image source={require('../assets/Final/GameplayUI/quit-sign.png')}
                 style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
        </TouchableOpacity>
      </Slot>

      <Slot rect={RECTS.coin} scale={scale}>
  <ImageBackground
    source={require('../assets/Final/GameplayUI/CoinPatience.png')}
    style={{ width: '100%', height: '100%' }}
    resizeMode="stretch"
  >
    {/* TOP PART: the number */}
    <View style={{ 
      position: 'absolute', left: '50%', top: '10%', height: '15%', justifyContent: 'center',
     }}>
      <Text
        style={{
          fontSize: 50 * scale,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: '#000',
          textShadowRadius: 2,
          textShadowOffset: { width: 1, height: 1 },
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(currency)}
      </Text>
    </View>

    {/* BOTTOM PART: the patience meter */}
    <View style={{
        position: 'absolute', left: '8%', top: '25%', width: '84%', height: '55%',
        transform: [{ translateX: 5 }, { translateY: 111 }],
      }}>
      <CustomerMood
        key={`customer-${levelMaker.customerIndex}-${healthRespawnKey}`}
        ref={customerRef}
        onCustomerLeft={handleCustomerLeft}
        onPatienceChange={handlePatienceChange}
        decayRateMs={levelConfig.patienceDecayMs}
        drainMultiplier={patienceDrainMultiplier}
        style={{ width: '100%', height: '100%' }}
        />
        </View>
      </ImageBackground>
    </Slot>

    <Slot rect={{ x: 175, y: 120, w: 512, h: 1088 }} scale={scale} style={{ backgroundColor: 'transparent' }}>
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
  </Slot>

      <Slot rect={RECTS.customer} scale={scale} style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
        <Image source={currentSprite.source}
               style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
      </Slot>

      <Slot rect={RECTS.word} scale={scale}>
        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          slots={wordInput.slots}
          onSlotPress={wordInput.returnLetterFromSlot}
          onHolePress={wordInput.selectHoleSlot}
          targetHoleId={wordInput.targetHoleId}
          lastResult={wordInput.lastResult}
          inputBoxCount={wordInput.inputBoxCount}
        />
      </Slot>

      <Slot rect={RECTS.serve} scale={scale}>
        <TouchableOpacity style={{ flex: 1 }} onPress={handleServePlate}>
          <Image source={require('../assets/Final/GameplayUI/serve-button.png')}
                 style={{ width: '100%', height: '100%', resizeMode: 'stretch' }} />
        </TouchableOpacity>
      </Slot>

      <Slot rect={RECTS.chef} scale={scale}>
        <Image source={require('../assets/Final/MainCharacter.png')}
               style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
      </Slot>

      <Slot rect={RECTS.conveyors} scale={scale}>
        <Image
          source={require('../assets/Final/GameplayUI/conveyors.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
      </Slot>

      {BELT_ROWS.map((row) => (
        <Slot key={row} rect={RECTS[`belt${row}`]} scale={scale}>
          <ConveyorBelt
            ref={conveyorRefs[row]}
            style={{ width: '100%', height: '100%' }}
            config={{
              slotDurationMs: levelConfig.conveyorSpeed,
              slotWidth: 100 * scale,  // see note below
              slotHeight: 94 * scale,
              ...getBeltConfig(levelConfig, row),
            }}
            onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
          />
        </Slot>
      ))}

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
        </Stage>
        <StatusBar style="light" />

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
  screenWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' },

  // Floating Stage / Extra Health readout. Move it by changing top/left.
  statusOverlay: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  stageText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  healthText: { fontSize: 16, fontWeight: 'bold', color: '#FFD6E0', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 }, marginTop: 2 },
});