import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";

const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const WALK_OUT_MS = 280;
const WALK_IN_MS = 420;
const STEP_MS = 110; 
const SLIDE_DISTANCE = 300; 
const STEP_HEIGHT = 7; 
const JUMP_HEIGHT = 18; 
const IGNORE_JUMP_AFTER_MOUNT_MS = 400;
const PACE_DISTANCE = 16; 
const PACE_WALK_MS = 1500; 
const PACE_PAUSE_MS = 220; 
const PACE_TURN_MS = 320;
const PACE_BOB = 3; 
const PACE_BOB_MS = 170; 
const BOUNCE_HEIGHT = 22; 
const BOUNCE_UP_MS = 150;
const BOUNCE_DOWN_MS = 190;
const SHAKE_DISTANCE = 7; 
const SHAKE_STEP_MS = 55; 

const AnimatedNpc = forwardRef(function AnimatedNpc(
  { source, npcKey, unit = 1, worried = false, imageStyle, animatedGif = false, gifVisible = true, onGifLoad },
  ref,
) {
  const [shownSource, setShownSource] = useState(source);
  const slideX = useRef(new Animated.Value(0)).current;
  const jumpY = useRef(new Animated.Value(0)).current;
  const stepY = useRef(new Animated.Value(0)).current;
  const paceX = useRef(new Animated.Value(0)).current;
  const paceBob = useRef(new Animated.Value(0)).current;
  const paceFlip = useRef(new Animated.Value(1)).current; 
  const walkingRef = useRef(false);
  const prevKeyRef = useRef(npcKey);
  const mountedAtRef = useRef(Date.now());
  const jumpTimerRef = useRef(null);
  const reactX = useRef(new Animated.Value(0)).current; 
  const reactY = useRef(new Animated.Value(0)).current;
  const reactAnimRef = useRef(null);

  const stopReaction = () => {
    reactAnimRef.current?.stop();
    reactAnimRef.current = null;
    reactX.setValue(0);
    reactY.setValue(0);
  };

  useEffect(() => {
    if (npcKey === prevKeyRef.current) return undefined;
    prevKeyRef.current = npcKey;

    walkingRef.current = true;
    const distance = SLIDE_DISTANCE * unit;
    const hop = STEP_HEIGHT * unit;

    stepY.setValue(0);
    const steps = Animated.loop(
      Animated.sequence([
        Animated.timing(stepY, {
          toValue: -hop,
          duration: STEP_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(stepY, {
          toValue: 0,
          duration: STEP_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    steps.start();

    let cancelled = false;
    Animated.timing(slideX, {
      toValue: -distance,
      duration: WALK_OUT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || cancelled) return;
      setShownSource(source);
      Animated.timing(slideX, {
        toValue: 0,
        duration: WALK_IN_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished: arrived }) => {
        if (!arrived || cancelled) return;
        steps.stop();
        stepY.setValue(0);
        walkingRef.current = false;
      });
    });

    return () => {
      cancelled = true;
      steps.stop();
      slideX.stopAnimation();
      stepY.setValue(0);
      walkingRef.current = false;
    };
  }, [npcKey]);

  useEffect(() => {
    if (!worried) return undefined;
    paceX.setValue(0);
    paceFlip.setValue(1);
    paceBob.setValue(0);
    const d = -PACE_DISTANCE * unit; 
    const bob = PACE_BOB * unit;
    const t = (v, toValue, duration, easing) =>
      Animated.timing(v, { toValue, duration, easing, useNativeDriver: true });
    const walk = (toX, ms = PACE_WALK_MS) =>
      Animated.parallel([
        t(paceX, toX, ms, Easing.inOut(Easing.sin)),
        Animated.loop(
          Animated.sequence([
            t(paceBob, -bob, PACE_BOB_MS, Easing.out(Easing.quad)),
            t(paceBob, 0, PACE_BOB_MS, Easing.in(Easing.quad)),
          ]),
          { iterations: Math.round(ms / (PACE_BOB_MS * 2)) },
        ),
      ]);
    const turn = (to) =>
      Animated.sequence([
        Animated.delay(PACE_PAUSE_MS),
        t(paceFlip, to, PACE_TURN_MS, Easing.inOut(Easing.quad)),
        Animated.delay(PACE_PAUSE_MS / 2),
      ]);
    const loop = Animated.loop(
      Animated.sequence([
        walk(d),
        turn(-1),
        walk(-d, PACE_WALK_MS * 2),
        turn(1),
        walk(0),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      Animated.parallel([
        t(paceX, 0, 150, Easing.out(Easing.quad)),
        t(paceFlip, 1, 150, Easing.out(Easing.quad)),
        t(paceBob, 0, 150, Easing.out(Easing.quad)),
      ]).start();
    };
  }, [worried, unit, paceX, paceFlip, paceBob]);

  useEffect(() => {
    if (!walkingRef.current) setShownSource(source);
  }, [source]);

  useImperativeHandle(ref, () => ({
    bounce: (times = 3) => {
      stopReaction();
      const hop = Animated.sequence([
        Animated.timing(reactY, {
          toValue: -BOUNCE_HEIGHT * unit,
          duration: BOUNCE_UP_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(reactY, {
          toValue: 0,
          duration: BOUNCE_DOWN_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]);
      reactAnimRef.current = Animated.loop(hop, { iterations: times });
      reactAnimRef.current.start();
    },
    shake: (durationMs = 2000) => {
      stopReaction();
      const d = SHAKE_DISTANCE * unit;
      const step = (toValue, mult = 1) =>
        Animated.timing(reactX, {
          toValue,
          duration: SHAKE_STEP_MS * mult,
          easing: Easing.linear,
          useNativeDriver: true,
        });
      const wiggle = Animated.sequence([step(d), step(-d, 2), step(0)]);
      const anim = Animated.loop(wiggle, {
        iterations: Math.max(1, Math.round(durationMs / (SHAKE_STEP_MS * 4))),
      });
      reactAnimRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) reactX.setValue(0);
      });
    },
    jump: () => {
      clearTimeout(jumpTimerRef.current);
      jumpTimerRef.current = setTimeout(() => {
        if (walkingRef.current) return;
        if (Date.now() - mountedAtRef.current < IGNORE_JUMP_AFTER_MOUNT_MS)
          return;
        jumpY.stopAnimation();
        jumpY.setValue(0);
        Animated.sequence([
          Animated.timing(jumpY, {
            toValue: -JUMP_HEIGHT * unit,
            duration: 110,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(jumpY, {
            toValue: 0,
            duration: 170,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
        ]).start();
      }, 0);
    },
  }));

  useEffect(() => () => {
    clearTimeout(jumpTimerRef.current);
    reactAnimRef.current?.stop();
  }, []);

  const motionStyle = {
    transformOrigin: "50% 100%", 
    transform: [
      { translateX: Animated.add(Animated.add(slideX, paceX), reactX) },
      { translateY: Animated.add(Animated.add(Animated.add(jumpY, stepY), paceBob), reactY) },
      { scaleX: paceFlip },
    ],
  };

  if (animatedGif) {
    const { resizeMode, ...flatStyle } = StyleSheet.flatten(imageStyle) || {};
    return (
      <AnimatedExpoImage
        source={shownSource}
        contentFit={resizeMode === "stretch" ? "fill" : resizeMode || "cover"}
        autoplay
        onLoad={onGifLoad}
        style={[flatStyle, motionStyle, { opacity: gifVisible ? 1 : 0 }]}
      />
    );
  }

  return <Animated.Image source={shownSource} style={[imageStyle, motionStyle]} />;
});

export default AnimatedNpc;