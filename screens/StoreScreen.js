import React, { useState } from "react";
import ShopOutcomeModal from "./ShopOutcomeModal.js";
import { formatCurrency } from "../components/gameplayReusables/UseWallet";
import AchievementModal from "../components/gameplayReusables/AchievementModal";
import { ACHIEVEMENTS } from "../components/gameplayReusables/Achievements.js";
import { UPGRADE_LIST } from "../components/gameplayReusables/UseUpgrades";
import audio from "../audio/AudioManager";
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
  buyUpgrade: () => ({ success: false, reason: "unavailable" }),
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

  const selected =
    UPGRADE_LIST.find((u) => u.id === selectedId) || UPGRADE_LIST[0];
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
      audio.playSfx("wrong");
      setFeedback({ type: "error", text: "Already owned." });
      return;
    }

    if (!affordable) {
      audio.playSfx("wrong");
      setFeedback({
        type: "error",
        text: `Not enough coins (need ${price}, have ${wallet.currency}).`,
      });
      // eslint-disable-next-line no-undef
      if (__DEV__) {
        console.log(
          `[Store] buy blocked: need=${price} have=${wallet.currency} id=${selected.id}`,
        );
      }
      return;
    }

    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.log(
        `[Store] buying "${selected.name}" for ${price} (currency before=${wallet.currency})`,
      );
    }

    const result = safeUpgrades.buyUpgrade(selected);

    // eslint-disable-next-line no-undef
    if (__DEV__) {
      console.log(`[Store] buyUpgrade result:`, result);
    }

    if (result.success) {
      audio.playSfx("ratty_buy");
      setFeedback({ type: "ok", text: `Bought ${selected.name}!` });
      achievements.unlockAchievement(ACHIEVEMENTS.FIRST_PURCHASE);
      setRattyOutcome("discount");
    } else {
      audio.playSfx("wrong");
      setFeedback({
        type: "error",
        text:
          result.reason === "insufficient"
            ? "Not enough coins."
            : result.reason === "owned"
              ? "Already owned."
              : "Purchase failed.",
      });
    }
  };

  const handleDecline = () => {
    audio.playSfx("ratty_ignore");
    wallet.declineOffer(UPGRADE_LIST.map((u) => u.id));
    setRattyOutcome("inflate");
  };

  const statusLine = owned
    ? "OWNED"
    : active
      ? "ACTIVE"
      : feedback
        ? feedback.text
        : `${price} coins${!affordable ? " — not enough coins" : ""}`;

  const statusColor = feedback
    ? feedback.type === "ok"
      ? "#2E7D32"
      : "#7A2E2E"
    : "#7A2E2E";

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            audio.playSfx("click");
            onBack?.();
          }}
          activeOpacity={0.7}
          style={styles.backButtonWrapper}
        >
          <Image
            source={require("../assets/Final/buttons/buttonLevelSelectBack.png")}
            style={styles.backButtonIcon}
          />
        </TouchableOpacity>

        <Image
          source={require("../assets/Placeholder/TopBoard.png")}
          style={styles.shopSign}
        />

        <Image
          source={require("../assets/Final/RattyBodega/MrRatty.png")}
          style={styles.ratMerchant}
        />

        <ImageBackground
          source={require("../assets/Placeholder/Board.png")}
          style={styles.shopPanel}
          resizeMode="stretch"
        >
          <View style={styles.coinHeader}>
            <Text
              style={styles.coinText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatCurrency(wallet.currency)}
            </Text>
            <Image
              source={require("../assets/Placeholder/pixel_coins.png")}
              style={styles.coinIcon}
            />
          </View>

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
                <Text style={styles.itemSlotInitial}>{item.name.charAt(0)}</Text>
                {itemOwned && <Text style={styles.ownedBadge}>✓</Text>}
              </View>

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemSlotContainer}
                  onPress={() => {
                    audio.playSfx("click");
                    setSelectedId(item.id);
                    setFeedback(null);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.itemSlotBox,
                      selectedId === item.id && styles.itemSelected,
                    ]}
                  >
                    <Text style={styles.itemSlotInitial}>
                      {item.name.charAt(0)}
                    </Text>
                    {itemOwned && <Text style={styles.ownedBadge}>✓</Text>}
                  </View>
                  <View style={styles.priceContainer}>
                    <Image
                      source={require("../assets/Placeholder/pixel_coins.png")}
                      style={styles.smallCoinIcon}
                    />
                    <Text style={styles.priceText}>
                      {itemPrice}
                      {onSale ? " ↓" : ""}
                      {pricedUp ? " ↑" : ""}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
          <TouchableOpacity
            onPress={handleBuy}
            activeOpacity={0.8}
            disabled={owned}
            style={owned ? styles.buyButtonDisabled : undefined}
          >
            <Image
              source={require("../assets/Placeholder/BuyButton.png")}
              style={styles.buyButtonImage}
            />
          </TouchableOpacity>
        </ImageBackground>

        <TouchableOpacity
          onPress={handleDecline}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.buttonHalf}
        >
          <Image
            source={require("../assets/Placeholder/DeclineButton.png")}
            style={styles.backButtonImage}
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
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#4A3B32",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  backButtonWrapper: {
    position: "absolute",
    top: -18,
    left: 5,
    zIndex: 10,
  },
  backButtonIcon: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  shopSign: {
    width: "100%",
    height: 150,
    resizeMode: "stretch",
  },
  ratMerchant: {
    width: 100,
    height: 80,
    resizeMode: "contain",
    marginTop: -125,
  },
  shopPanel: {
    width: "100%",
    height: 430,
    marginRight: 20,
    paddingVertical: 25,
    paddingHorizontal: 1,
    alignItems: "center",
    borderRadius: 8,
    justifyContent: "space-between",
    marginTop: -100,
    zIndex: 1,
  },
  coinHeader: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "80%",
    gap: 9,
  },
  coinIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  coinText: {
    flexShrink: 1,
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 12,
  },
  itemSlotContainer: {
    alignItems: "center",
    width: 100,
  },
  itemSlotBox: {
    width: 90,
    height: 90,
    backgroundColor: "#E8D6B0",
    borderWidth: 3,
    borderColor: "#7A5230",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemSelected: {
    borderColor: "#FFE194",
    borderWidth: 4,
  },
  itemSlotInitial: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#5A3A1A",
  },
  ownedBadge: {
    position: "absolute",
    top: 4,
    right: 6,
    fontSize: 20,
    color: "#2E7D32",
    fontWeight: "bold",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  smallCoinIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  smallCoinIcon: { width: 18, height: 18, resizeMode: 'contain' },
  priceText: { fontSize: 14, fontWeight: 'bold', color: '#000' },

  textArea: { position: 'absolute', top: '72%', left: '8%', right: '8%' },
  descriptionText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: "#000",
    marginTop: -10,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  affordabilityText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#7A2E2E",
    textAlign: "center",
    marginBottom: 6,
    paddingHorizontal: 16,
  },
  buyButtonImage: {
    width: 170,
    height: 55,
    marginLeft: 15,
    marginBottom: 15,
    resizeMode: "stretch",
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },
  declineButtonWrapper: {
    width: "100%",
    zIndex: 20,
    elevation: 20,
  },
  backButtonImage: {
    width: "100%",
    height: 60,
    resizeMode: "contain",
    marginTop: 2,
  },
});
