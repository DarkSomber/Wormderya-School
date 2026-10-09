import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import LetterTile, { TILE_SIZE, BLANK_RECTANGLE } from './LetterTile';
import { useResultFeedbackAnimation } from './LetterAnimations';
import { FONT_WARNING } from '../Font';
import { DEFAULT_INPUT_BOX_COUNT } from './UseWordInput';

const VALID_COLOR = '#2e7d32';
const INVALID_COLOR = '#c62828';

// "WORD — +score" line stays fully
// visible before it fades out. Edit here for a global change, or pass a
// different value as the resultFadeDelayMs prop to override per screen.
export const DEFAULT_RESULT_FADE_DELAY_MS = 2000;
const RESULT_FADE_DURATION_MS = 300;

/**
 * Purely presentational — renders one box per entry in `slots`. Boxes are
 * dynamic: there are no empty placeholders, a box appears only when the player
 * picks a character, plus "open" boxes (dashed outline) that the player just
 * emptied and can still refill. Reacts to `lastResult` through colors and shakes after resultFadeDelayMs. 
 * useWordInput() doesn't know or care that this exists; 
 * swap it for your own UI any time.
 */
export default function CurrentWordDisplay({
  currentWord,
  slots: slotsProp, // fixed-length box list from useWordInput (preferred; keeps gaps)
  onSlotPress, // (boxIndex) => void — tapping an OCCUPIED box; empty boxes ignore taps
  onHolePress, // (boxIndex) => void — tapping an OPEN (just-emptied) box picks it as the next tile's spot
  targetHoleId, // id of the open box currently picked, for the highlight
  lastResult,
  inputBoxCount = DEFAULT_INPUT_BOX_COUNT,
  resultFadeDelayMs = DEFAULT_RESULT_FADE_DELAY_MS,
}) {
  const {
    shakeX,
    flashOpacity,
    flashColor,
    rippleScale,
    rippleOpacity,
    playValid,
    playInvalid,
  } = useResultFeedbackAnimation();

  const resultOpacity = useRef(new Animated.Value(0)).current;
  const fadeTimeoutRef = useRef(null);

  // Track the specific result object we've already animated for, so we
  // only fire once per submit rather than on every re-render.
  const animatedResultRef = useRef(null);

  useEffect(() => {
    if (!lastResult || lastResult === animatedResultRef.current) return;
    animatedResultRef.current = lastResult;
    if (lastResult.valid) {
      playValid();
    } else {
      playInvalid();
    }

    // Show the result line fully, then fade it out after the configured
    // delay so it doesn't just sit there forever.
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    resultOpacity.setValue(1);
    fadeTimeoutRef.current = setTimeout(() => {
      Animated.timing(resultOpacity, {
        toValue: 0,
        duration: RESULT_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }, resultFadeDelayMs);
  }, [lastResult, playValid, playInvalid, resultOpacity, resultFadeDelayMs]);

  // Clear any pending fade if the component unmounts mid-timeout.
  useEffect(() => () => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
  }, []);

  const flashBackgroundColor = flashColor.interpolate({
    inputRange: [0, 1],
    outputRange: [INVALID_COLOR, VALID_COLOR],
  });
  const rippleBackgroundColor = lastResult && lastResult.valid ? VALID_COLOR : INVALID_COLOR;

  // Fixed-length slot list: real letters first, then empty placeholders
  // Doesn't require all slot filled to pass the word
  const slots = slotsProp ?? (currentWord || []);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.row, { transform: [{ translateX: shakeX }] }]}>
        {slots.map((letter, i) =>
          letter && letter.held ? (
            // Open box: its tile was just sent back. Stays here for a few
            // seconds so the player can drop a different tile into this spot.
            <TouchableOpacity
              key={letter.id}
              activeOpacity={0.7}
              onPress={() => onHolePress?.(i)}
            >
              <View style={[styles.holeSlot, letter.id === targetHoleId && styles.holeSlotTarget]}>
                <Image source={BLANK_RECTANGLE} style={styles.holeImage} resizeMode="stretch" />
              </View>
            </TouchableOpacity>
          ) : letter ? (
            // Whole box is the touch target, not just the glyph.
            <TouchableOpacity
              key={letter.id}
              activeOpacity={0.7}
              onPress={() => onSlotPress?.(i)}
            >
              <LetterTile character={letter.character} />
            </TouchableOpacity>
          ) : (
            <Image
              key={`empty-${i}`}
              source={BLANK_RECTANGLE}
              style={styles.emptySlot}
              resizeMode="stretch"
            />
          )
        )}

        {/* Flash — a color wash over the whole row, red or green. */}
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { backgroundColor: flashBackgroundColor, opacity: flashOpacity }]}
        />

        {/* Ripple — only relevant/visible on a valid word; clipped by
            the row's overflow:hidden*/}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              backgroundColor: rippleBackgroundColor,
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            },
          ]}
        />
      </Animated.View>

      {/* Result line — absolutely positioned directly on top of the tile
          row (a sibling of `row`, not a child, so it isn't clipped by
          row's overflow:hidden) stops the tiles from shifting up/down every
          time this text fades in or out. */}
      {lastResult ? (
        <View pointerEvents="none" style={styles.resultWrap}>
          <Animated.Text
            style={[
              styles.resultText,
              lastResult.valid ? styles.validText : styles.invalidText,
              { opacity: resultOpacity },
            ]}
          >
            {lastResult.valid
              ? `${lastResult.word} — +${lastResult.score}`
              : `${lastResult.word || '(empty)'} — Not a word/No Letters`}
          </Animated.Text>
        </View>
      ) : null}
    </View>
  );
}

const ROW_MIN_HEIGHT = 46;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
    zIndex: 3, // table (GameplayScreen) sits at zIndex: 2 and overlaps this via negative marginTop
    elevation: 3, // Android needs elevation in addition to zIndex for stacking order
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ROW_MIN_HEIGHT,
    minWidth: ROW_MIN_HEIGHT, // guarantees a visible frame even before any tiles mount
    maxWidth: '90%',
    borderRadius: 12,
    paddingHorizontal: 6,
    alignSelf: 'center',
    overflow: 'hidden', // keeps tiles, the flash, and the ripple all clipped to the row
    position: 'relative',
  },
  emptySlot: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginHorizontal: 3,
    opacity: 0.5,
  },
  holeSlot: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginHorizontal: 3,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#f9a825',
    borderRadius: 6,
    overflow: 'hidden',
  },
  holeSlotTarget: {
    borderStyle: 'solid',
    borderColor: '#e65100',
  },
  holeImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ripple: {
    position: 'absolute',
    width: ROW_MIN_HEIGHT,
    height: ROW_MIN_HEIGHT,
    borderRadius: ROW_MIN_HEIGHT / 2,
    top: 0,
    left: 0,
  },
  resultWrap: {
    position: 'absolute',
    top: 4, // matches wrapper's paddingVertical, so it lines up over the row
    left: 0,
    right: 0,
    height: ROW_MIN_HEIGHT,
    zIndex: 4, // above the row's own flash/ripple overlays
  },
  resultText: {
    height: ROW_MIN_HEIGHT,
    lineHeight: ROW_MIN_HEIGHT, // vertically centers the single line of text over the row
    textAlign: 'center',
    fontFamily: FONT_WARNING,
    fontSize: 12,
    // Faint backdrop so the text stays legible over whatever tiles/blanks
    // it's overlapping, without fully hiding them.
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  validText: {
    color: VALID_COLOR,
  },
  invalidText: {
    color: INVALID_COLOR,
  },
});