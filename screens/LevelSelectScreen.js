import React from "react";
import {
  View,
  Image,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import Text from "../components/AppText";
import LevelButton from "../components/LevelButton";
import { hasLevelPreset } from "../levels/levelPresets";
import DebugButton from "../components/tests/DebugButton"; // [TEST/DEBUG]

// Playable = has a preset AND is in `unlockedLevels` (owned by App).
// `lockedLevels` force-locks a level.
const isLevelLocked = (lvl, unlockedLevels, lockedLevels) =>
  !hasLevelPreset(lvl.id) ||
  lockedLevels.includes(lvl.id) ||
  !unlockedLevels.includes(lvl.id);

// One entry per level; `align` sets the side of the screen.
const LEVELS = [
  {
    id: 1,
    align: "flex-start",
    size: 230,
    image: require("../assets/Final/levels/Level_1_Sinangag.png"),
  },
  {
    id: 2,
    align: "flex-end",
    size: 230,
    image: require("../assets/Final/levels/Level_2_Adobo.png"),
  },
  {
    id: 3,
    align: "flex-start",
    size: 300,
    image: require("../assets/Final/levels/Level_3_Sinigang-na-Bangus.png"),
  },
  {
    id: 4,
    align: "flex-end",
    size: 325,
    image: require("../assets/Final/levels/Level_4_Boss_kare-kare.png"),
  }, // e.g. a bigger "boss" node
];

const NODE_SPACING = 50;

export default function LevelSelectScreen({
  onSelectLevel,
  onBack,
  unlockedLevels = [1],
  lockedLevels = [],
  onDebugToggle, // [TEST/DEBUG] button shows only when provided
  debugAllUnlocked = false, // [TEST/DEBUG]
}) {
  return (
    <ImageBackground
      source={require("../assets/Final/LevelSelectionMainBG.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      {/* ---------- TOP BAR: back button + title pill ---------- */}
      <View style={styles.topBar}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onBack}
          style={styles.titlePill}
        >
          <Image
            source={require("../assets/Final/buttons/buttonLevelSelectBack.png")}
          />
        </TouchableOpacity>

        {/* Spacer so the title pill stays visually centered against the back button */}
        <View />
      </View>

      {/* ---------- SCROLLABLE LEVEL ROW ---------- */}
      <View style={styles.rowWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.rowContent}
        >
          {LEVELS.map((lvl) => (
            <LevelButton
              key={lvl.id}
              width={lvl.width ?? lvl.size}
              height={lvl.height ?? lvl.size}
              locked={isLevelLocked(lvl, unlockedLevels, lockedLevels)}
              onPress={() => onSelectLevel && onSelectLevel(lvl.id)}
              backgroundImage={lvl.image}
              style={styles.nodeSpacing}
            />
          ))}
        </ScrollView>
      </View>

      {/* [TEST/DEBUG] unlock-all / reset toggle; remove for release */}
      {onDebugToggle && (
        <DebugButton allUnlocked={debugAllUnlocked} onPress={onDebugToggle} />
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    height: "100%",
    width: "100%",
    // Fallback if the image fails to load
    backgroundColor: "#ffebbd",
  },
  topBar: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingHorizontal: 16,
    bottom: 20,
    right: 15,
  },
  rowWrapper: {
    marginLeft: 25,
    marginTop: 400,
    flex: 1,
    justifyContent: "center",
  },
  titlePill: {
    marginTop: 10,
    marginRight: 500,
    flexDirection: "row",
    alignItems: "center",
  },
  rowContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  nodeSpacing: {
    marginRight: NODE_SPACING,
  },
});
