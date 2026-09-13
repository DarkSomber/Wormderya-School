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

/**
 * ModeSelectScreen
 * ----------------------------------------------------------------------
 * Shown after the player taps "START" on the title screen:
 *   [ background art ]        <- same placeholder pattern as HomeScreen
 *   [ title / logo ]          <- same placeholder pattern as HomeScreen
 *   [ Story-Mode ]
 *   [ Rush Hour Mode ]
 *   [ Back ]
 *
 * Reuses the exact same AppButton component as the title screen, so any
 * future button art/styling changes only need to happen in one place.
 * ----------------------------------------------------------------------
 */

export default function ModeSelectScreen({
  onSelectStoryMode,
  onSelectRushHour,
  onBack,
}) {
  // ---------- BACKGROUND PLACEHOLDER ----------
  // Same approach as HomeScreen: flat color for now, swap the outer
  // <View> for an <ImageBackground> once you have the art:
  //
  //   <ImageBackground
  //     source={require('../../assets/background.png')}
  //     style={styles.background}
  //     resizeMode="cover"
  //   >
  //     ...same children...
  //   </ImageBackground>

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

        {/* ---------- CHARACTER PLACEHOLDER ---------- */}
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
            onPress={onSelectStoryMode}
            backgroundImage={require("../assets/Final/buttons/buttonStorymode.png")}
          />
          <AppButton
            onPress={onSelectRushHour}
            style={styles.buttonSpacing}
            backgroundImage={require("../assets/Final/buttons/buttonRushHourmode.png")}
          />
          <AppButton
            onPress={onBack}
            style={styles.buttonSpacing}
            backgroundImage={require("../assets/Final/buttons/buttonBack.png")}
          />
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // BACKGROUND PLACEHOLDER COLOR — same as HomeScreen, replace together
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
