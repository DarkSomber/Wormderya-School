import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Text from './AppText';
import { ACHIEVEMENTS } from './gameplayReusables/Achievements.js';

const CARD_CLOSED = require('../assets/Final/card_closed.png');
const CARD_OPEN = require('../assets/Final/card_open.png');

const CLOSED_RATIO = 600 / 152;
const OPEN_RATIO = 600 / 300;

const OPEN_HEADER_PCT = `${(152 / 300) * 100}%`;

const LOCKED_OPACITY = 0.45;

const CREAM = '#f3e6cf';
const DARK = '#2f1f12';
const TEXT_DARK = '#5c3a21';

function AchievementCard({ achievement, unlocked }) {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ opacity: unlocked ? 1 : LOCKED_OPACITY }}>
      <View style={[styles.card, { aspectRatio: open ? OPEN_RATIO : CLOSED_RATIO }]}>
        <Image
          source={open ? CARD_OPEN : CARD_CLOSED}
          style={styles.fill}
          resizeMode="stretch"
        />

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setOpen((o) => !o)}
          style={[styles.header, { height: open ? OPEN_HEADER_PCT : '100%' }]}
        >
          <View style={styles.picBox}>
            {achievement.icon ? (
              <Image source={achievement.icon} style={styles.picImage} resizeMode="contain" />
            ) : (
              <Text style={styles.picPlaceholder}>★</Text>
            )}
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {achievement.title}
          </Text>

          <Text style={styles.toggle}>{open ? '✕' : '▼'}</Text>
        </TouchableOpacity>

        {open && (
        <View style={styles.descBox}>
          <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={styles.descScroll}
          >
          <Text style={styles.description}>{achievement.description}</Text>
          <Text style={styles.reward}>
          Reward: {achievement.coinReward} coins{unlocked ? '  ✓' : ''}
          </Text>
          </ScrollView>
      </View>
      )}
      </View>
    </View>
  );
}

export default function AchievementList({ unlockedIds }) {
  const all = Object.values(ACHIEVEMENTS);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {all.map((a) => (
        <AchievementCard key={a.id} achievement={a} unlocked={!!unlockedIds?.has(a.id)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { width: '100%', flex: 1, marginBottom: 18 },
  content: { gap: 10, paddingBottom: 10 },

  card: { width: '100%' },
  fill: { position: 'absolute', width: '100%', height: '100%' },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  picBox: {
    width: 46,
    height: 46,
    marginRight: 12,
    borderWidth: 2,
    borderColor: DARK,
    borderRadius: 6,
    backgroundColor: 'rgba(243,230,207,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  picImage: { width: 36, height: 36 },
  picPlaceholder: { fontSize: 20, color: TEXT_DARK },

  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: CREAM,
    textShadowColor: DARK,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },
  toggle: {
    fontSize: 18,
    fontWeight: '700',
    color: CREAM,
    marginLeft: 8,
    textShadowColor: DARK,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },

  descBox: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: '55%',
    bottom: 12,
    borderWidth: 2,
    borderColor: DARK,
    borderRadius: 6,
    backgroundColor: 'rgba(243,230,207,0.92)',
    padding: 8,
  },
  description: { fontSize: 13, color: TEXT_DARK },
  reward: { fontSize: 12, fontWeight: '700', color: TEXT_DARK, marginTop: 4 },
});