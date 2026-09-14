import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

/**
 * SlideshowSequence
 * ----------------------------------------------------------------------
 * Generic "show one slide, tap Next, show the next slide" component.
 * Used for the Story-Mode backstory intro, and reusable as-is for the
 * game's ending sequence later — just pass a different `slides` array.
 *
 * Props:
 *   slides       array   - e.g. [{ id: '1', image: require(...) }, ...]
 *                           each slide can optionally carry a real
 *                           `image` (require(...) or { uri }) — until
 *                           then it renders as a numbered placeholder.
 *   onComplete   function - called when "Next" is pressed on the last slide
 *   nextLabel        ?string - label for the button on every slide except
 *                              the last (default: "Next ->")
 *   lastLabel        ?string - label for the button on the last slide
 *                              (default: "Continue ->")
 *
 * Each slide placeholder is numbered (1 of 5, 2 of 5, ...) so it's easy
 * to tell them apart before the real art is dropped in.
 * ----------------------------------------------------------------------
 */

export default function SlideshowSequence({
  slides,
  onComplete,
  nextLabel = "Next  ->",
  lastLabel = "Continue  ->",
}) {
  const [index, setIndex] = useState(0);
  const isLastSlide = index === slides.length - 1;
  const slide = slides[index];

  const handleNext = () => {
    if (isLastSlide) {
      onComplete && onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* ---------- SLIDE PLACEHOLDER ---------- */}
      {/* Later, once you have art per slide, swap this block for:
          <Image source={slide.image} style={styles.slideImage} resizeMode="cover" />
      */}
      <View style={styles.slideCard}>
        {slide.image ? (
          <Image
            source={slide.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.slidePlaceholderText}>
            SLIDE {index + 1} OF {slides.length}
            {"\n"}PLACEHOLDER IMAGE
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleNext}
          style={styles.nextButton}
        >
          <Text style={styles.nextButtonText}>
            {isLastSlide ? lastLabel : nextLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // BACKGROUND PLACEHOLDER COLOR — same as the other screens
    backgroundColor: "#f3e6cf",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  slideCard: {
    width: "100%",
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8a5a30",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  slideImage: {
    width: "100%",
    height: "100%",
  },
  slidePlaceholderText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "700",
    fontSize: 16,
  },
  footer: {
    width: "100%",
    alignItems: "flex-end",
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(245, 236, 214, 0.9)",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
  },
});
