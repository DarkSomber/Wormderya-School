import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import Text from '../AppText';

/**
 * [TEST/DEBUG ONLY] Level-select debug controls.
 *   - unlock toggle (existing)
 *   - wipe local save and reset to a fresh game
 */
export default function DebugButton({ allUnlocked, onPress, onResetSave }) {
  return (
    <View style={styles.row}>
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

      {onResetSave && (
        <TouchableOpacity
          testID="debug-wipe-save"
          onPress={onResetSave}
          activeOpacity={0.7}
          style={[styles.button, styles.danger]}
        >
          <Text style={[styles.label, styles.dangerLabel]}>[TEST] Wipe save</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c0392b',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  label: { color: '#c0392b', fontWeight: '700', fontSize: 13 },
  danger: { borderColor: '#7a1010' },
  dangerLabel: { color: '#7a1010' },
});