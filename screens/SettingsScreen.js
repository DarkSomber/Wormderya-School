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
  music: "Settings",
  credits: "Credits",
  achievements: "Achievement",
};

// Space reserved above AND below the panel so it sits in the middle of the
// screen. It must clear the back button (top 20 + 48 tall = 68), so 64 + the
// container's 16 padding = 80px on both sides.
const PANEL_VERTICAL_MARGIN = 64;

const ART_BORDER = { left: 0.046, right: 0.858, top: 0.02, bottom: 0.979 };

// Gap between the drawn border and the sliders/labels.
const CONTENT_PAD_X = "10%";
const CONTENT_PAD_Y = 40;

const artW = ART_BORDER.right - ART_BORDER.left;
const artH = ART_BORDER.bottom - ART_BORDER.top;
const ART_STYLE = {
  position: "absolute",
  width: `${100 / artW}%`,
  height: `${100 / artH}%`,
  left: `${(-ART_BORDER.left / artW) * 100}%`,
  top: `${(-ART_BORDER.top / artH) * 100}%`,

  transform: [
    { translateX: 20},
    { translateY: 20},
  ],
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
        <View style={styles.panel}>
          <Image
            source={require("../assets/Final/SettingsPanel.png")}
            style={ART_STYLE}
            resizeMode="stretch"
          />
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
                {/* Image and target now match (they were swapped before). */}
                <AppButton
                  onPress={() => setView("achievements")}
                  style={styles.panelSmallButton}
                  backgroundImage={require("../assets/Final/buttons/buttonSettings-Achievements.png")}
                />
                <AppButton
                  onPress={() => setView("credits")}
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
        </View>

        {/* BACK BUTTON — absolute, so it no longer pushes the panel down.
            Rendered after the panel so it stays on top and tappable. */}
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
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  topBar: {
    position: "absolute",
    top: 20,
    left: 16,
  },
  backCircle: {
    width: 50,
    height: 50,
    top: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  backCircleImage: {
    width: 60, 
    height: 60,
  },
  panel: {
    width: "100%",
    flex: 1,
    marginVertical: PANEL_VERTICAL_MARGIN,
    alignSelf: "center",
    overflow: "hidden", 
    paddingVertical: CONTENT_PAD_Y,
    paddingHorizontal: CONTENT_PAD_X,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundImage: {
    transform: [
      { translateX: 20},
      { translateY: -30},
    ]
  },
  panelTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5c3a21",
    marginBottom: 22,
  },
  panelDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#8a5a30",
    opacity: 0.5,
    marginBottom: 16,
  },
  sliderSpacing: {
    marginBottom: 26,
    width: "100%",
  },
  panelButtonRow: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
    gap: 20,
  },
  panelSmallButton: {
    width: 230,
    height: 64,
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
    width: 200,
    height: 60,
  },
});