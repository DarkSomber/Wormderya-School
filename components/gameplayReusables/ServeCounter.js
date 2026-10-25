import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../AppText';
import { Slot } from './Stage';

const COUNTER_RECT = { x: 176, y: 484, w: 160, h: 66 };
const SHOW_MS = 3000;

export default function ServeCounter({ customersServed, totalCustomers, wordsServed, totalWords, scale, ping = 0 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const t = setTimeout(() => setVisible(false), SHOW_MS);
    return () => clearTimeout(t);
  }, [ping]);

  const showCustomers = Number.isFinite(totalCustomers);
  const showWordTotal = Number.isFinite(totalWords);
  const fontSize = Math.max(13, 17 * scale);

  if (!visible) return null;

  return (
    <Slot rect={COUNTER_RECT} scale={scale} style={{ justifyContent: 'center' }}>
      <View style={styles.pill} pointerEvents="none">
        {showCustomers && (
          <View style={styles.row}>
            <Text style={[styles.label, { fontSize }]} numberOfLines={1}>Customers</Text>
            <Text style={[styles.value, { fontSize }]} numberOfLines={1}>
              {customersServed}/{totalCustomers}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={[styles.label, { fontSize }]} numberOfLines={1}>Words</Text>
          <Text style={[styles.value, { fontSize }]} numberOfLines={1}>
            {showWordTotal ? `${wordsServed}/${totalWords}` : wordsServed}
          </Text>
        </View>
        <View style={styles.tail} />
      </View>
    </Slot>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#FFF8E7',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#2B1B0E' },
  value: { color: '#2B1B0E', fontWeight: '700', marginLeft: 6 },
  tail: {
    position: 'absolute',
    right: -7,
    bottom: 10,
    width: 12,
    height: 12,
    backgroundColor: '#FFF8E7',
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: '#000',
    transform: [{ rotate: '45deg' }],
  },
});
