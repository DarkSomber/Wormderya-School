import React, { useState } from 'react';
import ShopOutcomeModal from './ShopOutcomeModal.js';
import { formatCurrency } from '../components/gameplayReusables/UseWallet';
import AchievementModal from '../components/gameplayReusables/AchievementModal';
import { ACHIEVEMENTS } from '../components/gameplayReusables/Achievements.js';
import { UPGRADE_LIST } from '../components/gameplayReusables/UseUpgrades';
import audio from '../audio/AudioManager';
import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import Text from '../components/AppText';

const NO_UPGRADES = {
  ownedPermanent: new Set(),
  activeTemporary: {},
  isActive: () => false,
  rewardMultiplier: 1,
  patienceDrainMultiplier: 1,
  extraHealth: 0,
  consumeExtraHealth: () => {},
  buyUpgrade: () => ({ success: false, reason: 'unavailable' }),
  startNewRound: () => {},
};

export default function StoreScreen({
  onBack,
  wallet,
  achievements,
  upgrades,
  onGoToLevelSelect,
}) {
  const safeUpgrades = upgrades ?? NO_UPGRADES;
  const { width, height } = useWindowDimensions();

  const [rattyOutcome, setRattyOutcome] = useState(null);
  const [offers] = useState(() => pickRandom(UPGRADE_LIST, 3));
  const [selectedId, setSelectedId] = useState(offers[0].id);
  const selected = offers.find((u) => u.id === selectedId) || offers[0];
  const [feedback, setFeedback] = useState(null); // last action result, shown in status line

  const price = wallet.getEffectivePrice(selected.id, selected.price);
  const owned = safeUpgrades.ownedPermanent.has(selected.id);
  const active = safeUpgrades.isActive(selected.id);
  const affordable = wallet.currency >= price;

  //random three boxes instead of scroll
  function pickRandom(list, n) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

  const handleBuy = () => {
    setFeedback(null);

    if (owned) {
      audio.playSfx('wrong');
      setFeedback({ type: 'error', text: 'Already owned.' });
      return;
    }

    if (!affordable) {
      audio.playSfx('wrong');
      setFeedback({
        type: 'error',
        text: `Not enough coins (need ${price}, have ${wallet.currency}).`,
      });
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.log(
          `[Store] buy blocked: need=${price} have=${wallet.currency} id=${selected.id}`
        );
      }
      return;
    }

    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.log(
        `[Store] buying "${selected.name}" for ${price} (currency before=${wallet.currency})`
      );
    }

    const result = safeUpgrades.buyUpgrade(selected);

    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.log(`[Store] buyUpgrade result:`, result);
    }

    if (result.success) {
      audio.playSfx('ratty_buy');
      setFeedback({ type: 'ok', text: `Bought ${selected.name}!` });
      achievements.unlockAchievement(ACHIEVEMENTS.FIRST_PURCHASE);
      setRattyOutcome('discount');
    } else {
      audio.playSfx('wrong');
      setFeedback({
        type: 'error',
        text:
          result.reason === 'insufficient'
            ? 'Not enough coins.'
            : result.reason === 'owned'
            ? 'Already owned.'
            : 'Purchase failed.',
      });
    }
  };

  const handleDecline = () => {
    audio.playSfx('ratty_ignore');
    wallet.declineOffer(offers.map((u) => u.id));
    setRattyOutcome('inflate');
};

  const statusLine = owned
    ? 'OWNED'
    : active
    ? 'ACTIVE'
    : feedback
    ? feedback.text
    : `${price} coins${!affordable ? ' — not enough coins' : ''}`;

  const statusColor = feedback
    ? feedback.type === 'ok'
      ? '#2E7D32'
      : '#7A2E2E'
    : '#7A2E2E';

  return (
  <View style={styles.screenWrapper}>
    {/* The stage is the picture's shape, as large as fits on this phone */}
    <View style={[styles.stage, { width: Math.min(width, height * (500 / 552)) }]}>
      <Image
      source={require('../assets/Final/store/Sample.png')}
      style={{ width: '100%', height: '100%' }}
      resizeMode="stretch"
/>
    <View style={styles.coinHeader}>
        <Text style={styles.coinText} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(wallet.currency)}
        </Text>
        <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.coinIcon} />
      </View>

      {/* Tap areas over the three boxes in the picture */}
      <View style={styles.boxesRow}>
         
        {offers.map((item) => {
          const itemPrice = wallet.getEffectivePrice(item.id, item.price);
          const onSale = itemPrice < item.price;
          const pricedUp = itemPrice > item.price;
          const itemOwned = safeUpgrades.ownedPermanent.has(item.id);

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.boxSlot}
              activeOpacity={0.7}
              onPress={() => {
                audio.playSfx('click');
                setSelectedId(item.id);
                setFeedback(null);
              }}
            >
              <View
                style={[
                  styles.boxHighlight,
                  selectedId === item.id && styles.itemSelected,
                ]}
              >
                {item.icon ? (
                    <Image source={item.icon} style={styles.itemIcon} />
                  ) : (
                    <Text style={styles.itemSlotInitial}>{item.name.charAt(0)}</Text>
                  )}
                {itemOwned && <Text style={styles.ownedBadge}>✓</Text>}
              </View>

              <View style={styles.priceContainer}>
                <Image
                  source={require('../assets/Placeholder/pixel_coins.png')}
                  style={styles.smallCoinIcon}
                />
                <Text style={styles.priceText}>
                  {itemPrice}
                  {onSale ? ' ↓' : ''}
                  {pricedUp ? ' ↑' : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Name, description, status */}
      <View style={styles.textArea}>
        <Text style={styles.descriptionText}>{selected.name}</Text>
        <Text style={styles.affordabilityText}>{selected.description}</Text>
        <Text style={[styles.affordabilityText, { color: statusColor }]}>
          {statusLine}
        </Text>
      </View>

      {/* Buy is only hard-disabled when already owned. If not affordable,
          it still taps and shows a clear message instead of silently
          doing nothing. */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          onPress={handleBuy}
          activeOpacity={0.8}
          disabled={owned}
          style={[styles.buttonHalf, owned && styles.buyButtonDisabled]}
        >
          <Image
            source={require('../assets/Placeholder/BuyButton.png')}
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDecline}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.buttonHalf}
        >
          <Image
            source={require('../assets/Placeholder/DeclineButton.png')}
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Back button, top left, below the status bar */}
      <TouchableOpacity
        onPress={() => {
          audio.playSfx('click');
          onBack?.();
        }}
        activeOpacity={0.7}
        style={[styles.backButtonWrapper, { top: (StatusBar.currentHeight ?? 0) + 8 }]}
      >
        <Image
          source={require('../assets/Final/buttons/buttonBack.png')}
          style={styles.backButtonIcon}
        />
      </TouchableOpacity>
    </View>

    <ShopOutcomeModal
      visible={rattyOutcome !== null}
      outcome={rattyOutcome}
      onDismiss={() => {
        setRattyOutcome(null);
        onGoToLevelSelect?.();
      }}
    />
    <AchievementModal
      visible={achievements.currentAchievement !== null}
      achievement={achievements.currentAchievement}
      onDismiss={achievements.dismissAchievement}
    />
  </View>
);
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
  aspectRatio: 268 / 552,
  overflow: 'hidden',
  backgroundColor: 'blue'
},

  backButtonWrapper: { position: 'absolute', zIndex: 10 },
  backButtonIcon: { width: 120, bottom: '70%',resizeMode: 'contain' },

  coinHeader: {
  position: 'absolute',
  top: '49%',     // tune this one number
  right: '39%',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  zIndex: 5,
  },
  coinIcon: { width: 28, height: 28, resizeMode: 'contain' },
  coinText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },

  // Lines up with the three boxes in the picture
  boxesRow: {
    position: 'absolute',
    top: '57.9%',
    left: '4.5%',
    right: '4.5%',
    height: '10%',
    flexDirection: 'row',
  },
  boxSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boxHighlight: {
    width: '69%',
    height: '100%',
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemSelected: { borderColor: '#FFE194', borderWidth: 4 },
  itemSlotInitial: { fontSize: 30, fontWeight: 'bold', color: '#5A3A1A' },
  itemIcon: { width: '80%', height: '80%', resizeMode: 'contain' },
  ownedBadge: {
    position: 'absolute', top: 2, right: 4,
    fontSize: 16, color: '#2E7D32', fontWeight: 'bold',
  },
  priceContainer: {
    position: 'absolute', top: '100%',
    flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2,
  },
  smallCoinIcon: { width: 18, height: 18, resizeMode: 'contain' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#000' },

  textArea: { position: 'absolute', top: '72%', left: '8%', right: '8%' },
  descriptionText: {
    fontSize: 17, fontWeight: 'bold', textAlign: 'center', color: '#000', marginBottom: 2,
  },
  affordabilityText: {
    fontSize: 12, fontWeight: 'bold', color: '#7A2E2E', textAlign: 'center', marginBottom: 3,
  },

  buttonRow: {
    position: 'absolute',
    bottom: '3%',
    left: '6%',
    right: '6%',
    height: '8%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonHalf: { width: '48%', height: '100%' },
  buttonImage: { width: '100%', height: '100%' },
  buyButtonDisabled: { opacity: 0.4 },
});