import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../AppText';

const TAIL = 12;

export default function HintBubble({ text, reward, scale = 1, picky = false, boss = false }) {
  const bg = boss ? '#F3E1FF' : picky ? '#FFE9C7' : '#FFF8E7';
  const rewarded = reward != null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: rewarded ? '#DFF5DC' : bg,
            borderRadius: 10 * scale,
            paddingHorizontal: 8 * scale,
          },
        ]}
      >
        <Text
          style={[styles.text, { color: rewarded ? '#1B6B1B' : '#2B1B0E', fontSize: (boss ? 17 : 22) * scale }]}
          numberOfLines={boss ? 4 : 2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {rewarded ? `Tama! +${reward}` : text}
        </Text>
      </View>
      <View
        style={[
          styles.tail,
          { backgroundColor: rewarded ? '#DFF5DC' : bg, width: TAIL * scale, height: TAIL * scale },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  box: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: { fontWeight: '700', textAlign: 'center' },
  tail: {
    position: 'absolute',
    left: -TAIL / 2,
    top: '58%',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#000',
    transform: [{ rotate: '45deg' }],
  },
});