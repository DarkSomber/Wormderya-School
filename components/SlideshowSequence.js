import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

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
