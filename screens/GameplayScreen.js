import React from "react";
import { View, Text, StyleSheet } from "react-native";
import AppButton from "../components/AppButton";

/**
 * GameplayScreen (placeholder)
 * ----------------------------------------------------------------------
 * Stands in for the real gameplay screen, which will be built later.
 * Reached after the backstory sequence finishes. Has a Back button just
 * so the flow is testable end-to-end in the meantime — remove it once
 * real gameplay (with its own pause/exit flow) exists.
 * ----------------------------------------------------------------------
 */

export default function GameplayScreen({ onBack }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>GAMEPLAY SCREEN{"\n"}(coming later)</Text>
      <AppButton label="< Back" onPress={onBack} style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3e6cf",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  text: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
    color: "#8a5a30",
    marginBottom: 30,
  },
  backButton: {
    width: 140,
    height: 44,
  },
});
