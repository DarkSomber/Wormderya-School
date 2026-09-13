import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
} from "react-native";
import LevelButton from "../components/LevelButton";
import AppButton from "../components/AppButton";

// Describe each level once; add/remove entries here to change the path.
// `align` controls which side of the screen the node sits on.
const LEVELS = [
  {
    id: 1,
    align: "flex-start",
    size: 100,
    image: require("../assets/Final/levels/Level-1-Logo.png"),
  },
  {
    id: 2,
    align: "flex-end",
    width: 165,
    height: 105,
    image: require("../assets/Final/levels/Level-2-Logo.png"),
  },
  {
    id: 3,
    align: "flex-start",
    width: 135,
    height: 95,
    image: require("../assets/Final/levels/Level-3-Logo.png"),
  },
  {
    id: 4,
    align: "flex-end",
    width: 190,
    height: 150,
    image: require("../assets/Final/levels/Level-4-Logo.png"),
  }, // e.g. a bigger "boss" node
];

export default function LevelSelectScreen({
  onSelectLevel,
  onBack,
  lockedLevels = [],
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
              locked={lockedLevels.includes(lvl.id)}
              onPress={() => onSelectLevel && onSelectLevel(lvl.id)}
              backgroundImage={lvl.image}
            />
          </View>
        ))}
      </ScrollView>

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
    // Fallback color in case the image fails to load
    backgroundColor: "#ffebbd",
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
    paddingBottom: 32,
    alignItems: "center",
  },
  backButton: {
    width: 140,
    height: 44,
  },
});
