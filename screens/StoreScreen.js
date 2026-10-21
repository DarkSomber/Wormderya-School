import React, { useMemo, useState } from "react";
import ShopOutcomeModal from "./ShopOutcomeModal.js";
import { formatCurrency } from "../components/gameplayReusables/UseWallet";
import AchievementModal from "../components/gameplayReusables/AchievementModal";
import { ACHIEVEMENTS } from "../components/gameplayReusables/Achievements.js";
import { UPGRADE_LIST } from "../components/gameplayReusables/UseUpgrades";
import { useStage } from "../components/gameplayReusables/Stage";
import audio from "../audio/AudioManager";
import {
  StyleSheet,
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import Text from "../components/AppText";

// Sizes below were authored for a ~400 wide screen; they scale with the box.
const DESIGN_WIDTH = 400;

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

// Full-screen Bodega scene: forest background + stall (sign, Mr. Ratty, board).
// If RattyStall.png already contains everything, you can delete SHOP_BACKGROUND.
const SHOP_BACKGROUND = require("../assets/Final/RattyBodega/BackgroundRattyStall.png");
const SHOP_STALL = require("../assets/Final/RattyBodega/RattyStall.png");
const SHOP_RATTY = require("../assets/Final/RattyBodega/MrRatty.png");

// Pick n random items (Fisher-Yates shuffle on a copy).
function pickRandom(list, n) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function StoreScreen({
  onBack,
  wallet,
  achievements,
  upgrades,
  onGoToLevelSelect,
}) {
  const safeUpgrades = upgrades ?? NO_UPGRADES;

  // The shop art is 512x1088 like the gameplay art. Everything is laid out inside a box
  // of exactly that shape, fitted to the window, so the art and the UI never drift apart.
  const { w, h } = useStage();
  const styles = useMemo(() => createStyles(w / DESIGN_WIDTH, w, h), [w, h]);

  const [rattyOutcome, setRattyOutcome] = useState(null);
  // Three random offers, chosen once per visit to the store.
  const [offers] = useState(() => pickRandom(UPGRADE_LIST, 3));
  const [selectedId, setSelectedId] = useState(offers[0].id);
  const [feedback, setFeedback] = useState(null); // last action result, shown in status line

  const selected = offers.find((u) => u.id === selectedId) || offers[0];
  const price = wallet.getEffectivePrice(selected.id, selected.price);
  const owned = safeUpgrades.ownedPermanent.has(selected.id);
  const active = safeUpgrades.isActive(selected.id);
  const affordable = wallet.currency >= price;

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
    wallet.declineOffer(offers.map((u) => u.id));
    setRattyOutcome("inflate");
  };

  const priceArrow =
    price < selected.price ? " ↓" : price > selected.price ? " ↑" : "";

  const statusLine = owned
    ? "OWNED"
    : active
      ? "ACTIVE"
      : feedback
        ? feedback.text
        : `${price} coins${priceArrow}${!affordable ? " — not enough coins" : ""}`;

  const statusColor =
    feedback && feedback.type === "ok" ? "#2E7D32" : "#7A2E2E";

  return (
    <View style={styles.screenWrapper}>
      {/* One full-screen picture; everything below is laid over it by % */}
      <ImageBackground
        source={SHOP_BACKGROUND}
        style={styles.container}
        imageStyle={styles.stretch}
      >
        {/* Mr. Ratty sits behind the counter, so he goes under the stall layer */}
        <Image source={SHOP_RATTY} style={styles.ratty} pointerEvents="none" />
        <Image
          source={SHOP_STALL}
          style={[StyleSheet.absoluteFill, styles.stretch]}
          pointerEvents="none"
        />

        {/* Coins */}
        <View style={styles.coinHeader}>
          <Text style={styles.coinText} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(wallet.currency)}
          </Text>
          <Image
            source={require("../assets/Placeholder/pixel_coins.png")}
            style={styles.coinIcon}
          />
        </View>

        {/* Three random offers, lined up with the boxes in the picture */}
        <View style={styles.boxesRow}>
          {offers.map((item) => {
            const itemOwned = safeUpgrades.ownedPermanent.has(item.id);
            const itemPrice = wallet.getEffectivePrice(item.id, item.price);
            const onSale = itemPrice < item.price;
            const pricedUp = itemPrice > item.price;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.boxSlot}
                activeOpacity={0.7}
                onPress={() => {
                  audio.playSfx("click");
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
                    <Text style={styles.itemSlotInitial}>
                      {item.name.charAt(0)}
                    </Text>
                  )}
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
        </View>

        {/* Name, description, status */}
        <View style={styles.textArea}>
          <Text style={styles.descriptionText}>{selected.name}</Text>
          <Text style={styles.affordabilityText}>{selected.description}</Text>
          <Text style={[styles.affordabilityText, { color: statusColor }]}>
            {statusLine}
          </Text>
        </View>

        {/* Buy / No thank you, side by side at the bottom.
            Buy is only hard-disabled when already owned; if not affordable it
            still taps and shows a clear message. */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={handleBuy}
            activeOpacity={0.8}
            disabled={owned}
            style={[styles.buttonHalf, owned && styles.buyButtonDisabled]}
          >
            <Image
              source={require("../assets/Placeholder/BuyButton.png")}
              style={styles.buttonImage}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDecline}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.buttonHalf}
          >
            <Image
              source={require("../assets/Placeholder/DeclineButton.png")}
              style={styles.buttonImage}
            />
          </TouchableOpacity>
        </View>

        {/* Back button, top left */}
        <TouchableOpacity
          onPress={() => {
            audio.playSfx("click");
            onBack?.();
          }}
          activeOpacity={0.7}
          style={styles.backButtonWrapper}
        >
          <Image
            source={require("../assets/Final/buttons/buttonBack.png")}
            style={styles.backButtonIcon}
          />
        </TouchableOpacity>
      </ImageBackground>

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

// `s` scales the fixed sizes (fonts, icons, borders); positions are % of the box.
function createStyles(s, w, h) {
  return StyleSheet.create({
    screenWrapper: {
      flex: 1,
      backgroundColor: "#222",
      alignItems: "center",
      justifyContent: "center",
    },
    container: { width: w, height: h },
    stretch: { width: "100%", height: "100%", resizeMode: "stretch" },
    ratty: {
      position: "absolute",
      top: "25%",
      left: "27%",
      width: "46%",
      height: "22%",
      resizeMode: "contain",
    },
    backButtonWrapper: {
      position: "absolute",
      top: 0,
      left: 0,
      zIndex: 30,
      elevation: 30,
    },
    backButtonIcon: {
      width: 130 * s,
      height: 50 * s,
      resizeMode: "contain",
    },

    coinHeader: {
      position: "absolute",
      top: "49%",
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9 * s,
    },
    coinIcon: { width: 40 * s, height: 40 * s, resizeMode: "contain" },
    coinText: {
      flexShrink: 1,
      maxWidth: "50%",
      fontSize: 28 * s,
      fontWeight: "bold",
      color: "#fff",
    },

    // Lines up with the three boxes in the picture
    boxesRow: {
      position: "absolute",
      top: "57.9%",
      left: "4.5%",
      right: "4.5%",
      height: "10%",
      flexDirection: "row",
    },
    boxSlot: { flex: 1, alignItems: "center" },
    boxHighlight: {
      width: "90%",
      height: "100%",
      borderRadius: 8 * s,
      borderWidth: 3 * s,
      borderColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    itemSelected: { borderColor: "#FFE194", borderWidth: 4 * s },
    itemSlotInitial: { fontSize: 30 * s, fontWeight: "bold", color: "#5A3A1A" },
    itemIcon: { width: "80%", height: "80%", resizeMode: "contain" },
    ownedBadge: {
      position: "absolute",
      top: 2 * s,
      right: 4 * s,
      fontSize: 18 * s,
      color: "#2E7D32",
      fontWeight: "bold",
    },
    priceContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4 * s,
      marginTop: 4 * s,
    },
    smallCoinIcon: { width: 18 * s, height: 18 * s, resizeMode: "contain" },
    priceText: { fontSize: 14 * s, fontWeight: "bold", color: "#000" },

    textArea: { position: "absolute", top: "72%", left: "8%", right: "8%" },
    descriptionText: {
      fontSize: 20 * s,
      fontWeight: "bold",
      textAlign: "center",
      color: "#000",
      marginBottom: 4 * s,
      paddingHorizontal: 10 * s,
    },
    affordabilityText: {
      fontSize: 13 * s,
      fontWeight: "bold",
      color: "#7A2E2E",
      textAlign: "center",
      marginBottom: 6 * s,
      paddingHorizontal: 16 * s,
    },

    buttonRow: {
      position: "absolute",
      bottom: "1.5%",
      left: "3%",
      right: "3%",
      flexDirection: "row",
      gap: 8 * s,
    },
    buttonHalf: { flex: 1 },
    buttonImage: { width: "100%", height: 60 * s, resizeMode: "stretch" },
    buyButtonDisabled: { opacity: 0.4 },
  });
}