import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Text from '../AppText';

/**
 * [TEST/DEBUG ONLY] Toggles level progression:
 *   not all unlocked -> unlock every level
 *   all unlocked     -> reset to Level 1
 *
 * To remove for release: delete this file, its usage in LevelSelectScreen,
 * and the DEBUG_LEVEL_TOGGLE parts of App.js (or set that flag to false).
 */
export default function DebugButton({ allUnlocked, onPress }) {
  return (
    <TouchableOpacity
      testID="debug-unlock-toggle"
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.button}
    >
      <Text style={styles.label}>
        {allUnlocked ? '[TEST] Reset to Level 1' : '[TEST] Unlock all levels'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c0392b',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  label: { color: '#c0392b', fontWeight: '700', fontSize: 13 },
});