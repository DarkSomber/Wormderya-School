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

// expo-image plays animated GIFs on its own; React Native's Image does not on some builds.
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

// Timings (ms) and sizes. Distances are multiplied by `unit` (the stage scale),
// so the motion looks the same on every screen size.
const WALK_OUT_MS = 280;
const WALK_IN_MS = 420;
const STEP_MS = 110; // one half of a walking hop
const SLIDE_DISTANCE = 300; // art units, enough to leave / enter the screen
const STEP_HEIGHT = 7; // art units, small hop while walking
const JUMP_HEIGHT = 18; // art units, hop when the patience face changes
const IGNORE_JUMP_AFTER_MOUNT_MS = 400;
const SWAY_MS = 380; // time for each swing of the worried sway
const SWAY_DISTANCE = 5; // art units, left / right
const SWAY_DEGREES = 4; // lean left / right


const AnimatedNpc = forwardRef(function AnimatedNpc(
  { source, npcKey, unit = 1, worried = false, imageStyle, animatedGif = false },
  ref,
) {
  const [shownSource, setShownSource] = useState(source);
  const slideX = useRef(new Animated.Value(0)).current;
  const jumpY = useRef(new Animated.Value(0)).current;
  const stepY = useRef(new Animated.Value(0)).current;
  const swayV = useRef(new Animated.Value(0)).current; // -1 (left) .. 1 (right)
  const walkingRef = useRef(false);
  const prevKeyRef = useRef(npcKey);
  const mountedAtRef = useRef(Date.now());
  const jumpTimerRef = useRef(null);

  // Walk out, swap the sprite, walk in. Cleanup stops everything, so a quick
  // second change or leaving the screen can never leave a stuck animation.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npcKey]);

  // Worried sway: a smooth left-right loop that runs while `worried` is true.
  useEffect(() => {
    if (!worried) return undefined;
    swayV.setValue(0);
    const swing = (toValue, duration) =>
      Animated.timing(swayV, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      Animated.sequence([
        swing(1, SWAY_MS),
        swing(-1, SWAY_MS * 2),
        swing(0, SWAY_MS),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      swing(0, 150).start(); // ease back to upright
    };
  }, [worried, swayV]);

  const swayX = useMemo(
    () =>
      swayV.interpolate({
        inputRange: [-1, 1],
        outputRange: [-SWAY_DISTANCE * unit, SWAY_DISTANCE * unit],
      }),
    [swayV, unit],
  );
  const swayRotate = useMemo(
    () =>
      swayV.interpolate({
        inputRange: [-1, 1],
        outputRange: [`-${SWAY_DEGREES}deg`, `${SWAY_DEGREES}deg`],
      }),
    [swayV],
  );

  // Keep the sprite in sync if `source` changes without a new customer.
  useEffect(() => {
    if (!walkingRef.current) setShownSource(source);
  }, [source]);

  useImperativeHandle(ref, () => ({
    jump: () => {
      // Checked on the next tick: a new customer's first patience report
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

  useEffect(() => () => clearTimeout(jumpTimerRef.current), []);

  const motionStyle = {
    transformOrigin: "50% 100%", // lean from the feet
    transform: [
      { translateX: Animated.add(slideX, swayX) },
      { translateY: Animated.add(jumpY, stepY) },
      { rotate: swayRotate },
    ],
  };

  if (animatedGif) {
    // expo-image has no style.resizeMode; "stretch" is contentFit "fill".
    const { resizeMode, ...flatStyle } = StyleSheet.flatten(imageStyle) || {};
    return (
      <AnimatedExpoImage
        source={shownSource}
        contentFit={resizeMode === "stretch" ? "fill" : resizeMode || "cover"}
        autoplay
        style={[flatStyle, motionStyle]}
      />
    );
  }

  return <Animated.Image source={shownSource} style={[imageStyle, motionStyle]} />;
});

export default AnimatedNpc;