import React from "react";
import { View, StyleSheet, ImageBackground } from 'react-native';
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

export default function VolumeSlider({
  label,
  value,
  onValueChange,
  onSlidingComplete,
  style,
  backgroundImage, // optional: image drawn behind the whole row (e.g. button.png)
}) {
  const slider = (
    <Slider
      style={backgroundImage ? styles.sliderOnBackground : styles.slider}
      minimumValue={0}
      maximumValue={1}
      value={value}
      onValueChange={onValueChange}
      onSlidingComplete={onSlidingComplete}
      minimumTrackTintColor="#4caf50"
      maximumTrackTintColor="#f0e6d2"
      thumbTintColor="#ffffff"
    />
  );

  return (
    <View style={[styles.row, style]}>
      <View style={[styles.header, backgroundImage && styles.headerTight]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.percent}>{Math.round(value * 100)}%</Text>
      </View>
      {backgroundImage ? (
        // Thin strip stretched across the full width of the slider.
        <ImageBackground
          source={backgroundImage}
          resizeMode="stretch"
          style={styles.sliderStrip}
        >
          {slider}
        </ImageBackground>
      ) : (
        slider
      )}
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
  headerTight: {
    marginBottom: 5,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5c3a21",
  },
  percent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
  },
  sliderStrip: {
    width: "105%",
    height: 44,
    paddingHorizontal: 7,
    justifyContent: "center",
    right: 10,
  },
  sliderOnBackground: {
    width: "100%",
    height: 36,
  },
  slider: {
    width: "80%",
    height: 40,
    alignSelf: "center",
    transform: [{ scale: 1.25 }],
  },
});