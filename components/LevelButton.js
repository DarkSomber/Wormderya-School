import React from "react";
import { TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import Text from './AppText';

const DEFAULT_SIZE = 90;
const DEFAULT_IMAGE_WIDTH = 130;
const DEFAULT_IMAGE_HEIGHT = 90;

export default function LevelButton({
  level,
  onPress,
  backgroundImage,
  size = DEFAULT_SIZE,
  width = DEFAULT_IMAGE_WIDTH,
  height = DEFAULT_IMAGE_HEIGHT,
  locked = false,
  style,
}) {
  const circleStyle = { width: size, height: size, borderRadius: size / 2 };
  const imageBoxStyle = { width, height };

  const content =
    level !== undefined && level !== null && level !== "" ? (
      <Text style={[styles.levelText, locked && styles.levelTextLocked]}>
        {level}
      </Text>
    ) : null;

  if (backgroundImage) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        disabled={locked}
        style={[
          styles.nodeBase,
          imageBoxStyle,
          locked && styles.imageLocked,
          style,
        ]}
      >
        <ImageBackground
          source={backgroundImage}
          resizeMode="contain"
          style={[styles.imageFill, imageBoxStyle]}
        >
          {content}
        </ImageBackground>
        {locked && <Text style={styles.lockOverlay}>🔒</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={locked}
      style={[
        styles.nodeBase,
        circleStyle,
        styles.placeholder,
        locked && styles.placeholderLocked,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  nodeBase: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholderLocked: {
    opacity: 0.4,
  },
  imageLocked: {
    opacity: 0.4,
  },
  imageFill: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelTextLocked: {
    color: "#a89a86",
  },
  lockOverlay: {
    position: "absolute",
    fontSize: 18,
  },
});

export { DEFAULT_SIZE as LEVEL_BUTTON_DEFAULT_SIZE };