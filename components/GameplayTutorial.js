import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import Text from "./AppText";
import AppButton from "./AppButton";
import HintBubble from "./gameplayReusables/HintBubble";
import AnimatedNpc from "./gameplayReusables/AnimatedNpc";
import { CurrentWordDisplay } from "./gameplayReusables/WordInput";
import "./gameplayReusables/ConveyorBelt";
import { getLetterSprite } from "./gameplayReusables/ConveyorBelt/Spriteloader";
import {
  Stage,
  Slot,
  GAMEPLAY_RECTS as R,
  PATIENCE_METER_BOX,
  ART_W,
  ART_H,
} from "./gameplayReusables/Stage";
import { LEVEL_1_CONFIG } from "../levels/levelPresets";
import audio from "../audio/AudioManager";

const GRANNY = require("../assets/Final/GrannyWorm.png");
const BG = require("../assets/Final/GameplayUI/GameplayScreen.png");
const QUIT = require("../assets/Final/buttons/buttonPause2.png");
const COIN_BOARD = require("../assets/Final/GameplayUI/CoinPatience.png");
const CONVEYORS = require("../assets/Final/GameplayUI/conveyors.png");
const PLATE = require("../assets/Final/GameplayUI/plate.png");
const SERVE_BUTTON = require("../assets/Final/GameplayUI/serve-button.png");
const CUSTOMER = require("../assets/Final/Customers/Customer1.png");
const CHEF = require("../assets/Final/MainCharacter.png");
const CHEF_WORRY = require("../assets/Final/MainCharacterWorryAnim.gif");
const MENU_BUTTON = require("../assets/Final/buttons/button.png");
const MOODS = {
  high: require("../assets/Final/GameplayUI/Patience_High.png"),
  low: require("../assets/Final/GameplayUI/Patience_Low.png"),
};

const PAD = 4;
const INSET = 3;
const GAP = 12;
const FOOTER_H = 84;
const COVER = "rgba(255,255,255,0.82)";
const EASE = Easing.inOut(Easing.cubic);
const HINT_TEXT = "Dito ka natutulog";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const GOAL_CUSTOMERS = LEVEL_1_CONFIG.totalCustomers;
const GOAL_PER_CUSTOMER = LEVEL_1_CONFIG.wordsPerCustomer;
const GOAL_WORDS = GOAL_CUSTOMERS * GOAL_PER_CUSTOMER;
const GOAL_SCORE = LEVEL_1_CONFIG.targetScore;

const BELTS = [
  ["TE", "KA", "KO", "SA", "KA"],
  ["E", "E", "S", "U", "O"],
  ["T", "Y", "R", "E", "I"],
];
const BELT_RECTS = [R.belt0, R.belt1, R.belt2];
const ALL_BELTS = { x: 0, y: 655, w: 512, h: 335 };
const COIN_TOP = { x: 326, y: 0, w: 186, h: 116 };
const PATIENCE = { x: 326, y: 116, w: 204, h: 564 };
const QUIT_SIGN = { x: 10, y: 10, w: 96, h: 96 }; 
const COUNTER = { x: 176, y: 484, w: 160, h: 66 };
const COUNTER_CHEF = { x: 176, y: 480, w: 354, h: 200 };

const NO_SLOTS = [];
const WORD = ["K", "A", "M", "A"].map((c, i) => ({
  id: `t${i}`,
  character: c,
}));
const WRONG_WORD = ["K", "A", "S", "A"].map((c, i) => ({
  id: `w${i}`,
  character: c,
}));
const WORD_HOLE = [
  { id: "t0", character: "K" },
  { id: "t1", character: "A" },
  { id: "t2", held: true },
  { id: "t3", character: "A" },
];

const STEPS = [
  {
    text: "Apo! Maligayang pagdating sa karinderya natin...",
    rect: null,
    big: true,
  },
  {
    text: "Halika tuturuan kita paano gumana ang karinderya natin...",
    rect: null,
    big: true,
  },
  {
    text: "Bago magsimula ang bawat level, makikita mo kung ilang customer at salita ang kailangan mong ihain, pati ang target na score...",
    rect: null,
    intro: true,
  },
  {
    text: "Pindutin mo ang iyong sarili para makita ulit kung ilan na ang naihain mo...",
    rect: COUNTER_CHEF,
    counter: true,
  },
  { text: "Lahat ng titik ay galing sa belt...", rect: ALL_BELTS },
  {
    text: "Ang unang belt ay may kombinasyon ng katinig at patinig...",
    rect: R.belt0,
  },
  { text: "Ang pangalawang belt ay halos puro patinig...", rect: R.belt1 },
  {
    text: "Ang pangatlo ay halo ng dalawa, pero isa-isang titik lang...",
    rect: R.belt2,
  },
  {
    text: "Kapag pinindot mo ang mga ito, mapupunta sila sa mesa...",
    rect: R.word,
    slots: WORD,
  },
  {
    text: "Tinutulungan ka ng hint, pero tatanggapin pa rin nila ang kahit anong ibigay mo. Kapag mali, ipapakita ng hint ang tamang sagot...",
    rect: R.hint,
    slots: WRONG_WORD,
    answer: "KAMA",
  },
  {
    text: "Pero mas malaki ang kita mo kapag tama ang naibigay mo...",
    rect: COIN_TOP,
    slots: WORD,
  },
  {
    text: "Kapag pinindot mo ang mga naihain nang titik, babalik sila sa belt...",
    rect: R.word,
    slots: WORD,
  },
  {
    text: "Pwede kang pumili ng bagong titik na ipapalit, sa pagpindot sa kahon kung saan mo ito gustong ilagay...",
    rect: R.word,
    slots: WORD_HOLE,
  },
  {
    text: "Gumagalaw ang patience meter. Kapag pumula na ito, mag-alala ka na, dahil matatalo ka pagkatapos...",
    rect: PATIENCE,
    slots: WORD,
    mood: "low",
  },
  {
    text: "Pindutin mo ito para i-pause ang laro...",
    rect: QUIT_SIGN,
  },
  {
    text: "Nandito lang ako sa settings at sa pause menu...",
    rect: QUIT_SIGN,
    showSettings: true,
  },
  { text: "Mahal kita, apo. Galingan mo, ha...", rect: null, big: true },
];

const StaticBelt = React.memo(function StaticBelt({ rect, letters, scale }) {
  return (
    <Slot rect={rect} scale={scale} scaleX={scale} scaleY={scale}>
      <View style={styles.beltRow}>
        {letters.map((ch, i) => {
          const sprite = getLetterSprite(ch);
          return (
            <View key={i} style={styles.beltCell}>
              <View style={styles.tile}>
                <Image
                  source={PLATE}
                  style={styles.plate}
                  resizeMode="contain"
                />
                {sprite ? (
                  <Image
                    source={sprite}
                    style={styles.food}
                    resizeMode="contain"
                  />
                ) : (
                  <Text style={[styles.tileText, { fontSize: 22 * scale }]}>
                    {ch}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </Slot>
  );
});

const Scene = React.memo(function Scene({ slots, mood, counter, answer, scale }) {
  const sx = { scale, scaleX: scale, scaleY: scale };
  const worried = mood === "low";
  const [wormReady, setWormReady] = useState(false);
  useEffect(() => {
    if (!worried) { setWormReady(false); return undefined; }
    const t = setTimeout(() => setWormReady(true), 400);
    return () => clearTimeout(t);
  }, [worried]);
  const pillFont = Math.max(13, 17 * scale);
  return (
    <Stage source={BG} w={ART_W * scale} h={ART_H * scale}>
      <Slot rect={R.quit} {...sx}>
        <Image source={QUIT} style={styles.quit} resizeMode="contain" />
      </Slot>

      <Slot rect={R.coin} {...sx}>
        <ImageBackground
          source={COIN_BOARD}
          style={styles.fill}
          resizeMode="stretch"
        >
          <View style={styles.coinNumber}>
            <Text style={[styles.coinText, { fontSize: 40 * scale }]}>0</Text>
          </View>
          <View style={[styles.abs, PATIENCE_METER_BOX]}>
            <Image
              source={MOODS[mood ?? "high"]}
              style={styles.fill}
              resizeMode="stretch"
            />
          </View>
        </ImageBackground>
      </Slot>

      <Slot
        rect={R.customer}
        {...sx}
        style={{ alignItems: "center", justifyContent: "flex-end" }}
      >
        <Image source={CUSTOMER} style={styles.customer} resizeMode="contain" />
      </Slot>

      <Slot rect={R.hint} {...sx}>
        <HintBubble text={HINT_TEXT} answer={answer} scale={scale} />
      </Slot>

      <Slot rect={R.word} {...sx}>
        <CurrentWordDisplay
          slots={slots}
          currentWord={slots}
          inputBoxCount={slots.length}
        />
      </Slot>

      <Slot rect={{ ...R.serve, y: 556 }} {...sx}>
        <Image source={SERVE_BUTTON} style={styles.fill} resizeMode="stretch" />
      </Slot>

      <Slot rect={R.chef} {...sx}>
        <Image
          source={CHEF}
          style={[styles.fill, { opacity: worried && wormReady ? 0 : 1 }]}
          resizeMode="contain"
        />
        {worried && (
          <AnimatedNpc
            source={CHEF_WORRY}
            npcKey="chef"
            unit={scale}
            worried
            animatedGif
            gifVisible={wormReady}
              onGifLoad={() => setWormReady(true)}
            imageStyle={{
              position: "absolute",
              left: "-23.4375%",
              top: "-18.75%",
              width: "137.5%",
              height: "125%",
              resizeMode: "stretch",
            }}
          />
        )}
      </Slot>

      <Slot rect={R.conveyors} {...sx}>
        <Image source={CONVEYORS} style={styles.fill} resizeMode="stretch" />
      </Slot>

      {BELT_RECTS.map((rect, i) => (
        <StaticBelt key={i} rect={rect} letters={BELTS[i]} scale={scale} />
      ))}

      {counter && (
        <Slot rect={COUNTER} {...sx} style={{ justifyContent: "center" }}>
          <View style={styles.pill}>
            <View style={styles.pillRow}>
              <Text
                style={[styles.pillLabel, { fontSize: pillFont }]}
                numberOfLines={1}
              >
                Customers
              </Text>
              <Text
                style={[styles.pillValue, { fontSize: pillFont }]}
                numberOfLines={1}
              >
                0/{GOAL_CUSTOMERS}
              </Text>
            </View>
            <View style={styles.pillRow}>
              <Text
                style={[styles.pillLabel, { fontSize: pillFont }]}
                numberOfLines={1}
              >
                Words
              </Text>
              <Text
                style={[styles.pillValue, { fontSize: pillFont }]}
                numberOfLines={1}
              >
                0/{GOAL_WORDS}
              </Text>
            </View>
            <View style={styles.pillTail} />
          </View>
        </Slot>
      )}
    </Stage>
  );
});

export default function GameplayTutorial({ onClose }) {
  const win = useWindowDimensions();
  const [layout, setLayout] = useState(null);
  const [index, setIndex] = useState(0);
  const [heights, setHeights] = useState({ big: 330, row: 150 });
  const [cardH, setCardH] = useState(190);

  const W = layout && layout.h > 0 && layout.w > 0 ? layout.w : win.width;
  const H = layout && layout.h > 0 && layout.w > 0 ? layout.h : win.height;

  const step = STEPS[index];
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const panelH = step.big ? heights.big : heights.row;

  const scale = Math.min(W / ART_W, H / ART_H);
  const ox = (W - ART_W * scale) / 2;
  const oy = (H - ART_H * scale) / 2;

  let hole = null;
  if (step.rect) {
    const x1 = Math.max(INSET, Math.round(ox + step.rect.x * scale - PAD));
    const y1 = Math.max(INSET, Math.round(oy + step.rect.y * scale - PAD));
    const x2 = Math.min(
      W - INSET,
      Math.round(ox + (step.rect.x + step.rect.w) * scale + PAD),
    );
    const y2 = Math.min(
      H - INSET,
      Math.round(oy + (step.rect.y + step.rect.h) * scale + PAD),
    );
    hole = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
  const target = hole ?? {
    x: Math.round(W / 2),
    y: Math.round(H / 2),
    w: 1,
    h: 1,
  };

  let introTop = 0;
  if (step.intro) {
    const group = cardH + GAP + panelH;
    introTop = Math.round(Math.max(40, (H - FOOTER_H - group) / 2));
  }

  let panelTarget;
  if (!hole) {
    panelTarget = step.intro
      ? introTop + cardH + GAP
      : Math.round((H - FOOTER_H - panelH) / 2);
  } else {
    const below = hole.y + hole.h + GAP;
    const above = hole.y - panelH - GAP;
    const fitsBelow = below + panelH <= H - FOOTER_H;
    const fitsAbove = above >= 40;
    const wantBelow = hole.y + hole.h / 2 <= H * 0.45;
    const t = wantBelow
      ? fitsBelow
        ? below
        : above
      : fitsAbove
        ? above
        : below;
    panelTarget = Math.round(Math.max(40, Math.min(t, H - FOOTER_H - panelH)));
  }

  const hx = useRef(new Animated.Value(Math.round(W / 2))).current;
  const hy = useRef(new Animated.Value(Math.round(H / 2))).current;
  const hw = useRef(new Animated.Value(1)).current;
  const hh = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const talk = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(panelTarget)).current;

  const covers = useMemo(() => {
    const mid = Animated.add(
      hy,
      Animated.add(Animated.divide(hh, 2), -H / 2),
    );
    const ratio = Animated.divide(hh, H);
    return {
      top: [{ translateY: Animated.add(hy, -H) }],
      bottom: [{ translateY: Animated.add(hy, hh) }],
      left: [
        { translateX: Animated.add(hx, -W) },
        { translateY: mid },
        { scaleY: ratio },
      ],
      right: [
        { translateX: Animated.add(hx, hw) },
        { translateY: mid },
        { scaleY: ratio },
      ],
    };
  }, [W, H]);

  const settingsY = useMemo(
    () => Animated.add(panelY, panelH + 16),
    [panelH],
  );

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 350,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  useEffect(() => {
    Animated.parallel(
      [
        [hx, target.x],
        [hy, target.y],
        [hw, target.w],
        [hh, target.h],
      ].map(([v, to]) =>
        Animated.timing(v, {
          toValue: to,
          duration: 450,
          easing: EASE,
          useNativeDriver: true,
        }),
      ),
    ).start();
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(ringOpacity, {
        toValue: hole ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, W, H]);

  useEffect(() => {
    Animated.timing(panelY, {
      toValue: panelTarget,
      duration: 450,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [panelTarget]);

  useEffect(() => {
    talk.setValue(0);
    Animated.timing(talk, {
      toValue: 1,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, talk]);

  const go = (next) => {
    ringOpacity.setValue(0);
    setIndex(next);
  };

  const handleBack = () => {
    audio.playSfx("click");
    go(Math.max(0, index - 1));
  };

  const handleNext = () => {
    audio.playSfx("click");
    if (isLast) onClose?.();
    else go(index + 1);
  };

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout((prev) =>
          prev && prev.w === width && prev.h === height
            ? prev
            : { w: width, h: height },
        );
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: ox, top: oy }}
      >
        <Scene
          slots={step.slots ?? NO_SLOTS}
          mood={step.mood}
          counter={!!step.counter}
          answer={step.answer}
          scale={scale}
        />
      </View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.fillAbs, { opacity: fade }]}
      >
        <Animated.View
          style={[
            styles.cover,
            { width: W, height: H, transform: covers.top },
          ]}
        />
        <Animated.View
          style={[
            styles.cover,
            { width: W, height: H, transform: covers.bottom },
          ]}
        />
        <Animated.View
          style={[
            styles.cover,
            { width: W, height: H, transform: covers.left },
          ]}
        />
        <Animated.View
          style={[
            styles.cover,
            { width: W, height: H, transform: covers.right },
          ]}
        />
        {hole && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.ring,
              {
                left: hole.x,
                top: hole.y,
                width: hole.w,
                height: hole.h,
                opacity: ringOpacity,
              },
            ]}
          />
        )}
      </Animated.View>

      {step.intro && (
        <Animated.View
          pointerEvents="none"
          style={[styles.introWrap, { top: introTop, opacity: talk }]}
        >
          <View
            style={styles.introCard}
            onLayout={(e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h !== cardH) setCardH(h);
            }}
          >
            <Text style={styles.introLabel}>
              {`Serve ${plural(GOAL_CUSTOMERS, "customer")}`}
            </Text>
            <Text style={styles.introSub}>
              {`${plural(GOAL_PER_CUSTOMER, "word")} for each customer\n` +
                `${plural(GOAL_WORDS, "word")} in total\n` +
                `Target score: ${GOAL_SCORE}`}
            </Text>
          </View>
        </Animated.View>
      )}

      {step.showSettings && (
        <Animated.View
          pointerEvents="none"
          style={[styles.settingsDemo, { transform: [{ translateY: settingsY }] }]}
        >
          <Animated.View style={{ opacity: talk }}>
            <View style={styles.settingsRing}>
              <AppButton label="SETTINGS" backgroundImage={MENU_BUTTON} />
            </View>
          </Animated.View>
        </Animated.View>
      )}

      <Animated.View
        pointerEvents="box-none"
        style={[styles.panel, { transform: [{ translateY: panelY }] }]}
      >
        <Animated.View
          onLayout={(e) => {
            const h = Math.round(e.nativeEvent.layout.height);
            const key = step.big ? "big" : "row";
            setHeights((prev) =>
              prev[key] === h ? prev : { ...prev, [key]: h },
            );
          }}
          style={[
            styles.talkRow,
            step.big && styles.talkColumn,
            {
              opacity: talk,
              transform: [
                {
                  translateY: talk.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.bubble, step.big && styles.bubbleBig]}>
            <Text style={styles.bubbleText}>{step.text}</Text>
            <View style={step.big ? styles.tailDown : styles.tail} />
          </View>
          <Image
            source={GRANNY}
            style={step.big ? styles.grannyBig : styles.granny}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={[styles.footer, { opacity: fade }]}
      >
        {isFirst ? (
          <View />
        ) : (
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.button}
            onPress={handleBack}
          >
            <Text style={styles.buttonText}>{"<-  Back"}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{isLast ? "Close" : "Next  ->"}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    
    backgroundColor: "#fff",
  },
  fillAbs: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  fill: { width: "100%", height: "100%" },
  abs: { position: "absolute" },
  cover: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: COVER,
  },
  ring: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#8a5a30",
    borderRadius: 0, // hole is a square cut-out; rounded ring left bright corner gaps
  },

  quit: { width: "100%", height: "100%" },
  customer: { width: "115%", height: "100%" },
  coinNumber: {
    position: "absolute",
    left: "46%",
    width: "48%",
    top: "10%",
    height: "15%",
    justifyContent: "center",
  },
  coinText: {
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "#000",
    textShadowRadius: 2,
    textShadowOffset: { width: 1, height: 1 },
  },

  beltRow: { flex: 1, flexDirection: "row" },
  beltCell: { flex: 1, alignItems: "center", justifyContent: "center" },
  tile: {
    width: "86%",
    height: "86%",
    alignItems: "center",
    justifyContent: "center",
  },
  plate: { position: "absolute", width: "100%", height: "100%" },
  food: { width: "70%", height: "70%" },
  tileText: { fontWeight: "400", color: "#4a2e0f" },

  pill: {
    backgroundColor: "#FFF8E7",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pillLabel: { color: "#2B1B0E" },
  pillValue: { color: "#2B1B0E", fontWeight: "700", marginLeft: 6 },
  pillTail: {
    position: "absolute",
    right: -7,
    bottom: 10,
    width: 12,
    height: 12,
    backgroundColor: "#FFF8E7",
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "#000",
    transform: [{ rotate: "45deg" }],
  },

  introWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  introCard: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "#f3e6cf",
  },
  introLabel: {
    fontSize: 26,
    fontWeight: "700",
    color: "#5c3a21",
    textAlign: "center",
    marginBottom: 10,
  },
  introSub: {
    fontSize: 20,
    color: "#4a2d17",
    textAlign: "center",
    lineHeight: 28,
  },

  settingsDemo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  settingsRing: {
    padding: 6,
    borderWidth: 3,
    borderColor: "#8a5a30",
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  panel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  talkRow: { flexDirection: "row", alignItems: "flex-end" },
  talkColumn: { flexDirection: "column", alignItems: "center" },
  bubble: {
    flex: 1,
    marginRight: 12,
    marginBottom: 30,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "#FFF8E7",
  },
  bubbleBig: {
    flex: 0,
    alignSelf: "stretch",
    marginRight: 0,
    marginBottom: 14,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2B1B0E",
    textAlign: "center",
  },
  tail: {
    position: "absolute",
    right: -7,
    bottom: 22,
    width: 12,
    height: 12,
    backgroundColor: "#FFF8E7",
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: "#000",
    transform: [{ rotate: "45deg" }],
  },
  tailDown: {
    position: "absolute",
    bottom: -7,
    alignSelf: "center",
    width: 12,
    height: 12,
    backgroundColor: "#FFF8E7",
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: "#000",
    transform: [{ rotate: "45deg" }],
  },
  granny: { width: 110, height: 110 },
  grannyBig: { width: 180, height: 180 },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingBottom: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#8a5a30",
    backgroundColor: "rgba(245, 236, 214, 0.95)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5c3a21",
    textAlign: "center",
  },
});