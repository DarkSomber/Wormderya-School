import React, { useEffect, useRef } from 'react';
import { Animated, Text, ImageBackground, StyleSheet } from 'react-native';
import { useTileEntranceAnimation } from './LetterAnimations';

export const TILE_SIZE = 40;

// WordInput/ -> gameplayReusables/ -> components/ -> project root -> assets/...
export const BLANK_RECTANGLE = require('../../../assets/Placeholder/BlankRectangle.png');

/**
 * A single letter's box. CurrentWordDisplay renders one of these per
 * entry in `currentWord`, keyed by `letter.id` — React mounting a brand
 * new LetterTile *is* the "a box appears when you tap/type a letter"
 * behavior; this component just has to animate itself in on mount,
 * nothing external needs to trigger it. Uses the same BlankRectangle
 * placeholder art as the chef's side items, so it matches the rest of
 * the screen's placeholder visuals instead of a flat color box.
 */
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
        <Text style={styles.letter}>{character}</Text>
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
});