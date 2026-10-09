import React, { useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { hasLevelPreset } from "../levels/levelPresets";
import Text from "../components/AppText";
import DebugButton from "../components/tests/DebugButton"; // [TEST/DEBUG]

const isLevelLocked = (lvl, unlockedLevels, lockedLevels) =>
  !hasLevelPreset(lvl.id) ||
  lockedLevels.includes(lvl.id) ||
  !unlockedLevels.includes(lvl.id);

const LEVELS = [
  { id: 1, image: require("../assets/Final/levels/Level_1_Sinangag.png") },
  { id: 2, image: require("../assets/Final/levels/Level_2_Adobo.png") },
  { id: 3, image: require("../assets/Final/levels/Level_3_Sinigang-na-Bangus.png") },
  { id: 4, image: require("../assets/Final/levels/Level_4_Boss_kare-kare.png") },
];

const IMAGE_WIDTH_RATIO = 0.70;
const IMAGE_HEIGHT_RATIO = 0.38;
const BOTTOM_OFFSET_RATIO = 0.10;
const IMAGE_DROP_RATIO = 0.03;

// DEBUG BUTTON TOGGLE
const ENABLE_DEBUG_BUTTON = true;

// [TEST/DEBUG]
const DEBUG_TOP_RATIO = 0.17;

const SHOW_DEBUG_BUTTON = ENABLE_DEBUG_BUTTON && __DEV__;

function LevelImage({ level, locked, onPlay, width, height, drop }) {
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
      <Image source={level.image} style={styles.levelImage} resizeMode="contain" />
    </TouchableOpacity>
  );
}

// [TEMP] Shows which level is currently selected in the carousel.
const TEMP_INDICATOR_HEIGHT = 64; // space reserved above the carousel for the indicator
// Para sa mga arts (Level indicator badge: a small plaque/banner art that shows the
// level number, e.g. "LEVEL 1" - one version per level or a blank plaque we put the number on.
// Optional: active/inactive page-dot icons for the carousel position).
// When the art is ready, replace the body of this component with an <Image> and keep the same props.
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
    (Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 44) + 8;

  const debugTop = Math.round(height * DEBUG_TOP_RATIO);

  const scrollRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

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
    onSelectLevel && onSelectLevel(lvl.id);
  };

  return (
    <ImageBackground
      source={require("../assets/Final/LevelSelectionMainBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onBack}
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
    </ImageBackground>
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
    top: 560,
  },
  // Clips the scrolling pages; split from `carousel` so the indicator can sit above it
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

  // [TEMP] selected-level indicator (remove when art is added)
  tempIndicatorWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -TEMP_INDICATOR_HEIGHT,
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