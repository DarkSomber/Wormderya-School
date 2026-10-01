import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../AppText';

// Small bar under the header showing currently active power-ups.
export default function UpgradeHUD({ activeList }) {
  if (!activeList || activeList.length === 0) return null;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {activeList.map((u) => (
        <View key={u.id} style={styles.chip}>
          <Text style={styles.name} numberOfLines={1}>
            {u.name}
          </Text>
          {u.remainingMs !== null && (
            <Text style={styles.time}>
              {Math.ceil(u.remainingMs / 1000)}s
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#FFE194',
    borderWidth: 2,
    borderColor: '#7A2E2E',
    borderRadius: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B1F0B',
    maxWidth: 140,
  },
  time: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7A2E2E',
  },
});