import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { hasLevelPreset } from "../levels/levelPresets";
import Text from "../components/AppText";
import DebugButton from "../components/tests/DebugButton";
import audio from "../audio/AudioManager";

const isLevelLocked = (lvl, unlockedLevels, lockedLevels) =>
  !hasLevelPreset(lvl.id) ||
  lockedLevels.includes(lvl.id) ||
  !unlockedLevels.includes(lvl.id);

const LEVELS = [
  { id: 1, image: require("../assets/Final/levels/Level_1_Sinangag.png") },
  { id: 2, image: require("../assets/Final/levels/Level_2_Adobo.png") },
  {
    id: 3,
    image: require("../assets/Final/levels/Level_3_Sinigang-na-Bangus.png"),
    scale: 1.3,
  },
  {
    id: 4,
    image: require("../assets/Final/levels/Level_4_Boss_kare-kare.png"),
    scale: 1.3,
  },
];

const IMAGE_WIDTH_RATIO = 0.7;
const IMAGE_HEIGHT_RATIO = 0.38;
const CAROUSEL_TOP = 725;
const IMAGE_DROP_RATIO = 0.03;

const ENABLE_DEBUG_BUTTON = true;

const DEBUG_TOP_RATIO = 0.17;

const SHOW_DEBUG_BUTTON = ENABLE_DEBUG_BUTTON && __DEV__;

const BG_GIF_LOOP_MS = 16760;
const BG_GIF_PAUSE_MS = 5000;
const BG_GIF_FADE_MS = 300;

const SCENE_W = 512;
const SCENE_H = 1088;
const ROOF_H = 284;
const BOX_K = 0.8; // title box size (1 = original)
const BOX_CX = 260;
const BOX_CY = 154;
const pctX = (v) => `${(v / SCENE_W) * 100}%`;
const pctY = (v) => `${(v / SCENE_H) * 100}%`;
const TABLE_H = 352;
const BG_GIF_SCALE = 1;
const BG_GIF_SHIFT_Y = 0;

function AnimatedBackdrop({ sceneWidth, sceneHeight, scale }) {
  const [cycle, setCycle] = useState(0);
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let timer;
    if (visible) {
      opacity.setValue(1);
      timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: BG_GIF_FADE_MS,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) setVisible(false);
        });
      }, BG_GIF_LOOP_MS - BG_GIF_FADE_MS);
    } else {
      timer = setTimeout(() => {
        setCycle((c) => c + 1);
        setVisible(true);
      }, BG_GIF_PAUSE_MS);
    }
    return () => {
      clearTimeout(timer);
      opacity.stopAnimation();
    };
  }, [visible, opacity]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity }]}
        >
          <ExpoImage
            key={cycle}
            source={require("../assets/Final/levels/LevelSelectionMainBGAnim.gif")}
            autoplay
            transition={0}
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                width: sceneWidth,
                height: sceneHeight,
                transform: [
                  { translateY: BG_GIF_SHIFT_Y * sceneHeight },
                  { scale: BG_GIF_SCALE },
                ],
              },
            ]}
            contentFit="fill"
          />
        </Animated.View>
      )}
      <Image
        source={require("../assets/Final/levels/Bubong.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${(ROOF_H / SCENE_H) * 100}%`,
          zIndex: 1,
        }}
        resizeMode="stretch"
      />
      <Image
        source={require("../assets/Final/levels/TextBox.png")}
        style={{
          position: "absolute",
          left: pctX(BOX_CX - (336 * BOX_K) / 2),
          top: pctY(BOX_CY - (116 * BOX_K) / 2),
          width: pctX(336 * BOX_K),
          height: pctY(116 * BOX_K),
          zIndex: 2,
        }}
        resizeMode="stretch"
      />
      <View
        style={{
          position: "absolute",
          left: pctX(BOX_CX - (328 * BOX_K) / 2),
          top: pctY(BOX_CY - (108 * BOX_K) / 2),
          width: pctX(328 * BOX_K),
          height: pctY(108 * BOX_K),
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            width: "100%",
            fontSize: 34 * scale * BOX_K,
            fontWeight: "bold",
            color: "#5A1010",
            textAlign: "center",
            includeFontPadding: false,
          }}
        >
          Level Selection
        </Text>
      </View>
      <Image
        source={require("../assets/Final/levels/table.png")}
        style={{
          position: "absolute",
          bottom: -50 * scale,
          left: 0,
          width: "100%",
          height: `${(TABLE_H / SCENE_H) * 120}%`,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}

function LevelSelectScene({ width, height }) {
  const k = width / SCENE_W;
  const w = width;
  const h = Math.max(SCENE_H * k, height);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={{
          position: "absolute",
          width: w,
          height: h,
          left: (width - w) / 2,
          top: (height - h) / 2,
        }}
      >
        <Image
          source={require("../assets/Final/LevelSelectionMainBG.png")}
          style={{ position: "absolute", top: 0, left: 0, width: w, height: h }}
          resizeMode="stretch"
        />
        <AnimatedBackdrop sceneWidth={w} sceneHeight={h} scale={k} />
      </View>
    </View>
  );
}

const fittedHeight = (img, width, height) => {
  const src = Image.resolveAssetSource(img);
  return Math.min(height, (width * src.height) / src.width);
};

function LevelImage({ level, locked, onPlay, width, height, drop }) {
  const scale = level.scale ?? 1;
  const refH = fittedHeight(LEVELS[0].image, width, height);
  const ownH = fittedHeight(level.image, width, height);
  const lift = (refH - ownH * scale) / 2;
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={locked}
      onPress={onPlay}
      style={{
        width,
        height,
        opacity: locked ? 0.5 : 1,
        transform: [{ translateY: drop }],
      }}
    >
      <Image
        source={level.image}
        style={[
          styles.levelImage,
          { transform: [{ translateY: lift }, { scale }] },
        ]}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
}

const TEMP_INDICATOR_HEIGHT = 64;
const BADGE_W = 130;
const BADGE_H = Math.round((BADGE_W * 116) / 336);

// Unlocked dots are lit; the newest unlocked one pulses.
function IndicatorDot({ lit, active, pulse }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!pulse) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(p, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      p.setValue(0);
    };
  }, [pulse, p]);

  return (
    <View style={styles.dotSlot}>
      {pulse && (
        <Animated.View
          style={[
            styles.dotHalo,
            {
              opacity: p.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
              transform: [
                { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) },
              ],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.tempDot,
          lit && styles.tempDotLit,
          active && styles.tempDotActive,
        ]}
      />
    </View>
  );
}

function TempLevelIndicator({ index, total, unlocked }) {
  const level = LEVELS[index];
  const newest = unlocked.lastIndexOf(true);
  return (
    <View style={styles.tempIndicatorWrap} pointerEvents="none">
      <ImageBackground
        source={require("../assets/Final/levels/TextBox.png")}
        style={styles.tempIndicatorBadge}
        resizeMode="stretch"
      >
        <Text style={styles.tempIndicatorText}>LEVEL {level.id}</Text>
      </ImageBackground>
      <View style={styles.tempDotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <IndicatorDot
            key={i}
            lit={unlocked[i]}
            active={i === index}
            pulse={i === newest && i > 0}
          />
        ))}
      </View>
    </View>
  );
}

export default function LevelSelectScreen({
  onSelectLevel,
  onBack,
  unlockedLevels = [1],
  lockedLevels = [],
  initialLevelId = 1,
  onDebugToggle,
  onDebugResetSave,
  debugAllUnlocked = false,
}) {
  const { width, height } = useWindowDimensions();

  const k = width / SCENE_W;
  const sceneH = Math.max(SCENE_H * k, height);
  const sceneTop = (height - sceneH) / 2;

  const pageWidth = width;
  const imageWidth = Math.round(width * IMAGE_WIDTH_RATIO);
  const imageHeight = Math.round(sceneH * IMAGE_HEIGHT_RATIO);
  const imageDrop = Math.round(sceneH * IMAGE_DROP_RATIO);
  const carouselTop = Math.round(
    sceneTop + (CAROUSEL_TOP / SCENE_H) * sceneH
  );

  const backSize = Math.round(Math.min(width * 0.65, 56));
  const topInset =
    (Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44) + 8;

  const debugTop = Math.round(height * DEBUG_TOP_RATIO);

  const scrollRef = useRef(null);

  const startIndex = (() => {
    const i = LEVELS.findIndex((l) => l.id === initialLevelId);
    if (i < 0) return 0;
    return isLevelLocked(LEVELS[i], unlockedLevels, lockedLevels) ? 0 : i;
  })();
  const [selectedIndex, setSelectedIndex] = useState(startIndex);
  const didInitialScroll = useRef(false);

  const snapOffsets = LEVELS.map((_, i) => i * pageWidth);

  const indexFromOffset = (x) =>
    Math.min(LEVELS.length - 1, Math.max(0, Math.round(x / pageWidth)));

  const handleMomentumEnd = (e) => {
    setSelectedIndex(indexFromOffset(e.nativeEvent.contentOffset.x));
  };

  const handleDragEnd = (e) => {
    const { contentOffset, velocity } = e.nativeEvent;
    const vx = velocity ? Math.abs(velocity.y ?? velocity.x) : 0;
    if (vx < 0.1) {
      const i = indexFromOffset(contentOffset.x);
      setSelectedIndex(i);
      scrollRef.current?.scrollTo({ x: i * pageWidth, animated: true });
    }
  };

  const playLevel = (lvl) => {
    if (isLevelLocked(lvl, unlockedLevels, lockedLevels)) return;
    audio.playSfx("click");
    onSelectLevel && onSelectLevel(lvl.id);
  };

  return (
    <View style={styles.background}>
      <StatusBar barStyle="dark-content" />

      <LevelSelectScene width={width} height={height} />

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          audio.playSfx("click");
          onBack && onBack();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={[styles.backButton, { top: topInset, left: width * 0.04 }]}
      >
        <Image
          source={require("../assets/Final/buttons/buttonLevelSelectBack.png")}
          style={{ width: backSize, height: backSize }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <View
        style={[
          styles.carousel,
          {
            height: imageHeight,
            top: carouselTop,
          },
        ]}
      >
        <TempLevelIndicator
          index={selectedIndex}
          total={LEVELS.length}
          unlocked={LEVELS.map(
            (l) => !isLevelLocked(l, unlockedLevels, lockedLevels),
          )}
        />

        <View style={styles.carouselClip}>
          <ScrollView
            ref={scrollRef}
            style={{ width: pageWidth, height: imageHeight }}
            contentContainerStyle={{ alignItems: "center" }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            horizontal
            bounces={false}
            overScrollMode="never"
            nestedScrollEnabled
            contentOffset={{ x: startIndex * pageWidth, y: 0 }}
            onContentSizeChange={() => {
              if (didInitialScroll.current) return;
              didInitialScroll.current = true;
              if (startIndex > 0) {
                scrollRef.current?.scrollTo({
                  x: startIndex * pageWidth,
                  animated: false,
                });
              }
            }}
            snapToOffsets={snapOffsets}
            snapToEnd={false}
            decelerationRate="fast"
            disableIntervalMomentum
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleMomentumEnd}
            onScrollEndDrag={handleDragEnd}
          >
            {LEVELS.map((lvl) => (
              <View
                key={lvl.id}
                style={[styles.page, { width: pageWidth, height: imageHeight }]}
              >
                <LevelImage
                  level={lvl}
                  locked={isLevelLocked(lvl, unlockedLevels, lockedLevels)}
                  onPlay={() => playLevel(lvl)}
                  width={imageWidth}
                  height={imageHeight}
                  drop={imageDrop}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {SHOW_DEBUG_BUTTON && onDebugToggle && (
        <View
          style={[styles.debugWrap, { top: debugTop }]}
          pointerEvents="box-none"
        >
          <DebugButton
            allUnlocked={debugAllUnlocked}
            onPress={onDebugToggle}
            onResetSave={onDebugResetSave}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#ffebbd",
    overflow: "hidden",
  },

  backButton: { position: "absolute", zIndex: 10 },

  carousel: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  carouselClip: {
    flex: 1,
    overflow: "hidden",
  },
  page: {
    alignItems: "center",
    justifyContent: "center",
  },

  levelImage: {
    width: "100%",
    height: "100%",
  },

  tempIndicatorWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -TEMP_INDICATOR_HEIGHT - 25,
    height: TEMP_INDICATOR_HEIGHT,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 5,
  },
  tempIndicatorBadge: {
    width: BADGE_W,
    height: BADGE_H,
    alignItems: "center",
    justifyContent: "center",
  },
  tempIndicatorText: {
    color: "#5A1010",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
  },
  tempDotsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  dotSlot: {
    width: 18,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dotHalo: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffebbd",
  },
  tempDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tempDotLit: {
    backgroundColor: "#ffebbd",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.55)",
  },
  tempDotActive: {
    transform: [{ scale: 1.35 }],
    borderWidth: 2,
    borderColor: "#5A1010",
  },

  debugWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    marginTop: 40,
    alignItems: "center",
    zIndex: 20,
  },
});