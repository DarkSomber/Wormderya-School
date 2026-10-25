import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Image,
  ImageBackground,
} from "react-native";
import AppButton from "../components/AppButton";
import { AnimatedWorm } from "./HomeScreen";

export default function ModeSelectScreen({
  onSelectStoryMode,
  onSelectRushHour,
  onBack,
}) {
  return (
    <ImageBackground
      source={require("../assets/Final/MainBackground.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image
          source={require("../assets/Final/WormderyaLogo.png")}
          style={styles.titleImage}
          resizeMode="contain"
        />

        <View style={styles.characterPlaceholder}>
          <AnimatedWorm />
        </View>

        <View style={styles.menu}>
          <AppButton
            onPress={onSelectStoryMode}
            label="STORY MODE"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
          <AppButton
            onPress={onSelectRushHour}
            style={styles.buttonSpacing}
            label="RUSH HOUR MODE"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
          <AppButton
            onPress={onBack}
            style={styles.buttonSpacing}
            label="BACK"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    height: "100%",
    width: "100%",
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

  menu: {
    alignItems: "center",
    marginTop: 55,
  },
  buttonSpacing: {
    marginTop: 20,
  },
});