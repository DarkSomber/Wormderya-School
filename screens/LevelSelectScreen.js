import React from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar } from "react-native";
import LevelButton from "../components/LevelButton";
import AppButton from "../components/AppButton";

/**
 * LevelSelectScreen
 * ----------------------------------------------------------------------
 * Shown after the player picks "Story-Mode":
 *   [ header banner: "LEVEL SELECT" ]
 *   [ winding path of tappable level nodes, each a placeholder image ]
 *   [ < Back ]
 *
 * Each level node uses LevelButton (same pattern as AppButton — fixed
 * size, swappable art via `backgroundImage`, custom `onPress`).
 *
 * NOTE: the reference art shows a hand-drawn curvy path connecting the
 * levels. Drawing an actual curved line needs an SVG library
 * (e.g. react-native-svg), which isn't wired up here yet. For now the
 * levels just alternate left/right to suggest a winding path — swap in
 * an SVG path behind the nodes later if you want the exact look.
 * ----------------------------------------------------------------------
 */

// Describe each level once; add/remove entries here to change the path.
// `align` controls which side of the screen the node sits on.
const LEVELS = [
  { id: 1, align: "flex-start", size: 100 },
  { id: 2, align: "flex-end", size: 90 },
  { id: 3, align: "flex-start", size: 90 },
  { id: 4, align: "center", size: 130 }, // e.g. a bigger "boss" node
];

export default function LevelSelectScreen({
  onSelectLevel,
  onBack,
  lockedLevels = [],
}) {
  return (
    <View style={styles.background}>
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
              level={lvl.id}
              size={lvl.size}
              locked={lockedLevels.includes(lvl.id)}
              onPress={() => onSelectLevel && onSelectLevel(lvl.id)}
              // Later: backgroundImage={require(`../../assets/levels/level-${lvl.id}.png`)}
            />
          </View>
        ))}
      </ScrollView>

      {/* ---------- BACK BUTTON ---------- */}
      <View style={styles.footer}>
        <AppButton
          label="< Back"
          onPress={onBack}
          style={styles.backButton}
          // Later: backgroundImage={require('../../assets/buttons/back.png')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    // BACKGROUND PLACEHOLDER COLOR — same as the other screens
    backgroundColor: "#f3e6cf",
  },
  header: {
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: "center",
    // HEADER PLACEHOLDER COLOR — swap for a banner image later if wanted
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
    paddingBottom: 24,
    alignItems: "flex-start",
  },
  backButton: {
    width: 140,
    height: 44,
  },
});
