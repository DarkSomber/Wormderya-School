import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

//Slideshow Sequence survives so the game won't crash. Functions like slideshow Sequence
export default function CountdownSequence({ slides, onComplete, msPerSlide = 800 }) {
  const [index, setIndex] = useState(0);
  const isLastSlide = index === slides.length - 1;
  const slide = slides[index];

  // loop for each slide
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLastSlide) {
        onComplete && onComplete();
      } else {
        setIndex((i) => i + 1);
      }
    }, msPerSlide);

    // Safety net so it won't fire twice
    return () => clearTimeout(timeoutId);
  }, [index, isLastSlide, msPerSlide, onComplete]);

  return (
    <View style={styles.container}>
      <View style={styles.slideCard}>
        <Text style={styles.slideLabelText}>{slide.label}</Text>
        {slide.subLabel ? (
          <Text style={styles.slideSubLabelText}>{slide.subLabel}</Text>
        ) : null}
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
    paddingHorizontal: 16,
  },
  slideLabelText: {
    textAlign: "center",
    color: "#5c3a21",
    fontWeight: "800",
    fontSize: 26,
  },
  slideSubLabelText: {
    textAlign: "center",
    color: "#8a5a30",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 10,
  },
});