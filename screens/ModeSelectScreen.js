import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
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
    <View style={styles.background}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* ---------- TITLE / LOGO PLACEHOLDER ---------- */}
        {/* Same placeholder pattern as HomeScreen. Later swap for:
            <Image source={require('../../assets/title.png')} style={styles.titleImage} resizeMode="contain" />
        */}
        <View style={styles.titlePlaceholder}>
          <Text style={styles.titlePlaceholderText}>
            TITLE / LOGO{"\n"}PLACEHOLDER
          </Text>
        </View>

        {/* ---------- MENU BUTTONS ---------- */}
        <View style={styles.menu}>
          <AppButton
            label="Story-Mode"
            onPress={onSelectStoryMode}
            // Later: backgroundImage={require('../../assets/buttons/story-mode.png')}
          />
          <AppButton
            label={"Rush Hour\nMode"}
            onPress={onSelectRushHour}
            style={styles.buttonSpacing}
            multiline
            // Later: backgroundImage={require('../../assets/buttons/rush-hour.png')}
          />
          <AppButton
            label="Back"
            onPress={onBack}
            style={styles.buttonSpacing}
            // Later: backgroundImage={require('../../assets/buttons/back.png')}
          />
        </View>
      </View>
    </View>
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  titlePlaceholder: {
    width: "70%",
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60,
  },
  titlePlaceholderText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 14,
  },
  menu: {
    alignItems: "center",
  },
  buttonSpacing: {
    marginTop: 20,
  },
});
