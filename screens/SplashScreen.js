import React, { useEffect } from "react";
import { ImageBackground, StyleSheet, StatusBar } from "react-native";

/**
 * SplashScreen
 * ----------------------------------------------------------------------
 * Shown once when the app first launches, before the title screen.
 * The artwork here is a full illustrated screen (already shaped close
 * to a phone's aspect ratio), so it just fills the screen and waits a
 * moment, then calls `onFinish` to move on to HomeScreen.
 *
 * Props:
 *   onFinish   function - called automatically after `duration` ms
 *   duration   ?number  - how long to show the splash, in ms (default 2500)
 * ----------------------------------------------------------------------
 */

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
    // Fallback color in case the image fails to load.
    backgroundColor: "#f3e6cf",
  },
});
