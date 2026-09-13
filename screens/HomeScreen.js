import React from "react";
import { View, Text, StyleSheet, StatusBar, Alert, Image } from "react-native";
import AppButton from "../components/AppButton";

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
        <Image
          source={require("../assets/Final/WormderyaLogo.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />

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
            onPress={handleStart}
            backgroundImage={require("../assets/Final/buttons/buttonStart1.png")}
          />
          <AppButton
            onPress={handleSettings}
            style={styles.buttonSpacing}
            backgroundImage={require("../assets/Final/buttons/buttonSettings.png")}
          />
          <AppButton
            onPress={handleQuit}
            style={styles.buttonSpacing}
            backgroundImage={require("../assets/Final/buttons/buttonQuit.png")}
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
  titleImage: {
    width: "80%",
    height: 250,
    alignSelf: "center",
    marginBottom: 15,
    marginTop: -50,
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
    marginTop: -20,
  },
  characterPlaceholderText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
  },
  menu: {
    alignItems: "center",
    marginTop: 55,
  },
  buttonSpacing: {
    marginTop: 20,
  },
});
