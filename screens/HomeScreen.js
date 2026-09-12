import React from "react";
import { View, Text, StyleSheet, StatusBar, Alert } from "react-native";
import AppButton from "../components/AppButton";

/**
 * HomeScreen
 * ----------------------------------------------------------------------
 * Recreates the title-screen mockup:
 *   [ background art ]
 *   [ title art / logo ]
 *   [ character / hero art ]
 *   [ START ]
 *   [ SETTING ]
 *   [ QUIT ]
 *
 * Everything marked PLACEHOLDER is meant to be swapped for real
 * artwork later — just drop the file into /assets and uncomment the
 * `require(...)` line noted in each comment block.
 * ----------------------------------------------------------------------
 */

export default function HomeScreen({ onStart, onOpenSettings, onQuit }) {
  const handleStart = onStart ?? (() => Alert.alert("Start pressed"));
  const handleSettings =
    onOpenSettings ?? (() => Alert.alert("Settings pressed"));
  const handleQuit = onQuit ?? (() => Alert.alert("Quit pressed"));

  // ---------- BACKGROUND PLACEHOLDER ----------
  // Right now the background is just a flat color (see styles.background).
  // Once you have the art, swap the outer <View> below for:
  //
  //   import { ImageBackground } from 'react-native';
  //   <ImageBackground
  //     source={require('../../assets/background.png')}
  //     style={styles.background}
  //     resizeMode="cover"
  //   >
  //     ...same children...
  //   </ImageBackground>

  return (
    <View style={styles.background}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* ---------- TITLE PLACEHOLDER ---------- */}
        {/* Later swap this whole block for:
            <Image source={require('../../assets/title.png')} style={styles.titleImage} resizeMode="contain" />
        */}
        <View style={styles.titlePlaceholder}>
          <Text style={styles.titlePlaceholderText}>
            TITLE / LOGO{"\n"}PLACEHOLDER
          </Text>
        </View>

        {/* ---------- CHARACTER PLACEHOLDER ---------- */}
        {/* Later swap this whole block for:
            <Image source={require('../../assets/character.png')} style={styles.characterImage} resizeMode="contain" />
        */}
        <View style={styles.characterPlaceholder}>
          <Text style={styles.characterPlaceholderText}>
            CHARACTER{"\n"}ART
          </Text>
        </View>

        {/* ---------- MENU BUTTONS ---------- */}
        <View style={styles.menu}>
          <AppButton
            label="START"
            onPress={handleStart}
            // Later: backgroundImage={require('../../assets/buttons/start.png')}
          />
          <AppButton
            label="SETTING"
            onPress={handleSettings}
            style={styles.buttonSpacing}
            // Later: backgroundImage={require('../../assets/buttons/setting.png')}
          />
          <AppButton
            label="QUIT"
            onPress={handleQuit}
            style={styles.buttonSpacing}
            // Later: backgroundImage={require('../../assets/buttons/quit.png')}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // BACKGROUND PLACEHOLDER COLOR — replace with ImageBackground once art is ready
    backgroundColor: "#f3e6cf",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
    paddingBottom: 30,
  },
  titlePlaceholder: {
    width: "80%",
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  titlePlaceholderText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 14,
  },
  characterPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  characterPlaceholderText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
  },
  menu: {
    alignItems: "center",
  },
  buttonSpacing: {
    marginTop: 14,
  },
});
