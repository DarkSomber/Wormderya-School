import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import { Image } from "expo-image";

export default function SplashScreen() {
  return (
    <View style={styles.background}>
      <Image
        source={require("../assets/Final/Animations/SplashScreenAnimated.gif")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        autoplay
      />
      <StatusBar barStyle="dark-content" />
    </View>
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
