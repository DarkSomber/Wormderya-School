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
 *                                    (omit/empty to just show the art)
 *   onPress          function
 *   backgroundImage  ?any   - e.g. require('../../assets/levels/level-1.png')
 *   size             ?number - override the default node diameter
 *   locked           ?bool   - greys the node out and blocks presses
 *   style            ?object
 * ----------------------------------------------------------------------
 */

const DEFAULT_SIZE = 90;

export default function LevelButton({
  level,
  onPress,
  backgroundImage,
  size = DEFAULT_SIZE,
  locked = false,
  style,
}) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

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
        style={[styles.nodeBase, dimensionStyle, style]}
      >
        <ImageBackground
          source={backgroundImage}
          resizeMode="cover"
          style={[styles.imageFill, dimensionStyle]}
          imageStyle={dimensionStyle}
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
        dimensionStyle,
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
  placeholder: {
    backgroundColor: "rgba(245, 236, 214, 0.9)",
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
  },
  placeholderLocked: {
    opacity: 0.4,
  },
  imageFill: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#5c3a21",
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
