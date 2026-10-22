import React, { useEffect, useMemo, useState } from 'react';
import { Animated, View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Text from '../../AppText';
import { getLetterSprite } from './Spriteloader';
import { useSpawnAnimation, LETTER_ANIM_STATES } from './Animationsystem';

const PLATE = require('../../../assets/Final/GameplayUI/plate.png')

function Letter({ letter, left, width, height, onPress }) {
  // Set once the removal animation has finished; the tile is only then unmounted.
  const [vanished, setVanished] = useState(!letter.active);
  const scale = useSpawnAnimation(letter.animState, () => setVanished(true));
  const opacity = useMemo(
    () => scale.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
    [scale]
  );

  useEffect(() => {
    if (letter.active) setVanished(false); 
  }, [letter.active]);

  // A removed tile stays drawn (non-tappable) while it plays its exit animation.
  const showTile =
    letter.active || (letter.animState === LETTER_ANIM_STATES.DISAPPEARING && !vanished);

  if (!showTile) {
    // Reserve the slot (keeps spacing stable) without rendering a tile —
    // this is the "removed" state the future Word Input System will use,
    // e.g. [A] [B] [ ] [D] [E] after the player selects "C".
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
        onPress={() => letter.active && onPress && onPress(letter)}
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

// Memoized: a tile pick/return changes one letter object, so the other tiles
// (same letter object, slot position and stable onPress) skip re-rendering.
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