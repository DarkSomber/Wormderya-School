import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  ImageBackground,
} from "react-native";
import AppButton from "../components/AppButton";

export default function HomeScreen({ onStart, onOpenSettings, onQuit }) {
  const handleStart = onStart ?? (() => Alert.alert("Start pressed"));
  const handleSettings =
    onOpenSettings ?? (() => Alert.alert("Settings pressed"));
  const handleQuit = onQuit ?? (() => Alert.alert("Quit pressed"));

  {
    /* ---------- BACKGROUND ---------- */
  }
  return (
    <ImageBackground
      source={require("../assets/Final/MainBackground.png")}
      style={styles.background}
      resizeMode="contain"
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/Final/WormderyaLogo.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />

        {/* ---------- CHARACTER  ---------- */}
        <View style={styles.characterPlaceholder}>
          <Image
            source={require("../assets/Final/MainCharacter.png")}
            style={styles.characterImage}
            resizeMode="contain"
          />
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
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
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
