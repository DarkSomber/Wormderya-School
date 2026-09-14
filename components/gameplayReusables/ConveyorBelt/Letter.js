import React from 'react';
import { Animated, Text, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { getLetterSprite } from './Spriteloader';
import { useSpawnAnimation } from './Animationsystem';

/**
 * Renders a single letter tile on the conveyor belt.
 *
 * A `letter` is a small, self-contained data object:
 *   { id, character, active, animState }
 *
 * The belt-wide horizontal scroll is handled entirely by ConveyorBelt's
 * Animated transform — a Letter only knows its fixed slot position
 * (`left`) inside that moving row, so it never needs to know how fast,
 * or whether, the belt is currently moving.
 */
export default function Letter({ letter, left, width, height, onPress }) {
  const scale = useSpawnAnimation(letter.animState);

  if (!letter.active) {
    // Reserve the slot (keeps spacing stable) without rendering a tile —
    // this is the "removed" state the future Word Input System will use,
    // e.g. [A] [B] [ ] [D] [E] after the player selects "C".
    return <View style={[styles.slot, { left, width, height }]} />;
  }

  const sprite = getLetterSprite(letter.character);

  return (
    <Animated.View style={[styles.slot, { left, width, height, transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress && onPress(letter)}
        style={styles.tileTouchable}
      >
        {sprite ? (
          <Image source={sprite} style={styles.tileImage} resizeMode="contain" />
        ) : (
          <View style={styles.tileFallback}>
            <Text style={styles.tileText}>{letter.character}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    top: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTouchable: {
    width: '86%',
    height: '86%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    backgroundColor: '#f4d9a0',
    borderWidth: 2,
    borderColor: '#8a5a2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a2e0f',
  },
});