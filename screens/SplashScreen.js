import React, { useEffect } from "react";
import { ImageBackground, StyleSheet, StatusBar } from "react-native";

const DEFAULT_DURATION_MS = 2500;

export default function SplashScreen({
  onFinish,
  duration = DEFAULT_DURATION_MS,
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish && onFinish();
    }, duration);

    // Clean up if the component unmounts early (e.g. fast reloads).
    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  return (
    <ImageBackground
      // Later: swap for your final splash art if this changes.
      source={require("../assets/Final/SplashScreen.png")}
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
