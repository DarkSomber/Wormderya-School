import React from "react";
import { View, Text, StyleSheet } from "react-native";
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

export default function VolumeSlider({ label, value, onValueChange, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{label}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={1}
        value={value}
        onValueChange={onValueChange}
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
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5c3a21",
    marginBottom: 6,
  },
  slider: {
    width: "100%",
    height: 36,
  },
});
