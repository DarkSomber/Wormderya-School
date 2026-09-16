import React, { useEffect, useRef } from 'react';
import { Animated, Text, View, Image, StyleSheet } from 'react-native';
import LetterTile, { TILE_SIZE, BLANK_RECTANGLE } from './LetterTile';
import { useResultFeedbackAnimation } from './LetterAnimations';
import { FONT_WARNING } from '../Font';
import { DEFAULT_MAX_LETTERS } from './UseWordInput';

const VALID_COLOR = '#2e7d32';
const INVALID_COLOR = '#c62828';

// How long the "WORD — not a word" / "WORD — +score" line stays fully
// visible before it fades out. Edit here for a global change, or pass a
// different value as the resultFadeDelayMs prop to override per screen.
export const DEFAULT_RESULT_FADE_DELAY_MS = 2000;
const RESULT_FADE_DURATION_MS = 300;

/**
 * Purely presentational — renders `maxLetters` fixed slots (Wordle-style):
 * filled ones show an animated LetterTile per letter in `currentWord`
 * (each pops in on mount, so a new tile appearing *is* the "box appears
 * when a letter is tapped/typed" behavior), the rest show an empty
 * BlankRectangle placeholder with no text. Reacts to `lastResult` with a
 * shake + red flash on an invalid word, or a ripple + green flash on a
 * valid one, across the whole row, and fades the result line out after
 * resultFadeDelayMs. useWordInput() doesn't know or care that this
 * exists; swap it for your own UI any time.
 */
export default function CurrentWordDisplay({
  currentWord,
  lastResult,
  maxLetters = DEFAULT_MAX_LETTERS,
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
  // for the rest of maxLetters. This is what lets a shorter word (e.g.
  // "AKO") still read clearly as submittable any time via the plate —
  // the remaining slots are visibly empty/open, not implying you must
  // fill all of them first.
  const slots = Array.from({ length: maxLetters }, (_, i) => currentWord[i] || null);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.row, { transform: [{ translateX: shakeX }] }]}>
        {slots.map((letter, i) =>
          letter ? (
            <LetterTile key={letter.id} character={letter.character} />
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
            the row's overflow:hidden so it reads as a contained ripple
            rather than an expanding blob. */}
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
          row's overflow:hidden) instead of sitting in normal flow below
          it. That's what stops the tiles from shifting up/down every
          time this text fades in or out. */}
      {lastResult ? (
        <Animated.Text
          pointerEvents="none"
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
  resultText: {
    position: 'absolute',
    top: 4, // matches wrapper's paddingVertical, so it lines up over the row
    left: 0,
    right: 0,
    height: ROW_MIN_HEIGHT,
    lineHeight: ROW_MIN_HEIGHT, // vertically centers the single line of text over the row
    textAlign: 'center',
    fontFamily: FONT_WARNING,
    fontSize: 12,
    zIndex: 4, // above the row's own flash/ripple overlays
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