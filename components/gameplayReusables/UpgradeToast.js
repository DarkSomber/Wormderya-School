import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Text from '../AppText';

// Self-dismissing toast, shows a short list of upgrade messages for a beat.
export default function UpgradeToast({ messages, durationMs = 2200, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!messages || messages.length === 0) return undefined;

    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    }, durationMs);

    return () => clearTimeout(timer);
  }, [messages, durationMs, opacity, onDone]);

  if (!messages || messages.length === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { opacity }]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>UPGRADES ACTIVE</Text>
        {messages.map((m, i) => (
          <Text key={i} style={styles.line}>• {m}</Text>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '18%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  card: {
    backgroundColor: 'rgba(255,248,231,0.96)',
    borderWidth: 3,
    borderColor: '#5A3A1A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    maxWidth: '85%',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7A2E2E',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 1,
  },
  line: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B1F0B',
    textAlign: 'center',
  },
});