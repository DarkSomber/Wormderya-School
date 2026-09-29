import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity } from 'react-native';
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

const BELT_ROWS = [0, 1, 2];
const CONVEYOR_ROW_GAP = 10;

// Safe fallback if useUpgrades wasn't passed down. No upgrade effects,
// but the screen still runs so the missing prop is easy to spot.
const NO_UPGRADES = {
  ownedPermanent: new Set(),
  activeTemporary: {},
  isActive: () => false,
  rewardMultiplier: 1,
  patienceDrainMultiplier: 1,
  extraHealth: 0,
  consumeExtraHealth: () => {},
  buyUpgrade: () => ({ success: false, reason: 'unavailable' }),
  startNewRound: () => {},
};

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

  const levelConfig = useMemo(
    () =>
      mode === 'rushHour'
        ? getRushHourLevelConfig(1)
        : levelConfigOverride ?? getLevelConfigById(levelId),
    [mode, levelConfigOverride, levelId]
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
        upgrades={upgrades}
        mode={mode}
      />
      <AchievementModal
        visible={achievements.currentAchievement !== null}
        achievement={achievements.currentAchievement}
        onDismiss={achievements.dismissAchievement}
      />
    </>
  );
}

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

  const [phase, setPhase] = useState('intro');

  const isRushHour = mode === 'rushHour';
  <UpgradeHUD activeList={safeUpgrades.activeList} />
  const [rushHourStage, setRushHourStage] = useState(1);
  const [timeBonus, setTimeBonus] = useState(null);
  const rushHourWordsRef = useRef(0);

  const levelConfig = useMemo(
    () => (isRushHour ? getRushHourLevelConfig(rushHourStage) : baseLevelConfig),
    [isRushHour, rushHourStage, baseLevelConfig]
  );

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
      setToastMessages(messages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    safeUpgrades.ownedPermanent,
    safeUpgrades.activeTemporary,
    safeUpgrades.extraHealth,
  ]);

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

  const handleWordSubmit = useCallback(
    (result) => {
      if (result.valid) {
        addScoreFromWord(result.word, 1, levelConfig.scoreMultiplier);
        customerRef.current?.restorePatience(100);
        levelMaker.registerServedWord();
        achievements.unlockAchievement(ACHIEVEMENTS.FIRST_WORD);

        if (isRushHour) {
          setTimeBonus((prev) => ({
            id: (prev ? prev.id : 0) + 1,
            seconds: levelConfig.timeBonusSeconds,
          }));
          rushHourWordsRef.current += 1;
          setRushHourStage(getRushHourStageForWords(rushHourWordsRef.current));
        }
      } else if (result.word.length > 0) {
        customerRef.current?.applyWrongWordPenalty();
      }
    },
    [
      addScoreFromWord,
      levelConfig.scoreMultiplier,
      levelConfig.timeBonusSeconds,
      levelMaker,
      achievements,
      isRushHour,
    ]
  );

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
    handleWordSubmit
  );

  const [levelResult, setLevelResult] = useState(null);

  const handleLevelEnd = useCallback((won) => {
    setLevelResult((prev) => prev ?? (won ? 'win' : 'lose'));
  }, []);

  useEffect(() => {
    if (levelMaker.isLevelComplete) handleLevelEnd(true);
  }, [levelMaker.isLevelComplete, handleLevelEnd]);

  useEffect(() => {
    if (levelResult) levelMaker.stop();
  }, [levelResult, levelMaker]);

  const completionReportedRef = useRef(false);
  useEffect(() => {
    if (!isRushHour && levelResult === 'win' && !completionReportedRef.current) {
      completionReportedRef.current = true;
      onLevelComplete?.(levelConfig.id);
    }
  }, [levelResult, onLevelComplete, levelConfig.id, isRushHour]);

  useEffect(() => {
    if (isStoreOpen) levelMaker.dismissRattyEvent();
  }, [isStoreOpen, levelMaker]);

  // Extra Health absorbs a customer departure once.
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

  const handleIntroComplete = () => setPhase('playing');

  const handleEndComplete = () => {
    if (isRushHour || levelResult === 'lose') {
      onRetry();
    } else {
      levelMaker.dismissRattyEvent();
      setTimeout(() => {
        onOpenStore?.();
      }, 50);
    }
  };

  useEffect(() => {
    if (levelResult) setPhase('end');
  }, [levelResult]);

  if (phase === 'intro') {
    return (
      <LevelIntroSequence
        levelConfig={levelConfig}
        onComplete={handleIntroComplete}
      />
    );
  }

  if (phase === 'end') {
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

  return (
    <View style={styles.screenWrapper}>
      <UpgradeToast
        messages={toastMessages}
        onDone={() => setToastMessages([])}
      />

      <View style={styles.container}>
        <ImageBackground
          source={require('../assets/Placeholder/TopBoard.png')}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.quitWrapper}>
            <Image
              source={require('../assets/Placeholder/QuitButton.png')}
              style={styles.quitButton}
            />
            <Text style={styles.quitText} numberOfLines={1}>
              Return
            </Text>
          </TouchableOpacity>

          <View style={styles.coinDisplay}>
            <Text style={styles.coinText} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(currency)}
            </Text>
            <Image
              source={require('../assets/Placeholder/pixel_coins.png')}
              style={styles.moneyIcon}
            />
          </View>
        </ImageBackground>

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
        {isRushHour && <Text style={styles.stageText}>Stage {rushHourStage}</Text>}

        {extraHealth > 0 && (
          <Text style={styles.healthText}>♥ Extra Health: {extraHealth}</Text>
        )}

        <View style={styles.customerBox}>
          <Image
            source={require('../assets/Placeholder/SampleCustomer_1.png')}
            style={styles.characterDog}
          />
          <CustomerMood
            key={`customer-${levelMaker.customerIndex}-${healthRespawnKey}`}
            ref={customerRef}
            onCustomerLeft={handleCustomerLeft}
            decayRateMs={levelConfig.patienceDecayMs}
            drainMultiplier={patienceDrainMultiplier}
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

        <ImageBackground
          source={require('../assets/Placeholder/Table.png')}
          style={styles.table}
          resizeMode="stretch"
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image
              source={require('../assets/Placeholder/Plate.png')}
              style={styles.plate}
            />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.chefBar}>
          <Image
            source={require('../assets/Placeholder/WormProtagonist_1.png')}
            style={styles.characterChef}
          />
        </View>

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
                  slotDurationMs: levelConfig.conveyorSpeed,
                  slotWidth: 70,
                  slotHeight: 60,
                  ...(levelConfig.letterPool
                    ? { letterPool: levelConfig.letterPool }
                    : {}),
                  ...getBeltConfig(levelConfig, row),
                }}
                onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
              />
            </ImageBackground>
          ))}
        </View>

        <StatusBar style="light" />
      </View>

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
  screenWrapper: { flex: 1, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#b87b4e',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  headerBackground: {
    width: '105%',
    flex: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  quitWrapper: { width: 90, height: 55, left: 20, alignItems: 'center' },
  quitButton: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'contain' },
  quitText: { color: 'red', fontSize: 20, textAlign: 'center', bottom: 40 },
  coinDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 1, maxWidth: 170, gap: 10 },
  coinText: { flexShrink: 1, fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  moneyIcon: { width: 40, height: 40, resizeMode: 'contain' },
  stageText: { fontSize: 18, fontWeight: 'bold', color: '#fff', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 } },
  healthText: { fontSize: 16, fontWeight: 'bold', color: '#FFD6E0', textShadowColor: '#000', textShadowRadius: 2, textShadowOffset: { width: 1, height: 1 }, marginTop: 2 },
  customerBox: { flex: 150, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, paddingHorizontal: 15 },
  characterDog: { width: 160, height: 160, resizeMode: 'contain' },
  patienceMeter: { width: 94, height: 130, marginTop: -80, resizeMode: 'contain' },
  table: { width: '100%', flex: 150, marginTop: -60, zIndex: 2, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  plate: { width: 60, height: 60 },
  chefBar: { flex: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingHorizontal: 15 },
  characterChef: { width: 115, height: 115, resizeMode: 'contain', left: 125, bottom: 30 },
  conveyorGroup: { width: '100%', flex: 240, flexDirection: 'column', gap: CONVEYOR_ROW_GAP, bottom: 50 },
  conveyor: { width: '100%', flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});