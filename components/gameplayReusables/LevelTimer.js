import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import Text from '../AppText';

/**
 * LevelTimer
 *
 * @param {number} targetScore - score/serve quota needed to win the level
 * @param {number} currentScore - live score from useScoreSystem
 * @param {number} initialTimeInSeconds - countdown length
 * @param {boolean} isPaused - freezes the countdown (e.g. while Mr. Ratty's
 *   shop popup is open), defaults to false so existing behavior is unchanged
 * @param {(won: boolean, finalScore: number) => void} onLevelEnd - called
 *   exactly once when time runs out, so the parent screen can show the
 *   Win Screen or Lose Screen from the storyboard.
 *
 * Rush Hour options (all optional; leaving them out keeps normal-level behavior):
 * @param {boolean} endless - running out of time is always a loss (there is no
 *   score target to reach), reported as onLevelEnd(false, score)
 * @param {{ id: number, seconds: number } | null} timeBonus - restore signal.
 *   Each NEW `id` adds `seconds` to the clock once (the id is what makes it
 *   fire once, so re-renders with the same object do nothing). The clock keeps
 *   draining; this only adds to whatever is left.
 * @param {number} maxTimeInSeconds - a bonus can never lift the clock above
 *   this. A bonus never lowers the clock either.
 */
const LevelTimer = ({
  targetScore,
  currentScore,
  initialTimeInSeconds = 60,
  isPaused = false,
  onLevelEnd,
  endless = false,
  timeBonus = null,
  maxTimeInSeconds,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isGameOver, setIsGameOver] = useState(false);
  const [bonusFlash, setBonusFlash] = useState(null); // bonus seconds just awarded (display only; the cap may trim what is applied)

  // Keep the latest score in a ref instead of a dependency, so the
  // countdown interval doesn't get torn down and recreated every time
  // the player earns points (that was the bug: [currentScore] as a
  // dependency reset the interval on every score change, causing the
  // countdown to drift/stutter instead of ticking evenly every second).
  const scoreRef = useRef(currentScore);
  useEffect(() => {
    scoreRef.current = currentScore;
  }, [currentScore]);

  // Countdown interval — only restarts if paused state or game-over state changes.
  // Time restoration below uses the same functional state update, so it never
  // touches this interval: the clock keeps draining while bonuses land.
  useEffect(() => {
    if (isPaused || isGameOver) return undefined;

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerId);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [isPaused, isGameOver]);

  // Rush Hour time restoration: applied once per new bonus id.
  const lastBonusIdRef = useRef(timeBonus ? timeBonus.id : 0);
  const flashTimeoutRef = useRef(null);
  useEffect(() => {
    if (!timeBonus || timeBonus.id === lastBonusIdRef.current) return;
    lastBonusIdRef.current = timeBonus.id;
    if (isGameOver) return;

    const cap = typeof maxTimeInSeconds === 'number' ? maxTimeInSeconds : Infinity;
    const seconds = timeBonus.seconds;
    setTimeLeft((prev) => {
      if (prev <= 0) return prev; // already out of time: no revival
      // Never above the cap, and never lower than what the player already has.
      return Math.max(prev, Math.min(cap, prev + seconds));
    });

    setBonusFlash(seconds);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setBonusFlash(null), 900);
  }, [timeBonus, isGameOver, maxTimeInSeconds]);

  useEffect(() => () => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
  }, []);

  // Determine win/loss exactly once, the moment the clock actually hits 0.
  useEffect(() => {
    if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      const finalScore = scoreRef.current;
      const won = endless ? false : finalScore >= targetScore;
      onLevelEnd?.(won, finalScore);
    }
  }, [timeLeft, isGameOver, targetScore, onLevelEnd, endless]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60; //Timer
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Time: {formatTime(timeLeft)}
      </Text>
      {bonusFlash !== null && (
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#2e9e3f', marginLeft: 8 }}>
          +{bonusFlash}s
        </Text>
      )}
    </View>
  );
};

export default LevelTimer;