import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import AppButton from "../components/AppButton";
import VolumeSlider from "../components/VolumeSlider";

/**
 * SettingsScreen
 * ----------------------------------------------------------------------
 * Shown when the player taps "SETTING" on the title screen:
 *   [ background art ]        <- same placeholder pattern as other screens
 *   "Settings" heading
 *   [ Music panel: Master Volume / Music Volume / SFX sliders ]
 *   [ Credits ]                <- reuses AppButton, temporarily disabled
 *   [ Back ]                   <- reuses AppButton, returns to previous screen
 * ----------------------------------------------------------------------
 */

export default function SettingsScreen({ onBack }) {
  // Local slider state just for this demo. Wire these up to your real
  // audio/settings store whenever that exists.
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [sfxVolume, setSfxVolume] = useState(0.8);

  return (
    <View style={styles.background}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <Text style={styles.heading}>Settings</Text>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Music</Text>
          <View style={styles.panelDivider} />

          <VolumeSlider
            label="Master Volume"
            value={masterVolume}
            onValueChange={setMasterVolume}
            style={styles.sliderSpacing}
          />
          <VolumeSlider
            label="Music Volume"
            value={musicVolume}
            onValueChange={setMusicVolume}
            style={styles.sliderSpacing}
          />
          <VolumeSlider
            label="Sound Effects (SFX)"
            value={sfxVolume}
            onValueChange={setSfxVolume}
            style={styles.sliderSpacing}
          />

          {/* Credits is a real AppButton — just disabled for now.
              Flip `disabled` to false once the credits screen exists. */}
          <AppButton
            label="Credits"
            onPress={() => {}}
            disabled
            style={styles.creditsButton}
            // Later: backgroundImage={require('../assets/buttons/credits.png')}
          />
        </View>

        <AppButton
          onPress={onBack}
          style={styles.buttonSpacing}
          backgroundImage={require("../assets/Final/buttons/buttonBack.png")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // BACKGROUND PLACEHOLDER COLOR — same as the other screens
    backgroundColor: "#f3e6cf",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heading: {
    fontSize: 30,
    fontWeight: "800",
    color: "#2a2a2a",
    marginBottom: 20,
  },
  panel: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(245, 200, 120, 0.35)",
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 24,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5c3a21",
    marginBottom: 8,
  },
  panelDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#8a5a30",
    opacity: 0.5,
    marginBottom: 16,
  },
  sliderSpacing: {
    marginBottom: 14,
  },
  creditsButton: {
    marginTop: 145,
  },
  backButton: {
    width: "100%",
    marginTop: "auto",
  },
});
