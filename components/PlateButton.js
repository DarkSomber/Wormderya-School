import React, { useEffect, useRef } from 'react';
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
export default function PlateButton({ onPress, style }) {
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

  const handlePress = (e) => {
    squash.setValue(0.92);
    Animated.spring(squash, { toValue: 1, friction: 3, tension: 200, useNativeDriver: true }).start();
    onPress?.(e);
  };

  return (
    <TouchableOpacity style={style} activeOpacity={0.7} onPress={handlePress}>
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