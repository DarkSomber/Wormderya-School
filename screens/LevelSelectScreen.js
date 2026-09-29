import React from "react";
import { View, StyleSheet, ScrollView, StatusBar, ImageBackground } from 'react-native';
import Text from '../components/AppText';
import LevelButton from "../components/LevelButton";
import AppButton from "../components/AppButton";
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
    size: 100,
    image: require("../assets/Final/levels/Level_1_Sinangag.png"),
  },
  {
    id: 2,
    align: "flex-end",
    width: 165,
    height: 105,
    image: require("../assets/Final/levels/Level_2_Adobo.png"),
  },
  {
    id: 3,
    align: "flex-start",
    width: 135,
    height: 95,
    image: require("../assets/Final/levels/Level_3_Sinigang-na-Bangus.png"),
  },
  {
    id: 4,
    align: "flex-end",
    width: 190,
    height: 150,
    image: require("../assets/Final/levels/Level_4_Boss_kare-kare.png"),
  }, // e.g. a bigger "boss" node
];

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
      source={require("../assets/Final/BackgroundColor.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="dark-content" />

      {/* ---------- HEADER BANNER ---------- */}
      <View style={styles.header}>
        <Text style={styles.headerText}>LEVEL SELECT</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {LEVELS.map((lvl) => (
          <View
            key={lvl.id}
            style={[styles.nodeRow, { justifyContent: lvl.align }]}
          >
            <LevelButton
              width={lvl.width}
              height={lvl.height}
              locked={isLevelLocked(lvl, unlockedLevels, lockedLevels)}
              onPress={() => onSelectLevel && onSelectLevel(lvl.id)}
              backgroundImage={lvl.image}
            />
          </View>
        ))}
      </ScrollView>

      {/* [TEST/DEBUG] unlock-all / reset toggle; remove for release */}
      {onDebugToggle && (
        <DebugButton allUnlocked={debugAllUnlocked} onPress={onDebugToggle} />
      )}

      {/* ---------- BACK BUTTON ---------- */}
      <View style={styles.footer}>
        <AppButton
          onPress={onBack}
          style={styles.buttonSpacing}
          backgroundImage={require("../assets/Final/buttons/buttonBack.png")}
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // Fallback if the image fails to load
    backgroundColor: "#ffebbd",
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
    // Placeholder color; swap for a banner image
    backgroundColor: "#f2b988",
    borderBottomWidth: 2,
    borderBottomColor: "#2a2a2a",
  },
  headerText: {
    fontSize: 26,
    fontWeight: "800",
    color: "#2a2a2a",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  nodeRow: {
    flexDirection: "row",
    marginBottom: 40,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    alignItems: "center",
  },
  backButton: {
    width: 140,
    height: 44,
  },
});