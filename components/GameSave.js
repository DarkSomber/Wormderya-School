import AsyncStorage from '@react-native-async-storage/async-storage';
/* global __DEV__ */

const SAVE_KEY = '@wormderya/save-v1';
// Where an unreadable (malformed) save is copied before the defaults overwrite it.
const BACKUP_KEY = '@wormderya/save-v1-corrupt';
const SAVE_VERSION = 1;

export const DEFAULT_SAVE = {
  version: SAVE_VERSION,
  unlockedLevels: [1],
  currentLevelId: 1,
  wallet: { currency: 0, priceStates: {} },
  upgrades: { owned: [], consumables: {} },
  achievements: { unlocked: [] },
  // Best score per level ('level-1'...) and for Rush Hour ('rushHour'). Drives the "new record" jingle.
  bestScores: {},
  // Settings-screen volume sliders, 0-1.
  settings: { master: 0.8, music: 0.8, sfx: 0.8 },
};

function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

// A fresh copy of the defaults that shares no nested objects with DEFAULT_SAVE
// (used for new games and resets, so nothing can mutate the constant).
export function createDefaultSave() {
  return safeClone(DEFAULT_SAVE);
}

export async function loadGameData() {
  let raw = null;
  try {
    raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultSave();
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) throw new Error('save is not an object');
    return mergeWithDefaults(parsed);
  } catch (err) {
    if (__DEV__) console.warn('[GameSave] load failed, using defaults:', err?.message);
    // Keep what was unreadable: the next save would otherwise overwrite it for good.
    if (raw) {
      Promise.resolve()
        .then(() => AsyncStorage.setItem(BACKUP_KEY, raw))
        .catch(() => {});
    }
    return createDefaultSave();
  }
}

// Writes are serialized and coalesced: only one setItem is in flight at a time,
// and saves that arrive meanwhile (or in the same tick, e.g. wallet + upgrades
// after a purchase) collapse into one write of the newest snapshot. So an older
// snapshot can never land after a newer one.
let latestPayload = null;
let activeWrite = null;

async function flushWrites() {
  let ok = true;
  try {
    await Promise.resolve(); // let same-tick saves coalesce
    while (latestPayload) {
      const payload = latestPayload;
      latestPayload = null;
      try {
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
        ok = true;
      } catch (err) {
        ok = false;
        if (__DEV__) console.warn('[GameSave] save failed:', err?.message);
      }
    }
  } finally {
    activeWrite = null;
  }
  return ok;
}

export function saveGameData(data) {
  latestPayload = { ...data, version: SAVE_VERSION };
  if (!activeWrite) activeWrite = flushWrites();
  return activeWrite;
}

export async function clearGameData() {
  latestPayload = null; // drop any save that hasn't started writing yet
  try {
    await activeWrite; // let a write already in flight finish, so it can't land after the clear
    await AsyncStorage.removeItem(SAVE_KEY);
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[GameSave] clear failed:', err?.message);
    return false;
  }
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function clamp01(n, fallback) {
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}

// Merge in-memory state over defaults so missing or malformed fields don't crash.
function mergeWithDefaults(saved) {
  const base = createDefaultSave();
  const levels = Array.isArray(saved.unlockedLevels)
    ? saved.unlockedLevels.filter((n) => Number.isInteger(n) && n >= 1)
    : [];
  return {
    version: SAVE_VERSION,
    unlockedLevels: levels.length ? levels : base.unlockedLevels,
    currentLevelId: Number.isInteger(saved.currentLevelId) ? saved.currentLevelId : base.currentLevelId,
    wallet: {
      currency: Number.isFinite(saved.wallet?.currency) && saved.wallet.currency >= 0
        ? saved.wallet.currency
        : base.wallet.currency,
      // Only the two states the wallet understands survive.
      priceStates: isPlainObject(saved.wallet?.priceStates)
        ? Object.fromEntries(
            Object.entries(saved.wallet.priceStates)
              .filter(([, v]) => v === 'discount' || v === 'inflated')
          )
        : base.wallet.priceStates,
    },
    upgrades: {
      owned: Array.isArray(saved.upgrades?.owned) ? saved.upgrades.owned.filter((s) => typeof s === 'string') : base.upgrades.owned,
      // Counts must be whole numbers > 0 (a string "2" would turn count + 1 into "21").
      consumables: isPlainObject(saved.upgrades?.consumables)
        ? Object.fromEntries(
            Object.entries(saved.upgrades.consumables)
              .filter(([, v]) => Number.isInteger(v) && v > 0)
          )
        : base.upgrades.consumables,
    },
    achievements: {
      unlocked: Array.isArray(saved.achievements?.unlocked)
        ? saved.achievements.unlocked.filter((s) => typeof s === 'string')
        : base.achievements.unlocked,
    },
    bestScores: Object.fromEntries(
      Object.entries(isPlainObject(saved.bestScores) ? saved.bestScores : {})
        .filter(([, v]) => Number.isFinite(v) && v > 0)
    ),
    settings: {
      master: clamp01(saved.settings?.master, base.settings.master),
      music: clamp01(saved.settings?.music, base.settings.music),
      sfx: clamp01(saved.settings?.sfx, base.settings.sfx),
    },
  };
}