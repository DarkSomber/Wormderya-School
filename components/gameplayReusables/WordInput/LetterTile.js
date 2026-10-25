import React, { useEffect, useRef } from 'react';
import { Animated, ImageBackground, StyleSheet } from 'react-native';
import Text from '../../AppText';
import { useTileEntranceAnimation } from './LetterAnimations';

export const TILE_SIZE = 40;

export const BLANK_RECTANGLE = require('../../../assets/Placeholder/BlankRectangle.png');

export default function LetterTile({ character }) {
  const { scale, opacity, play } = useTileEntranceAnimation();
  const hasPlayed = useRef(false);

  useEffect(() => {
    if (hasPlayed.current) return;
    hasPlayed.current = true;
    play();
  }, [play]);

  return (
    <Animated.View style={[styles.tileWrapper, { opacity, transform: [{ scale }] }]}>
      <ImageBackground source={BLANK_RECTANGLE} style={styles.tile} resizeMode="stretch">
        <Text style={[styles.letter, character.length > 1 && styles.syllable]} numberOfLines={1}>{character}</Text>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tileWrapper: {
    marginHorizontal: 3,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4a2e0f',
  },
  syllable: {
    fontSize: 16,
  },
});
