import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";

/**
 * LevelButton
 * ----------------------------------------------------------------------
 * A single tappable level node shown on LevelSelectScreen. Separate from
 * AppButton because the shape/size is different (round "stone" nodes
 * instead of pill menu buttons), but follows the exact same pattern:
 * fixed size, swappable art via `backgroundImage`, custom purpose via
 * `onPress`.
 *
 * Props:
 *   level            number|string - level number shown on the node
 *                                    (omit/empty to just show the art —
 *                                    useful if your art already has its
 *                                    own number baked in, like a tag)
 *   onPress          function
 *   backgroundImage  ?any   - e.g. require('../assets/levels/level-1.png')
 *   size             ?number - diameter of the PLACEHOLDER circle only
 *                              (ignored once backgroundImage is set)
 *   width            ?number - box width when backgroundImage is set
 *   height           ?number - box height when backgroundImage is set
 *   locked           ?bool   - greys the node out and blocks presses
 *   style            ?object
 *
 * NOTE: only the placeholder (no art yet) is forced into a circle — once
 * you provide `backgroundImage`, the node becomes a plain rectangular box
 * sized by `width`/`height` and uses resizeMode="contain", so the full
 * image shows with its own shape/transparency intact instead of being
 * cropped into a circle.
 * ----------------------------------------------------------------------
 */

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

  // Placeholder look — dashed circle so it's obvious this needs real art.
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
