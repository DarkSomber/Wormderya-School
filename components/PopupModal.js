import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import Text from './AppText';
import audio from '../audio/AudioManager';

const BUBBLE_W = 170;
const BUBBLE_H = 44;

const withClick = (fn) => (e) => {
  audio.playSfx('click');
  fn?.(e);
};

export default function PopupModal({
  visible,
  title,
  message,
  extraMessage,
  score,
  buttonText,
  buttonColor = '#FFE194',
  onPress,
  cancelText,
  onCancel,
  cancelColor,
  extraText,
  onExtra,
  extraColor = '#FFE194',
  extraDisabled = false,
  extraDisabledMessage,
  children, 
  overlayChildren,
}) {
  const hasExtra = !!(extraText && onExtra);
  const [bubblePos, setBubblePos] = useState(null);
  const bubbleTimerRef = useRef(null);
  const overlayRef = useRef(null);
  const extraRef = useRef(null);
  const { width: screenW } = useWindowDimensions();

  useEffect(() => () => clearTimeout(bubbleTimerRef.current), []);
  useEffect(() => {
    if (!visible) {
      clearTimeout(bubbleTimerRef.current);
      setBubblePos(null);
    }
  }, [visible]);

  const handleExtraPress = () => {
    if (!extraDisabled) {
      withClick(onExtra)();
      return;
    }
    if (!extraDisabledMessage) return;
    overlayRef.current?.measureInWindow((ox, oy) => {
      extraRef.current?.measureInWindow((x, y, w) => {
        const center = x - ox + w / 2;
        const left = Math.max(8, Math.min(center - BUBBLE_W / 2, screenW - BUBBLE_W - 8));
        setBubblePos({
          left,
          top: y - oy - BUBBLE_H - 10,
          tail: Math.max(10, Math.min(center - left, BUBBLE_W - 10)),
        });
        clearTimeout(bubbleTimerRef.current);
        bubbleTimerRef.current = setTimeout(() => setBubblePos(null), 2000);
      });
    });
  };
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onCancel ?? onPress}
    >
      <View ref={overlayRef} collapsable={false} style={styles.overlay}>
        <View style={styles.card}>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.divider} />

          {children}

          <View style={styles.body}>
            {message && <Text style={styles.messageText}>{message}</Text>}
          </View>
          <View style={styles.body}>
            {extraMessage && <Text style={styles.extraMessageText}>{extraMessage}</Text>}
          </View>

          {score !== undefined && (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>SCORE: {score}</Text>
               </View>
            )}

          <View style={[styles.buttonRow, hasExtra && styles.buttonRowCompact]}>
            {cancelText && onCancel ? (
              <TouchableOpacity
                style={[styles.button, hasExtra && styles.buttonCompact, styles.cancelButtonm, cancelColor && { backgroundColor: cancelColor}]}
                onPress={withClick(onCancel)}
              >
                <Text style={styles.buttonText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}

            {hasExtra ? (
              <View ref={extraRef} collapsable={false} style={styles.extraWrap}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.buttonCompact,
                    extraDisabled ? styles.buttonDisabled : { backgroundColor: extraColor },
                  ]}
                  activeOpacity={extraDisabled ? 1 : 0.2}
                  onPress={handleExtraPress}
                >
                  <Text style={[styles.buttonText, extraDisabled && styles.buttonTextDisabled]}>{extraText}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, hasExtra && styles.buttonCompact, { backgroundColor: buttonColor }]}
              onPress={withClick(onPress)}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>

        </View>
        {overlayChildren}
        {extraDisabled && bubblePos ? (
          <View
            pointerEvents="none"
            style={[styles.bubble, { left: bubblePos.left, top: bubblePos.top }]}
          >
            <Text style={styles.bubbleText}>{extraDisabledMessage}</Text>
            <View style={[styles.bubbleTail, { left: bubblePos.tail - 6 }]} />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '85%',
    maxWidth: 320,
    backgroundColor: '#FFF8E7',
    borderWidth: 3,
    borderColor: '#000',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 26,
  },
  divider: {
    width: '100%',
    height: 1.5,
    backgroundColor: '#333',
    marginVertical: 14,
  },
  body: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  messageText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },
  scoreBox: {
    marginTop: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  extraMessageText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  buttonRowCompact: {
    gap: 8,
  },
  buttonCompact: {
    minWidth: 0,
    paddingHorizontal: 12,
  },
  button: {
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 24,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  buttonDisabled: {
    backgroundColor: '#D0D0D0',
    borderColor: '#8A8A8A',
  },
  buttonTextDisabled: {
    color: '#8A8A8A',
  },
  extraWrap: {
    position: 'relative',
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_W,
    height: BUBBLE_H,
    backgroundColor: '#222',
    borderRadius: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 20,
  },
  bubbleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF8E7',
    textAlign: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#222',
  },
});