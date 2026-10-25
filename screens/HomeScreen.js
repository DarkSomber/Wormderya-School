import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Alert,
  Image,
  ImageBackground,
  Animated,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import AppButton from "../components/AppButton";
import GrannyTutorial from "../components/GrannyTutorial";

const WORM_GIF_LOOP_MS = 8130;
const WORM_GIF_PAUSE_MS = 5000;

const WORM_FADE_MS = 300;

export function AnimatedWorm() {
  const [cycle, setCycle] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const fadeInRef = useRef(() => {});
  const spriteOpacity = opacity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  useEffect(() => {
    let started = false;
    const fadeIn = () => {
      if (started) return;
      started = true;
      opacity.setValue(1);
    };
    opacity.setValue(0);
    const fallback = setTimeout(fadeIn, 400);
    const fadeOut = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: WORM_FADE_MS,
        useNativeDriver: true,
      }).start();
    }, WORM_GIF_LOOP_MS - WORM_FADE_MS);
    const next = setTimeout(
      () => setCycle((c) => c + 1),
      WORM_GIF_LOOP_MS + WORM_GIF_PAUSE_MS
    );
    fadeInRef.current = fadeIn;
    return () => {
      clearTimeout(fallback);
      clearTimeout(fadeOut);
      clearTimeout(next);
      opacity.stopAnimation();
    };
  }, [cycle, opacity]);

  return (
    <View style={styles.characterImage}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: spriteOpacity }]}
      >
        <ExpoImage
          source={require("../assets/Final/MainCharacter.png")}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={0}
        />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity }]}
      >
        <ExpoImage
          key={cycle}
          source={require("../assets/Final/MainCharacterMenuAnim.gif")}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={0}
          autoplay
          onLoad={() => fadeInRef.current()}
        />
      </Animated.View>
    </View>
  );
}

export default function HomeScreen({
  onStart,
  onOpenSettings,
  onQuit,
  showGranny,
  onGrannySeen,
}) {
  const [grannyIntro, setGrannyIntro] = useState(false);
  const handleStart = onStart ?? (() => Alert.alert("Start pressed"));
  const handlePlay = () => {
    if (showGranny) setGrannyIntro(true); // new player: tutorial first
    else handleStart();
  };
  const handleSettings =
    onOpenSettings ?? (() => Alert.alert("Settings pressed"));
  const handleQuit = onQuit ?? (() => Alert.alert("Quit pressed"));

  {
  }
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
            onPress={grannyIntro ? undefined : handlePlay}
            label="START"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
          <AppButton
            onPress={handleSettings}
            style={styles.buttonSpacing}
            label="SETTINGS"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
          <AppButton
            onPress={handleQuit}
            style={styles.buttonSpacing}
            label="QUIT"
            backgroundImage={require("../assets/Final/buttons/button.png")}
          />
        </View>
      </View>
      {showGranny && (
        <GrannyTutorial
          intro={grannyIntro}
          onClose={() => {
            if (grannyIntro) handleStart();
            else onGrannySeen?.();
          }}
          style={{ bottom: 20 }}
        />
      )}
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
  characterImage: {
    width: 256,
    height: 256,
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