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

const DESIGN_WIDTH = 400;
// Shrinks or grows the whole item box (art, icon, price). Lower = smaller.

const NO_UPGRADES = {
  getBasePrice: (u) => u.price,
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

const SHOP_BACKGROUND = require("../assets/Final/RattyBodega/BackgroundRattyStall.png");
const SHOP_STALL = require("../assets/Final/RattyBodega/RattyStall.png");
const SHOP_RATTY = require("../assets/Final/RattyBodega/MrRatty.png");
const BOX_SINGLE = require("../assets/Final/RattyBodega/BoxPlacerSingle.png");
const PRICE_ARROW = require("../assets/Final/buttons/buttonLevelSelectBack.png");

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
  const renderArrow = (dir, size = 1) =>
    dir ? (
      <Image
        source={PRICE_ARROW}
        style={[
          styles.priceArrow,
          {
            transform: [
              { rotate: dir === "up" ? "-90deg" : "90deg" },
              { scale: size },
            ],
          },
        ]}
      />
    ) : null;

  const [rattyOutcome, setRattyOutcome] = useState(null);
  // Three random offers, chosen once per visit to the store.
  const [offers] = useState(() => pickRandom(UPGRADE_LIST, 3));
  const [selectedId, setSelectedId] = useState(offers[0].id);
  const [feedback, setFeedback] = useState(null); // last action result, shown in status line

  const selected = offers.find((u) => u.id === selectedId) || offers[0];
  const selectedBase = safeUpgrades.getBasePrice(selected);
  const price = wallet.getEffectivePrice(selected.id, selectedBase);
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

    const result = safeUpgrades.buyUpgrade(
      selected,
      offers.map((u) => u.id),
    );

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

  const priceDir =
    price > selectedBase ? "up" : price < selectedBase ? "down" : null;

  const statusLine = owned
    ? "OWNED"
    : active
      ? "ACTIVE"
      : feedback
        ? feedback.text
        : null;

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
          <View style={styles.coinBoxOuter}>
            <View style={styles.coinBox}>
              <Text style={styles.coinText} numberOfLines={1}>
                {formatCurrency(wallet.currency)}
              </Text>
              <Image
                source={require("../assets/Placeholder/pixel_coins.png")}
                style={styles.coinIcon}
              />
            </View>
          </View>
        </View>

        {/* Three random offers, lined up with the boxes in the picture */}
        <View style={styles.boxesRow}>
          {offers.map((item) => {
            const itemOwned = safeUpgrades.ownedPermanent.has(item.id);
            const itemBase = safeUpgrades.getBasePrice(item);
            const itemPrice = wallet.getEffectivePrice(item.id, itemBase);
            const onSale = itemPrice < itemBase;
            const pricedUp = itemPrice > itemBase;
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
                <View style={styles.itemBox}>
                <Image
                  source={BOX_SINGLE}
                  style={styles.boxArt}
                  pointerEvents="none"
                />
                {selectedId === item.id && (
                  <View style={styles.boxSelected} pointerEvents="none" />
                )}
                <View style={styles.boxHighlight}>
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
                  <Text style={styles.priceText}>{itemPrice}</Text>
                  {renderArrow(pricedUp ? "up" : onSale ? "down" : null)}
                </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Name, description, status */}
        <View style={styles.textArea}>
          <View style={styles.textBox}>
          <Text style={styles.descriptionText}>{selected.name}</Text>
          <Text style={styles.affordabilityText}>{selected.description}</Text>
          <View style={styles.statusRow}>
            {statusLine !== null ? (
              <Text
                style={[
                  styles.affordabilityText,
                  { color: statusColor, marginBottom: 0 },
                ]}
              >
                {statusLine}
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.affordabilityText,
                    { color: statusColor, marginBottom: 0 },
                  ]}
                >
                  {price} coins
                </Text>
                {renderArrow(priceDir)}
                {!affordable && (
                  <Text
                    style={[
                      styles.affordabilityText,
                      { color: statusColor, marginBottom: 0 },
                    ]}
                  >
                    {" — not enough coins"}
                  </Text>
                )}
              </>
            )}
          </View>
          </View>
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

function createStyles(s, w, h) {

  const CONTENT_W = 80 * s;
  const ICON_H = 60 * s;
  const GAP = 4 * s; 
  const PRICE_H = 20 * s;
  const CONTENT_H = ICON_H + GAP + PRICE_H;
  const COIN_TEXT = 22 * s; 
  const COIN_ICON = 32 * s; 
  const COIN_PAD_X = 12 * s; 
  const COIN_PAD_Y = 1 * s; 
  const COIN_BORDER = 3 * s; 


  const ART_W = 92 * s; 
  const ART_H = 96 * s; 
  const ART_X = 0; 
  const ART_Y = 0; 
  const IMG = 124 / 116; 
  const artLeft = (CONTENT_W - ART_W) / 2 + ART_X;
  const artTop = (CONTENT_H - ART_H) / 2 + ART_Y;
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

    coinHeader: {
      position: "absolute",
      top: "49%",
      left: 0,
      right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    coinBoxOuter: {
      borderWidth: COIN_BORDER,
      borderColor: "#A05634",
      borderRadius: 8 * s,
    },
    coinBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7 * s,
      paddingHorizontal: COIN_PAD_X,
      paddingVertical: COIN_PAD_Y,
      borderWidth: COIN_BORDER,
      borderColor: "#793718",
      borderRadius: 5 * s,
      backgroundColor: "#FFCBB1",
    },
    coinIcon: { width: COIN_ICON, height: COIN_ICON, resizeMode: "contain" },
    coinText: {
      fontSize: COIN_TEXT,
      fontWeight: "bold",
      color: "#5A2A10",
    },
    boxesRow: {
      position: "absolute",
      top: "57.2%",
      left: "4.5%",
      right: "4.5%",
      height: "13.8%",
      flexDirection: "row",
      alignItems: "center",
    },
    boxSlot: { flex: 1, alignItems: "center" },
    itemBox: {
      width: CONTENT_W,
      height: CONTENT_H,
      alignItems: "center",
    },
    boxArt: {
      position: "absolute",
      left: artLeft - (ART_W * (IMG - 1)) / 2,
      top: artTop - (ART_H * (IMG - 1)) / 2,
      width: ART_W * IMG,
      height: ART_H * IMG,
      resizeMode: "stretch",
    },
    boxSelected: {
      position: "absolute",
      left: artLeft - 4 * s,
      top: artTop - 4 * s,
      width: ART_W + 8 * s,
      height: ART_H + 8 * s,
      borderWidth: 4 * s,
      borderColor: "#FFE194",
      borderRadius: 8 * s,
    },
    boxHighlight: {
      width: CONTENT_W,
      height: ICON_H,
      alignItems: "center",
      justifyContent: "center",
    },
    itemSlotInitial: { fontSize: 30 * s, fontWeight: "bold", color: "#5A3A1A" },
    itemIcon: { width: "90%", height: "90%", resizeMode: "contain" },
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
      marginTop: GAP,
      height: PRICE_H,
    },
    smallCoinIcon: { width: 18 * s, height: 18 * s, resizeMode: "contain" },
    priceText: { fontSize: 14 * s, fontWeight: "bold", color: "#000" },
    textArea: {
      position: "absolute",
      top: "72.5%",
      height: "13.5%",
      left: "4.5%",
      right: "4.5%",
      borderWidth: 4 * s,
      borderColor: "#A05634",
      borderRadius: 10 * s,
    },
    textBox: {
      flex: 1,
      borderWidth: 4 * s,
      borderColor: "#793718",
      borderRadius: 6 * s,
      backgroundColor: "#FFCBB1",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4 * s,
    },
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
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 6 * s,
    },
    priceArrow: {
      width: 20 * s,
      height: 20 * s,
      resizeMode: "contain",
      marginBottom: 2,
    },
  });
}