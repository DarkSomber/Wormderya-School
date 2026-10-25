import React, { useState, useEffect, useRef } from 'react';
import { View } from 'react-native';
import Text from '../AppText';

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
  const [bonusFlash, setBonusFlash] = useState(null);

  const scoreRef = useRef(currentScore);
  useEffect(() => {
    scoreRef.current = currentScore;
  }, [currentScore]);

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

  const lastBonusIdRef = useRef(timeBonus ? timeBonus.id : 0);
  const flashTimeoutRef = useRef(null);
  useEffect(() => {
    if (!timeBonus || timeBonus.id === lastBonusIdRef.current) return;
    lastBonusIdRef.current = timeBonus.id;
    if (isGameOver) return;

    const cap = typeof maxTimeInSeconds === 'number' ? maxTimeInSeconds : Infinity;
    const seconds = timeBonus.seconds;
    setTimeLeft((prev) => {
      if (prev <= 0) return prev;
      return Math.max(prev, Math.min(cap, prev + seconds));
    });

    setBonusFlash(seconds);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = setTimeout(() => setBonusFlash(null), 900);
  }, [timeBonus, isGameOver, maxTimeInSeconds]);

  useEffect(() => () => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !isGameOver) {
      setIsGameOver(true);
      const finalScore = scoreRef.current;
      const won = endless ? false : finalScore >= targetScore;
      onLevelEnd?.(won, finalScore);
    }
  }, [timeLeft, isGameOver, targetScore, onLevelEnd, endless]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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