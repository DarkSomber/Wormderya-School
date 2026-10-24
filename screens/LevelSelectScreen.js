import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Image,
  Animated,
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
import DebugButton from "../components/tests/DebugButton"; // [TEST/DEBUG]
import audio from "../audio/AudioManager";
/* global __DEV__ */

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
    scale: 1.3, // wide art renders shorter; enlarge to close the gap
  },
  {
    id: 4,
    image: require("../assets/Final/levels/Level_4_Boss_kare-kare.png"),
    scale: 1.3,
  },
];

const IMAGE_WIDTH_RATIO = 0.7;
const IMAGE_HEIGHT_RATIO = 0.38;
const BOTTOM_OFFSET_RATIO = 0.1;
const IMAGE_DROP_RATIO = 0.03;

// DEBUG BUTTON TOGGLE
const ENABLE_DEBUG_BUTTON = true;

// [TEST/DEBUG]
const DEBUG_TOP_RATIO = 0.17;

const SHOW_DEBUG_BUTTON = ENABLE_DEBUG_BUTTON && __DEV__;

// One full pass of levels/LevelSelectionMainBGAnim.gif (sum of its 65 frame delays).
const BG_GIF_LOOP_MS = 16760;
// Rest time with only the static background showing, then the GIF replays.
const BG_GIF_PAUSE_MS = 5000;
const BG_GIF_FADE_MS = 300;

// The scene is drawn on this canvas (art size), then scaled to cover the screen.
const SCENE_W = 512;
const SCENE_H = 1088;
const ROOF_H = 280; // levels/Bubong.png, pinned to the top
const TABLE_H = 352; // levels/table.png, pinned to the bottom
const BG_GIF_SCALE = 1; // GIF shares the static BG's 512x1088 canvas
const BG_GIF_SHIFT_Y = 0;

function AnimatedBackdrop({ sceneWidth, sceneHeight }) {
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
        }}
        resizeMode="stretch"
      />
      <Image
        source={require("../assets/Final/levels/table.png")}
        style={{
          position: "absolute",
          bottom: -50,
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
        <AnimatedBackdrop sceneWidth={w} sceneHeight={h} />
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
function TempLevelIndicator({ index, total }) {
  const level = LEVELS[index];
  return (
    <View style={styles.tempIndicatorWrap} pointerEvents="none">
      <View style={styles.tempIndicatorBadge}>
        <Text style={styles.tempIndicatorText}>LEVEL {level.id}</Text>
      </View>
      <View style={styles.tempDotsRow}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[styles.tempDot, i === index && styles.tempDotActive]}
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
  initialLevelId = 1, // the carousel opens on this level
  onDebugToggle, // [TEST/DEBUG]
  onDebugResetSave, // [TEST/DEBUG]
  debugAllUnlocked = false, // [TEST/DEBUG]
}) {
  const { width, height } = useWindowDimensions();

  const pageWidth = width;
  const imageWidth = Math.round(width * IMAGE_WIDTH_RATIO);
  const imageHeight = Math.round(height * IMAGE_HEIGHT_RATIO);
  const imageDrop = Math.round(height * IMAGE_DROP_RATIO);

  const backSize = Math.round(Math.min(width * 0.65, 56));
  const topInset =
    (Platform.OS === "android" ? (StatusBar.currentHeight ?? 24) : 44) + 8;

  const debugTop = Math.round(height * DEBUG_TOP_RATIO);

  const scrollRef = useRef(null);

  // Open on initialLevelId when it is a real, unlocked level; otherwise level 1.
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

      {/* Background pieces: GIF plays behind the roof and the table. */}
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
            bottom: Math.round(height * BOTTOM_OFFSET_RATIO),
          },
        ]}
      >
        {/* [TEMP] selected-level indicator, sits right above the carousel */}
        <TempLevelIndicator index={selectedIndex} total={LEVELS.length} />

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
              // Android ignores contentOffset, so jump there once content is laid out.
              if (didInitialScroll.current) return;
              didInitialScroll.current = true;
              if (startIndex > 0) {
                scrollRef.current?.scrollTo({ x: startIndex * pageWidth, animated: false });
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

      {/* [TEST/DEBUG] */}
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
    </View >
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
    top: 565,
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
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 2,
    borderColor: "#ffebbd",
  },
  tempIndicatorText: {
    color: "#ffebbd",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tempDotsRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  tempDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  tempDotActive: {
    backgroundColor: "#ffebbd",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.55)",
  },

  // [TEST/DEBUG]
  debugWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    marginTop: 40,
    alignItems: "center",
    zIndex: 20,
  },
});