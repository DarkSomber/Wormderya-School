import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Twinkle from '../components/Twinkle';

const PLATE_IMAGE = require('../assets/Final/GameplayUI/serve-button.png');

const PLATE_SPOTS = [
  { x: 0.1, y: 0.25, size: 9, delay: 0 },
  { x: 0.9, y: 0.35, size: 7, delay: 700 },
  { x: 0.55, y: 0.05, size: 6, delay: 1400 },
];

/*
 * Bounces and stuff
 */
// After a press the button locks for this long, so it can't be spammed.
const SERVE_COOLDOWN_MS = 800;

export default function PlateButton({ onPress, style, disabled = false, cooldownMs = SERVE_COOLDOWN_MS }) {
  // The lock lives in a ref so two taps in the same frame can't both get through;
  // `cooling` is only there to dim the button while it is locked.
  const lockedRef = useRef(false);
  const timerRef = useRef(null);
  const [cooling, setCooling] = useState(false);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const lift = useRef(new Animated.Value(0)).current;
  const squash = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lift, { toValue: -4, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.delay(900),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lift]);

  // Fires on touch DOWN (onPressIn), not on release, so a light tap always counts.
  const handlePress = (e) => {
    if (disabled || lockedRef.current) return;
    lockedRef.current = true;
    setCooling(true);
    timerRef.current = setTimeout(() => {
      lockedRef.current = false;
      setCooling(false);
    }, cooldownMs);
    squash.setValue(0.92);
    Animated.spring(squash, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start();
    onPress?.(e);
  };

  return (
    <TouchableOpacity
      style={[style, (disabled || cooling) && { opacity: 0.55 }]}
      activeOpacity={0.7}
      disabled={disabled}
      onPressIn={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 2 }} // right stays small: the chef's tap box is just beside it
    >
      <Animated.View style={[styles.fill, { transform: [{ translateY: lift }, { scale: squash }] }]}>
        <Image source={PLATE_IMAGE} style={styles.fill} resizeMode="stretch" />
        <Twinkle spots={PLATE_SPOTS} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%' },
});