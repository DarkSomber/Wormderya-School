import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";

/**
 * AppButton
 * ----------------------------------------------------------------------
 * A single, reusable button component used across the app (Start,
 * Settings, Quit, and any future menu buttons).
 *
 * Props:
 *   label            string   - text shown on the button (e.g. "START")
 *   onPress          function - what happens when the button is tapped
 *   backgroundImage  ?any     - optional custom art for the button bg
 *                               e.g. require('../../assets/buttons/start.png')
 *   style            ?object  - override the outer button container style
 *   textStyle        ?object  - override the label text style
 *   disabled         ?bool    - disable the button
 *   multiline        ?bool    - use the taller size for 2-line labels
 *                               (e.g. "Rush Hour\nMode")
 *
 * - FIXED SIZE: width/height are locked by default so every button in
 *   the menu lines up perfectly, just like the reference mockup. Pass
 *   `multiline` for the rare button whose label needs two lines — it
 *   just switches to a taller fixed height, still shared by any other
 *   button that also sets `multiline`.
 * - CUSTOM LOOK: pass `backgroundImage` to swap in your own art asset
 *   later (currently a placeholder box), or override `style`/`textStyle`
 *   for one-off tweaks.
 * - CUSTOM PURPOSE: pass `onPress` to decide what the button does
 *   (navigate, open a modal, quit the app, etc).
 * ----------------------------------------------------------------------
 */

// Fixed dimensions shared by every button so the menu stays aligned.
const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 56;
const BUTTON_HEIGHT_MULTILINE = 70;

export default function AppButton({
  label,
  onPress,
  backgroundImage,
  style,
  textStyle,
  disabled = false,
  multiline = false,
}) {
  const sizeStyle = multiline ? styles.buttonMultiline : null;

  const content = (
    <Text
      style={[styles.label, disabled && styles.labelDisabled, textStyle]}
      numberOfLines={multiline ? 2 : 1}
    >
      {label}
    </Text>
  );

  // If a background image has been supplied, render it via ImageBackground.
  if (backgroundImage) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        disabled={disabled}
        style={[styles.buttonBase, sizeStyle, style]}
      >
        <ImageBackground
          source={backgroundImage}
          resizeMode="contain"
          style={styles.imageFill}
          imageStyle={styles.imageRadius}
        >
          {content}
        </ImageBackground>
      </TouchableOpacity>
    );
  }

  // Otherwise fall back to the placeholder look (dashed border box)
  // so it's obvious this is meant to be replaced with real art later.
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.buttonBase,
        sizeStyle,
        styles.placeholder,
        disabled && styles.placeholderDisabled,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonMultiline: {
    height: BUTTON_HEIGHT_MULTILINE,
  },
  // --- Placeholder styling (swap out once you have button art) ---
  placeholder: {
    backgroundColor: "rgba(245, 236, 214, 0.9)",
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
  },
  placeholderDisabled: {
    opacity: 0.4,
  },
  imageFill: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageRadius: {
    borderRadius: 16,
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5c3a21",
    letterSpacing: 1,
    textAlign: "center",
  },
  labelDisabled: {
    color: "#a89a86",
  },
});

export { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_HEIGHT_MULTILINE };
