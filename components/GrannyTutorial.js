import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Text from "./AppText";
import SpeechBubble from "./SpeechBubble";
import audio from "../audio/AudioManager";

const GRANNY = require("../assets/Final/GrannyWorm.png");
const LINES = ["Tutorial..?", "Apo..."];

const TUTORIAL_SLIDES = [
  { id: "1", image: require("../assets/Final/Tutorial/Tutorial_2.png") },
  { id: "2", image: require("../assets/Final/Tutorial/Tutorial_3.png") },
  { id: "3", image: require("../assets/Final/Tutorial/Tutorial_4.png") },
  { id: "4", image: require("../assets/Final/Tutorial/Tutorial_5.png") },
  { id: "5", image: require("../assets/Final/Tutorial/Tutorial_6.png") },
  { id: "6", image: require("../assets/Final/Tutorial/Tutorial_7.png") },
  { id: "7", image: require("../assets/Final/Tutorial/Tutorial_8.png") },
  { id: "8", image: require("../assets/Final/Tutorial/Tutorial_9.png") },
  { id: "9", image: require("../assets/Final/Tutorial/Tutorial_10.png") },
  { id: "10", image: require("../assets/Final/Tutorial/Tutorial_11.png") },
  { id: "11", image: require("../assets/Final/Tutorial/Tutorial_12.png") },
  { id: "12", image: require("../assets/Final/Tutorial/Tutorial_13.png") },
];

const IDLE_MS = 10000;
const EASE = Easing.inOut(Easing.sin);

// Granny peeking from the corner; tap opens the tutorial slideshow.
export default function GrannyTutorial({ onClose, style }) {
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0);
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setInterval(() => setLine((n) => (n + 1) % LINES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Idle 10s, sway slowly for 4s (1s + 2s + 1s), repeat.
  useEffect(() => {
    if (open) return undefined;
    let timer;
    const run = () => {
      timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(sway, {
            toValue: 1,
            duration: 1000,
            easing: EASE,
            useNativeDriver: true,
          }),
          Animated.timing(sway, {
            toValue: -1,
            duration: 2000,
            easing: EASE,
            useNativeDriver: true,
          }),
          Animated.timing(sway, {
            toValue: 0,
            duration: 1000,
            easing: EASE,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => finished && run());
      }, IDLE_MS);
    };
    run();
    return () => {
      clearTimeout(timer);
      sway.stopAnimation();
      sway.setValue(0);
    };
  }, [open, sway]);

  const swayStyle = {
    transform: [
      {
        translateX: sway.interpolate({
          inputRange: [-1, 1],
          outputRange: [-10, 10],
        }),
      },
      {
        rotate: sway.interpolate({
          inputRange: [-1, 1],
          outputRange: ["-5deg", "5deg"],
        }),
      },
    ],
  };

  const [slide, setSlide] = useState(0);
  const isFirst = slide === 0;
  const isLast = slide === TUTORIAL_SLIDES.length - 1;

  // Back goes to the previous tutorial slide (same as SlideshowSequence).
  const handleBack = () => {
    audio.playSfx("click");
    setSlide((s) => Math.max(0, s - 1));
  };

  const handleNext = () => {
    audio.playSfx("click");
    if (isLast) {
      setOpen(false);
      setSlide(0);
      onClose?.();
    } else {
      setSlide((s) => s + 1);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {!open && (
        <View style={[StyleSheet.absoluteFill, style]} pointerEvents="box-none">
          <SpeechBubble
            text={LINES[line]}
            width={110}
            height={34}
            style={styles.bubble}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.granny}
            onPress={() => {
              audio.playSfx("click");
              setOpen(true);
            }}
          >
            <Animated.Image
              source={GRANNY}
              style={[styles.sprite, swayStyle]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      )}
      {open && (
        <View style={styles.viewer}>
          <View style={styles.card}>
            <Image
              source={TUTORIAL_SLIDES[slide].image}
              style={styles.slideImage}
              resizeMode="contain"
            />
          </View>
          <View style={styles.footer}>
            {isFirst ? (
              <View />
            ) : (
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.nextButton}
                onPress={handleBack}
              >
                <Text style={styles.nextText}>{"<-  Back"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>{isLast ? "Close" : "Next  ->"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  granny: {
    position: "absolute",
    right: -35,
    bottom: -25,
    width: 150,
    height: 150,
  },
  sprite: { width: "100%", height: "100%" },
  bubble: { position: "absolute", right: 40, bottom: 125 },
  tutorialFrame: {
    backgroundColor: "#f3e6cf",
    paddingHorizontal: 30,
    paddingVertical: 70,
  },
  viewer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f3e6cf",
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(255,255,255,0.4)",
    overflow: "hidden",
    marginBottom: 20,
  },
  slideImage: { width: "100%", height: "100%" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(245, 236, 214, 0.9)",
  },
  nextText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
    textAlign: "center",
  },
});