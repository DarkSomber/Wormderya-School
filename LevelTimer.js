import React, { useState, useEffect, useRef } from 'react';
import { View, Text } from 'react-native';

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
 */
const LevelTimer = ({
  targetScore,
  currentScore,
  initialTimeInSeconds = 60,
  isPaused = false,
  onLevelEnd,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeInSeconds);
  const [isGameOver, setIsGameOver] = useState(false);

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

  // Determine win/loss exactly once, the moment the clock actually hits 0.
  useEffect(() => {
    if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      const finalScore = scoreRef.current;
      const won = finalScore >= targetScore;
      onLevelEnd?.(won, finalScore);
    }
  }, [timeLeft, isGameOver, targetScore, onLevelEnd]);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Time: {formatTime(timeLeft)}
      </Text>
    </View>
  );
};

export default LevelTimer;