import React, { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Text from "../components/AppText";
import AppButton from "../components/AppButton";
import VolumeSlider from "../components/VolumeSlider";
import audio from "../audio/AudioManager";
import AchievementList from "../components/AchievementList";
import GrannyTutorial from "../components/GrannyTutorial";
import PopupModal from "../components/PopupModal";
import { isOnline } from "../components/gameplayReusables/WordInput/WordApi";

const PANEL_TITLES = {
  music: "Settings",
  credits: "Credits",
  achievements: "Achievement",
};

const PANEL_VERTICAL_MARGIN = 64;

const ART_BORDER = { left: 0.046, right: 0.858, top: 0.02, bottom: 0.979 };

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

  transform: [{ translateX: 20 }, { translateY: 20 }],
};

function ConnectionStatus() {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    let cancelled = false;
    isOnline().then((ok) => {
      if (!cancelled) setOnline(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const text =
    online === null
      ? "Checking connection..."
      : online
        ? "You are connected - all words available"
        : "You are not connected - fewer words available";

  return (
    <Text
      style={[
        styles.connectionText,
        online === true && styles.connectionOn,
        online === false && styles.connectionOff,
      ]}
    >
      {text}
    </Text>
  );
}

export default function SettingsScreen({
  onBack,
  achievements,
  onResetProgress,
}) {
  const [view, setView] = useState("music");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleConfirmReset = async () => {
    if (resetting) return;
    setResetting(true);
    try {
      await onResetProgress?.();
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };
  const [masterVolume, setMasterVolume] = useState(
    () => audio.getVolumes().master,
  );
  const [musicVolume, setMusicVolume] = useState(
    () => audio.getVolumes().music,
  );
  const [sfxVolume, setSfxVolume] = useState(() => audio.getVolumes().sfx);

  const liveVolume = (kind, setter) => (value) => {
    setter(value);
    audio.setVolume(kind, value);
  };
  const saveVolume = (preview) => () => {
    audio.commitVolumes();
    if (preview) audio.playSfx("click");
  };

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
                backgroundImage={require("../assets/Final/buttons/button.png")}
                value={masterVolume}
                onValueChange={liveVolume("master", setMasterVolume)}
                onSlidingComplete={saveVolume(true)}
                style={styles.sliderSpacing}
              />
              <VolumeSlider
                label="Music Volume"
                backgroundImage={require("../assets/Final/buttons/button.png")}
                value={musicVolume}
                onValueChange={liveVolume("music", setMusicVolume)}
                onSlidingComplete={saveVolume(false)}
                style={styles.sliderSpacing}
              />
              <VolumeSlider
                label="Sound Effects (SFX)"
                backgroundImage={require("../assets/Final/buttons/button.png")}
                value={sfxVolume}
                onValueChange={liveVolume("sfx", setSfxVolume)}
                onSlidingComplete={saveVolume(true)}
                style={styles.sliderSpacing}
              />

              <ConnectionStatus />

              <View style={styles.panelButtonRow}>
                <AppButton
                  onPress={() => setView("achievements")}
                  style={styles.panelSmallButton}
                  label="Achievement"
                  backgroundImage={require("../assets/Final/buttons/button.png")}
                />
                <AppButton
                  onPress={() => setView("credits")}
                  style={styles.panelSmallButton}
                  label="Credits"
                  backgroundImage={require("../assets/Final/buttons/button.png")}
                />
                {onResetProgress && (
                  <AppButton
                    onPress={() => setConfirmReset(true)}
                    style={styles.panelSmallButton}
                    label="Reset Progress"
                    backgroundImage={require("../assets/Final/buttons/button.png")}
                  />
                )}
              </View>
            </>
          )}

          {view === "achievements" && (
            <AchievementList unlockedIds={achievements?.unlockedIds} />
          )}

          {view === "credits" && (
            <ScrollView
              style={styles.creditsScrollView}
              contentContainerStyle={styles.creditsContentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.creditsTitleText}>DEVELOPMENT TEAM</Text>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>Lead Developer</Text>
                <Text style={styles.nameText}>Palas, James T.</Text>
              </View>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>Gameplay Programmer</Text>
                <Text style={styles.nameText}>Lantin, Jose Gabriel</Text>
              </View>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>UI/UX</Text>
                <Text style={styles.nameText}>Rota, Ysabella Dylan M.</Text>
              </View>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>
                  Level/Content Designer-Programmer & Sound Design
                </Text>
                <Text style={styles.nameText}>Erese, Daniel Noel</Text>
              </View>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>QA/Systems Programmer</Text>
                <Text style={styles.nameText}>Domingo, Marc Gerard M.</Text>
              </View>

              <Text style={[styles.creditsTitleText, { marginTop: 12 }]}>
                Third-Party Assets
              </Text>

              <View style={styles.creditItem}>
                <Text style={styles.roleText}>Game Font Geist Pixel</Text>
                <Text style={styles.nameText}>The Geist Project Authors</Text>
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.topBar}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => {
              audio.playSfx("click");
              if (view !== "music") setView("music");
              else onBack?.();
            }}
            style={styles.backCircle}
          >
            <Image
              source={require("../assets/Final/buttons/buttonSettings-Back.png")}
              style={styles.backCircleImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <GrannyTutorial style={{ bottom: 20 }} />
      </View>

      <PopupModal
        visible={confirmReset}
        title="RESET PROGRESS?"
        message="This erases your unlocked levels, coins, upgrades, achievements and best scores."
        extraMessage="This cannot be undone."
        buttonText={resetting ? "Resetting..." : "Reset"}
        buttonColor="#F4A3A3"
        onPress={handleConfirmReset}
        cancelText="Cancel"
        cancelColor="#E0E0E0"
        onCancel={() => {
          if (!resetting) setConfirmReset(false);
        }}
      />
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
    transform: [{ translateX: 20 }, { translateY: -30 }],
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
    marginBottom: 7,
  },
  sliderSpacing: {
    marginBottom: 20,
    width: "100%",
  },
  connectionText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 4,
  },
  connectionOn: { color: "#2e7d32" },
  connectionOff: { color: "#b3261e" },
  panelButtonRow: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 30,
    gap: 7,
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
  creditsScrollView: { width: "100%", flex: 1 },
  creditsContentContainer: { paddingVertical: 8, alignItems: "center" },
  creditsTitleText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 24,
    marginBottom: 15,
  },
  creditItem: { alignItems: "center", marginBottom: 25 },
  roleText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  nameText: {
    textAlign: "center",
    color: "#5c3a1e",
    fontWeight: "500",
    fontSize: 13,
  },
});