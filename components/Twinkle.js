import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

// Spots are fractions (0-1) of the parent box; `size` is in px.
const DEFAULT_SPOTS = [
  { x: 0.12, y: 0.2, size: 8, delay: 0 },
  { x: 0.86, y: 0.3, size: 6, delay: 500 },
  { x: 0.5, y: 0.05, size: 7, delay: 1000 },
];

function Spark({ spot, color, loop }) {
  const t = useRef(new Animated.Value(0)).current;
  const { x, y, size, delay = 0 } = spot;

  useEffect(() => {
    const steps = [
      Animated.delay(delay),
      Animated.timing(t, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(t, { toValue: 0, duration: 320, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ];
    if (loop) steps.push(Animated.delay(900));
    const seq = Animated.sequence(steps);
    const anim = loop ? Animated.loop(seq) : seq;
    anim.start();
    return () => anim.stop();
  }, [t, delay, loop]);

  const bar = Math.max(2, Math.round(size / 3));
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        opacity: t,
        transform: [
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) },
        ],
      }}
    >
      {/* Plus-shaped sparkle built from two bars. */}
      <View style={{ position: 'absolute', left: 0, top: (size - bar) / 2, width: size, height: bar, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: 0, left: (size - bar) / 2, width: bar, height: size, backgroundColor: color }} />
    </Animated.View>
  );
}

/**
 * Small sparkles over its parent (the parent must be a sized View).
 * loop (default) keeps twinkling; loop={false} plays one pass on mount,
 * so remount it with a new `key` to replay.
 */
export default function Twinkle({ spots = DEFAULT_SPOTS, color = '#F9A825', loop = true, style }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {spots.map((spot, i) => (
        <Spark key={i} spot={spot} color={color} loop={loop} />
      ))}
    </View>
  );
}