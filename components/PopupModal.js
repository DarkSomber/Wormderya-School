import React from 'react';
import { StyleSheet, View, Modal, TouchableOpacity } from 'react-native';
import Text from './AppText';
import audio from '../audio/AudioManager';

// Popup buttons all click, then run their own handler.
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
  buttonColor = '#FFE194', // Default color
  onPress,
  cancelText,
  onCancel,
  cancelColor,
  extraText, // optional third button, shown between cancel and the main button
  onExtra,
  extraColor = '#FFE194',
  children, 
  overlayChildren,
}) {
  const hasExtra = !!(extraText && onExtra);
  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={onCancel ?? onPress}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>

          {/* Header Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Divider Line */}
          <View style={styles.divider} />

          {children}

          {/* Body Content */}
          <View style={styles.body}>
            {message && <Text style={styles.messageText}>{message}</Text>}
          </View>
          <View style={styles.body}>
            {extraMessage && <Text style={styles.extraMessageText}>{extraMessage}</Text>}
          </View>


            {/* Styled Score Display */}
          {score !== undefined && (
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>SCORE: {score}</Text>
               </View>
            )}

          {/* Action Button(s) */}
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
              <TouchableOpacity
                style={[styles.button, styles.buttonCompact, { backgroundColor: extraColor }]}
                onPress={withClick(onExtra)}
              >
                <Text style={styles.buttonText}>{extraText}</Text>
              </TouchableOpacity>
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
  // Dedicated styling for the score display
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
  // Three buttons: tighter so they still fit on one row of the card.
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
});