import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useTileEntranceAnimation() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const play = () => {
    scale.setValue(0);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, opacity, play };
}

export function useResultFeedbackAnimation() {
  const shakeX = useRef(new Animated.Value(0)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  const flashColor = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const popScale = useRef(new Animated.Value(1)).current;

  const playValid = () => {
    flashColor.setValue(1);
    flashOpacity.setValue(0.55);
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.5);
    popScale.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(popScale, { toValue: 1.08, duration: 80, useNativeDriver: true }),
        Animated.spring(popScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]),
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: false,
      }),
      Animated.timing(rippleScale, {
        toValue: 2.2,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const playInvalid = () => {
    flashColor.setValue(0);
    flashOpacity.setValue(0.55);
    shakeX.setValue(0);

    Animated.timing(flashOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  return {
    shakeX,
    flashOpacity,
    flashColor,
    rippleScale,
    rippleOpacity,
    popScale,
    playValid,
    playInvalid,
  };
}

export function useValuePop(value) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (value > prev.current) {
      scale.setValue(1);
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
      setBurst((b) => b + 1);
    }
    prev.current = value;
  }, [value, scale]);

  return { scale, burst };
}