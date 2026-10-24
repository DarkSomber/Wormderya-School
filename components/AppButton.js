import React from "react";
import { TouchableOpacity, StyleSheet, ImageBackground } from "react-native";
import Text from "./AppText";
import audio from "../audio/AudioManager";

const BUTTON_WIDTH = 190;
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
  const handlePress = (e) => {
    audio.playSfx("click");
    onPress?.(e);
  };

  const content = (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.7}
      style={[styles.label, disabled && styles.labelDisabled, textStyle]}
      numberOfLines={multiline ? 2 : 1}
    >
      {label}
    </Text>
  );

  if (backgroundImage) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePress}
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

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
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
    fontSize: 22,
    fontWeight: "700",
    color: "#4A1010",
    letterSpacing: 1,
    textAlign: "center",
    maxWidth: "80%",
  },
  labelDisabled: {
    color: "#a89a86",
  },
});

export { BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_HEIGHT_MULTILINE };
