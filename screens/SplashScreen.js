import React from "react";
import { ImageBackground, StyleSheet, StatusBar } from "react-native";

// Display only. App.js decides when loading is done and leaves this screen.
export default function SplashScreen() {
  return (
    <ImageBackground
      source={require("../assets/Final/Animations/SplashScreenAnimated.gif")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />
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
});