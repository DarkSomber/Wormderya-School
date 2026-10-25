import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Animated,
  Easing,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import SpeechBubble from "./SpeechBubble";
import GameplayTutorial from "./GameplayTutorial";
import audio from "../audio/AudioManager";
const GRANNY = require("../assets/Final/GrannyWorm.png");
const LINES = ["Tutorial..?", "Apo..."];

const IDLE_MS = 10000;
const COOLDOWN_MS = 2500;
let cooldownUntil = 0; 
const EASE = Easing.inOut(Easing.sin);

const INTRO_LINE = "Bago ang lahat tutorial muna apo.";
const SIZE = 150;
const HOPS = 5;
const STEPS_N = 40;
const T = Array.from({ length: STEPS_N + 1 }, (_, i) => i / STEPS_N);
const HOP_Y = T.map((t) => -22 * Math.abs(Math.sin(Math.PI * HOPS * t)) * (1 - 0.5 * t));
const HOP_ROT = T.map((t) => `${5 * Math.sin(Math.PI * HOPS * t)}deg`);

// Granny peeking from the corner; tap opens the tutorial.
export default function GrannyTutorial({ onClose, style, intro }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState(null); // null | "walk" | "talk"
  const [box, setBox] = useState({ w: 0, h: 0 });
  const talkTimer = useRef(null);
  const walk = useRef(new Animated.Value(0)).current;
  const talkFade = useRef(new Animated.Value(0)).current;
  const [line, setLine] = useState(0);
  const [cooling, setCooling] = useState(Date.now() < cooldownUntil);
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!cooling) return undefined;
    const t = setTimeout(
      () => setCooling(false),
      Math.max(0, cooldownUntil - Date.now()),
    );
    return () => clearTimeout(t);
  }, [cooling]);

  // New player pressed Play: Granny hops to the center, then opens the tutorial.
  useEffect(() => {
    if (intro && !open && !phase && box.w > 0) setPhase("walk");
  }, [intro, open, phase, box.w]);

  useEffect(() => {
    if (phase !== "walk") return undefined;
    walk.setValue(0);
    talkFade.setValue(0);
    Animated.timing(walk, {
      toValue: 1,
      duration: 1800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      setPhase("talk");
      Animated.timing(talkFade, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      talkTimer.current = setTimeout(() => {
        setPhase(null);
        setOpen(true);
      }, 2600);
    });
    return () => walk.stopAnimation();
  }, [phase === "walk"]);

  useEffect(() => () => clearTimeout(talkTimer.current), []);

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

  const handleClose = () => {
    cooldownUntil = Date.now() + COOLDOWN_MS;
    setCooling(true);
    setOpen(false);
    onClose?.();
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
      }}
    >
      {!open && !phase && (
        <View style={[StyleSheet.absoluteFill, style]} pointerEvents="box-none">
          <SpeechBubble
            text={LINES[line]}
            width={110}
            height={34}
            style={styles.bubble}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={cooling}
            style={[styles.granny, cooling && { opacity: 0.5 }]}
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
      {phase && (
        <View style={StyleSheet.absoluteFill} pointerEvents="auto">
          <Animated.Image
            source={GRANNY}
            resizeMode="contain"
            style={{
              position: "absolute",
              width: SIZE,
              height: SIZE,
              left: box.w / 2 - SIZE / 2,
              top: box.h / 2 - SIZE / 2,
              transform: [
                {
                  translateX: walk.interpolate({
                    inputRange: [0, 1],
                    outputRange: [box.w / 2 - 40, 0],
                  }),
                },
                {
                  translateY: Animated.add(
                    walk.interpolate({
                      inputRange: [0, 1],
                      outputRange: [box.h / 2 - 70, 0],
                    }),
                    walk.interpolate({ inputRange: T, outputRange: HOP_Y }),
                  ),
                },
                { rotate: walk.interpolate({ inputRange: T, outputRange: HOP_ROT }) },
              ],
            }}
          />
          {phase === "talk" && (
            <Animated.View
              style={{
                position: "absolute",
                left: (box.w - Math.min(box.w - 40, 300)) / 2,
                top: box.h / 2 - SIZE / 2 - 48,
                opacity: talkFade,
              }}
            >
              <SpeechBubble
                text={INTRO_LINE}
                width={Math.min(box.w - 40, 300)}
                height={40}
              />
            </Animated.View>
          )}
        </View>
      )}
      {open && <GameplayTutorial onClose={handleClose} />}
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
});