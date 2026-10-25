import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Text from '../../AppText';
import { getLetterSprite } from './Spriteloader';
import { useSpawnAnimation, LETTER_ANIM_STATES } from './Animationsystem';

const PLATE = require('../../../assets/Final/GameplayUI/plate.png')

function Letter({ letter, left, width, height, onPress }) {
  const [vanished, setVanished] = useState(!letter.active);
  const scale = useSpawnAnimation(letter.animState, () => setVanished(true));
  const opacity = useMemo(
    () => scale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
    [scale]
  );

  useEffect(() => {
    if (letter.active) setVanished(false); 
  }, [letter.active]);

  const showTile =
    letter.active || (letter.animState === LETTER_ANIM_STATES.DISAPPEARING && !vanished);

  if (!showTile) {
    return <View style={[styles.slot, { left, width, height }]} />;
  }

  const sprite = getLetterSprite(letter.character);

  return (
    <Animated.View
      pointerEvents={letter.active ? 'auto' : 'none'}
      style={[styles.slot, { left, width, height, opacity, transform: [{ scale }] }]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPressIn={() => letter.active && onPress && onPress(letter)}
        hitSlop={{
          top: height * 0.07,
          bottom: height * 0.07,
          left: width * 0.07,
          right: width * 0.07,
        }}
        style={styles.tileTouchable}
      >
        <Image source={PLATE} style={styles.plateImage} resizeMode="contain" />
           {sprite ? (
              <Image source={sprite} style={styles.foodImage} resizeMode="contain" />
           ) : (
         <Text style={styles.tileText}>{letter.character}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const FLY_MS = 460;

export function FlyingTile({ tile, width, height, onDone }) {
  const p = useRef(new Animated.Value(0)).current;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const anim = Animated.timing(p, {
      toValue: 1,
      duration: FLY_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) onDoneRef.current?.(tile.key);
    });
    return () => anim.stop();
  }, [p, tile.key]);

  const motion = useMemo(
    () => ({
      opacity: p.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
      transform: [
        { translateX: p.interpolate({ inputRange: [0, 1], outputRange: [0, tile.dx] }) },
        { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, tile.dy] }) },
        { scale: p.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1.15, 0.4] }) },
      ],
    }),
    [p, tile.dx, tile.dy]
  );

  const sprite = getLetterSprite(tile.character);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.slot, { left: tile.left, width, height }, motion]}
    >
      <View style={styles.tileTouchable}>
        <Image source={PLATE} style={styles.plateImage} resizeMode="contain" />
        {sprite ? (
          <Image source={sprite} style={styles.foodImage} resizeMode="contain" />
        ) : (
          <Text style={styles.tileText}>{tile.character}</Text>
        )}
      </View>
    </Animated.View>
  );
}

export default React.memo(Letter);

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    top: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTouchable: {
    width: '86%',
    height: '86%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  plateImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  foodImage: {
    width: '70%',
    height: '70%',
  },
  tileText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#4a2e0f',
  },
});