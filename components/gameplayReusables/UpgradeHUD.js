import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Text from "../AppText";
import { Slot } from "./Stage";
import { UPGRADE_LIST } from "./UseUpgrades";
import audio from "../../audio/AudioManager";

// Art-unit rects. Popup sits right of the stack, below the serve button.
const STACK = { x: 14, y: 486, w: 70, h: 177 };
const POPUP_GAP = 3;
const POPUP_W = 110;
const ICON = 60;
const GAP = 3;
const POPUP_MS = 4000;
const LOW_MS = 3000; // icon blinks at or below this

// Only upgrades the player has right now.
function liveItems({ ownedPermanent, activeList, extraHealth }) {
  const now = Date.now();
  const items = [];
  for (const u of UPGRADE_LIST) {
    if (u.type === "permanent") {
      if (ownedPermanent?.has(u.id))
        items.push({ u, badge: "ON", detail: "Permanent" });
    } else if (u.type === "temporary") {
      const a = activeList?.find((x) => x.id === u.id && x.expiresAt > now);
      if (a) {
        const ms = a.expiresAt - now;
        const s = Math.ceil(ms / 1000);
        items.push({
          u,
          badge: `${s}s`,
          detail: `Time left: ${s}s`,
          low: ms <= LOW_MS,
        });
      }
    } else if (u.id === "extra-health" && extraHealth > 0) {
      items.push({
        u,
        badge: `x${extraHealth}`,
        detail: `Owned: x${extraHealth}`,
      });
    }
  }
  return items;
}

// Fades in and out while `blink` is true.
function BlinkView({ blink, style, children }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!blink) {
      opacity.setValue(1);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [blink, opacity]);
  return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

export default function UpgradeHUD({ upgrades, scale }) {
  const [selected, setSelected] = useState(null);
  const items = liveItems(upgrades);
  const openIndex = items.findIndex((i) => i.u.id === selected);
  const open = items[openIndex];

  // Popup closes itself; the game keeps running underneath.
  useEffect(() => {
    if (!selected) return undefined;
    const t = setTimeout(() => setSelected(null), POPUP_MS);
    return () => clearTimeout(t);
  }, [selected]);

  if (items.length === 0) return null;
  const fs = (n) => Math.max(9, n * scale);

  return (
    <>
      <Slot rect={STACK} scale={scale}>
        {items.map(({ u, badge, low }) => (
          <TouchableOpacity
            key={u.id}
            activeOpacity={0.8}
            style={[styles.row, { marginBottom: GAP * scale }]}
            onPress={() => {
              audio.playSfx("click");
              setSelected(selected === u.id ? null : u.id);
            }}
          >
            <BlinkView
              blink={low}
              style={[
                styles.icon,
                { width: ICON * scale, height: ICON * scale },
                selected === u.id && styles.iconOn,
              ]}
            >
              <Image
                source={u.icon}
                style={styles.iconImg}
                resizeMode="contain"
              />
            </BlinkView>
            <Text style={[styles.badge, { fontSize: fs(8) }]}>{badge}</Text>
          </TouchableOpacity>
        ))}
      </Slot>

      {open && (
        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            left: (STACK.x + ICON + POPUP_GAP) * scale,
            top: (STACK.y + openIndex * (ICON + GAP)) * scale,
            width: POPUP_W * scale,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.popup, { minHeight: ICON * scale }]}
            onPress={() => setSelected(null)}
          >
            <Text style={[styles.title, { fontSize: fs(6) }]} numberOfLines={2}>
              {open.u.name}
            </Text>
            <View style={styles.divider} />
            <Text style={[styles.desc, { fontSize: fs(5) }]} numberOfLines={4}>
              {open.u.description}
            </Text>
            <Text style={[styles.detail, { fontSize: fs(5.5) }]}>
              {open.detail}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  icon: {
    borderWidth: 2,
    borderColor: "#7A2E2E",
    backgroundColor: "#FFE194",
    borderRadius: 6,
    padding: 2,
  },
  iconOn: { borderColor: "#000" },
  iconImg: { width: "100%", height: "100%" },
  badge: { marginLeft: 6, fontWeight: "900", color: "#3B1F0B" },
  popup: {
    backgroundColor: "#FFF8E7",
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 8,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { fontWeight: "bold", color: "#000", textAlign: "center" },
  divider: {
    width: "100%",
    height: 1.5,
    backgroundColor: "#333",
    marginVertical: 3,
  },
  desc: { fontWeight: "bold", color: "#000", textAlign: "center" },
  detail: {
    fontWeight: "bold",
    color: "#7A2E2E",
    textAlign: "center",
    marginTop: 3,
  },
});
