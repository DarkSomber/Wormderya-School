import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from './AppText';

const TAIL = 10;

export default function SpeechBubble({
  text,
  width = 200,
  height = 36,
  textColor = '#000',
  backgroundColor = '#FFF8E7',
  style,
  textStyle,
  children,
}) {
  return (
    <View style={[{ width, height }, style]}>
      <View style={[styles.box, { backgroundColor }]}>
        <Text
          style={[styles.text, { color: textColor }, textStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {text}
        </Text>
        {children}
      </View>
      <View style={[styles.tail, { backgroundColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  tail: {
    position: 'absolute',
    left: '50%',
    bottom: -TAIL / 2,
    width: TAIL,
    height: TAIL,
    marginLeft: -TAIL / 2,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000',
    transform: [{ rotate: '45deg' }],
  },
});