import React from "react";
import { View, StyleSheet } from 'react-native';
import Text from './AppText';
import Slider from "@react-native-community/slider";

/**
 * VolumeSlider
 * ----------------------------------------------------------------------
 * A single labeled row: "Label" above a slider. Used for Master Volume,
 * Music Volume, and Sound Effects (SFX) in SettingsScreen, but generic
 * enough to reuse for any other 0–1 value slider later on.
 *
 * Requires: @react-native-community/slider
 *   npx expo install @react-native-community/slider
 * ----------------------------------------------------------------------
 */

export default function VolumeSlider({ label, value, onValueChange, onSlidingComplete, style }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percent}>{Math.round(value * 100)}%</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        value={value}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor="#4caf50"
        maximumTrackTintColor="#f0e6d2"
        thumbTintColor="#ffffff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5c3a21",
  },
  // Lightest weight loaded (Regular).
  percent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
  },
  slider: {
    width: "80%",
    height: 40,
    alignSelf: "center",
    transform: [{ scale: 1.25 }],
  },
});