import React, { useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import Text from "../components/AppText";
import AppButton from "../components/AppButton";
import VolumeSlider from "../components/VolumeSlider";

const PANEL_TITLES = {
  music: "Music",
  credits: "Credits",
  achievements: "Achievement",
};

export default function SettingsScreen({ onBack }) {
  const [view, setView] = useState("music");
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.8);
  const [sfxVolume, setSfxVolume] = useState(0.8);

  return (
    <ImageBackground
      source={require("../assets/Final/MainBackground.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* TOP BAR */}

        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onBack}
            style={styles.backCircle}
          >
            <Image
              source={require("../assets/Final/buttons/buttonSettings-Back.png")}
              style={styles.backCircleImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* SETTINGS PANEL */}
        <ImageBackground
          source={require("../assets/Final/SettingsPanel.png")}
          style={styles.panel}
          imageStyle={styles.panelImage}
          resizeMode="cover"
        >
          <Text style={styles.panelTitle}>{PANEL_TITLES[view]}</Text>
          <View style={styles.panelDivider} />

          {view === "music" && (
            <>
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

              <View style={styles.panelButtonRow}>
                <AppButton
                  onPress={() => setView("credits")}
                  style={styles.panelSmallButton}
                  backgroundImage={require("../assets/Final/buttons/buttonSettings-Achievements.png")}
                />
                <AppButton
                  onPress={() => setView("achievements")}
                  style={styles.panelSmallButton}
                  multiline
                  backgroundImage={require("../assets/Final/buttons/buttonSettings-Credits.png")}
                />
              </View>
            </>
          )}

          {view !== "music" && (
            <>
              <View style={styles.placeholderContent}>
                <Text style={styles.placeholderContentText}>
                  {view === "credits" ? "CREDITS" : "ACHIEVEMENTS"}
                  {"\n"}CONTENT PLACEHOLDER
                </Text>
              </View>

              <AppButton
                label="Back"
                onPress={() => setView("music")}
                style={styles.panelBackButton}
              />
            </>
          )}
        </ImageBackground>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#f3e6cf",
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topBar: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  backCircle: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  backCircleImage: {
    width: "60",
    height: "60",
  },
  panel: {
    width: "100%",
    flex: 1,
    overflow: "hidden",
    paddingVertical: 25,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  panelImage: {
    borderRadius: 20,
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
    width: "100%",
  },
  panelButtonRow: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: "auto",
    gap: 20,
  },
  panelSmallButton: {
    size: 25,
  },
  placeholderContent: {
    width: "100%",
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  placeholderContentText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
  },
  panelBackButton: {
    width: 160,
    height: 48,
  },
});
