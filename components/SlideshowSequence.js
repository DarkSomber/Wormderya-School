import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Text from './AppText';
import audio from '../audio/AudioManager';

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
 *   backLabel        ?string - label for the Back button, which goes to the
 *                              previous slide (default: "<-  Back"). It is
 *                              hidden on the first slide.
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
  backLabel = "<-  Back",
}) {
  const [index, setIndex] = useState(0);
  const isFirstSlide = index === 0;
  const isLastSlide = index === slides.length - 1;
  const slide = slides[index];
 
  const handleNext = () => {
    audio.playSfx('click');
    if (isLastSlide) {
      onComplete && onComplete();
    } else {
      setIndex((i) => i + 1);
    }
  };
 
  const handleBack = () => {
    audio.playSfx('click');
    setIndex((i) => Math.max(0, i - 1));
  };
 
  return (
    <View style={styles.container}>
      {/* ---------- SLIDE CONTENT ---------- */}
      <View style={styles.slideCard}>
        {slide.image ? (
          <Image
            source={slide.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        ) : slide.label ? (
          <>
            <Text style={styles.slideLabelText}>{slide.label}</Text>
            {slide.subLabel ? (
              <Text style={styles.slideSubLabelText}>{slide.subLabel}</Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.slidePlaceholderText}>
            SLIDE {index + 1} OF {slides.length}
          </Text>
        )}
      </View>
 
      <View style={styles.footer}>
        {/* Back goes to the previous slide; hidden on the first one. */}
        {isFirstSlide ? (
          <View />
        ) : (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleBack}
            style={styles.nextButton}
          >
            <Text style={styles.nextButtonText}>{backLabel}</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    overflow: "hidden",
    paddingHorizontal: 16,
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
  slideLabelText: {
    textAlign: "center",
    color: "#5c3a21",
    fontWeight: "800",
    fontSize: 26,
  },
  slideSubLabelText: {
    textAlign: "center",
    color: "#4a2d17",
    fontWeight: "600",
    fontSize: 20,
    lineHeight: 28,
    marginTop: 12,
  },
  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextButton: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(245, 236, 214, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
    textAlign: "center",
  },
});