import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import LetterTile, { TILE_SIZE, BLANK_RECTANGLE } from './LetterTile';
import { useResultFeedbackAnimation } from './LetterAnimations';
import SpeechBubble from '../../SpeechBubble';
import Twinkle from '../../Twinkle';
import { DEFAULT_INPUT_BOX_COUNT } from './UseWordInput';

const VALID_COLOR = '#2e7d32';
const INVALID_COLOR = '#c62828';
const VALID_BG = '#E8F5E9';
const INVALID_BG = '#FDECEA';

export const DEFAULT_RESULT_FADE_DELAY_MS = 2000;
const RESULT_FADE_DURATION_MS = 300;

const BUBBLE_W = 220;
const BUBBLE_H = 36;

export default function CurrentWordDisplay({
  currentWord,
  slots: slotsProp,
  onSlotPress,
  onHolePress,
  targetHoleId,
  lastResult,
  inputBoxCount = DEFAULT_INPUT_BOX_COUNT,
  resultFadeDelayMs = DEFAULT_RESULT_FADE_DELAY_MS,
  resultMaxWidth = BUBBLE_W,
  resultAlign = 'center',
}) {
  const {
    shakeX,
    flashOpacity,
    flashColor,
    rippleScale,
    rippleOpacity,
    popScale,
    playValid,
    playInvalid,
  } = useResultFeedbackAnimation();

  const resultOpacity = useRef(new Animated.Value(0)).current;
  const bubbleScale = useRef(new Animated.Value(1)).current;
  const fadeTimeoutRef = useRef(null);
  const [resultKey, setResultKey] = useState(0);

  const animatedResultRef = useRef(null);

  useEffect(() => {
    if (!lastResult || lastResult === animatedResultRef.current) return;
    animatedResultRef.current = lastResult;
    if (lastResult.valid) {
      playValid();
    } else {
      playInvalid();
    }

    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setResultKey((k) => k + 1);
    resultOpacity.stopAnimation();
    resultOpacity.setValue(1);
    bubbleScale.setValue(0.7);
    Animated.spring(bubbleScale, {
      toValue: 1,
      friction: 5,
      tension: 160,
      useNativeDriver: true,
    }).start();
    fadeTimeoutRef.current = setTimeout(() => {
      Animated.timing(resultOpacity, {
        toValue: 0,
        duration: RESULT_FADE_DURATION_MS,
        useNativeDriver: true,
      }).start();
    }, resultFadeDelayMs);
  }, [lastResult, playValid, playInvalid, resultOpacity, bubbleScale, resultFadeDelayMs]);

  useEffect(() => () => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
  }, []);

  const flashBackgroundColor = flashColor.interpolate({
    inputRange: [0, 1],
    outputRange: [INVALID_COLOR, VALID_COLOR],
  });
  const rippleBackgroundColor = lastResult && lastResult.valid ? VALID_COLOR : INVALID_COLOR;

  const slots = slotsProp ?? (currentWord || []);

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.row, { transform: [{ translateX: shakeX }, { scale: popScale }] }]}>
        {slots.map((letter, i) =>
          letter && letter.held ? (
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

        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { backgroundColor: flashBackgroundColor, opacity: flashOpacity }]}
        />

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

      {lastResult ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.bubbleWrap,
            resultAlign === 'left' && { alignItems: 'flex-start' },
            { opacity: resultOpacity, transform: [{ scale: bubbleScale }] },
          ]}
        >
          <SpeechBubble
            width={Math.min(BUBBLE_W, resultMaxWidth)}
            height={BUBBLE_H}
            text={
              lastResult.valid
                ? `${lastResult.word} +${lastResult.score}`
                : lastResult.word
                  ? `${lastResult.word}? Not a word`
                  : 'No letters!'
            }
            textColor={lastResult.valid ? VALID_COLOR : INVALID_COLOR}
            backgroundColor={lastResult.valid ? VALID_BG : INVALID_BG}
          >
            {lastResult.valid ? <Twinkle key={resultKey} loop={false} color="#F9A825" /> : null}
          </SpeechBubble>
        </Animated.View>
      ) : null}
    </View>
  );
}

const ROW_MIN_HEIGHT = 46;
const BUBBLE_TAIL_GAP = 8;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 4,
    width: '100%',
    zIndex: 3,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: ROW_MIN_HEIGHT,
    minWidth: ROW_MIN_HEIGHT,
    maxWidth: '90%',
    borderRadius: 12,
    paddingHorizontal: 6,
    alignSelf: 'center',
    overflow: 'hidden',
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
  bubbleWrap: {
    position: 'absolute',
    top: -(BUBBLE_H + BUBBLE_TAIL_GAP),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
});