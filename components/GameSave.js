import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_KEY = '@wormderya/save-v1';
const BACKUP_KEY = '@wormderya/save-v1-corrupt';
const SAVE_VERSION = 1;

export const DEFAULT_SAVE = {
  version: SAVE_VERSION,
  tutorialSeen: false,
  unlockedLevels: [1],
  currentLevelId: 1,
  wallet: { currency: 0, priceStates: {} },
  upgrades: { owned: [], consumables: {} },
  achievements: { unlocked: [] },
  bestScores: {},
  settings: { master: 0.8, music: 0.8, sfx: 0.8 },
};

function safeClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

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
    if (raw) {
      Promise.resolve()
        .then(() => AsyncStorage.setItem(BACKUP_KEY, raw))
        .catch(() => {});
    }
    return createDefaultSave();
  }
}

let latestPayload = null;
let activeWrite = null;

async function flushWrites() {
  let ok = true;
  try {
    await Promise.resolve();
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
  latestPayload = null;
  try {
    await activeWrite;
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

function mergeWithDefaults(saved) {
  const base = createDefaultSave();
  const levels = Array.isArray(saved.unlockedLevels)
    ? saved.unlockedLevels.filter((n) => Number.isInteger(n) && n >= 1)
    : [];
  return {
    version: SAVE_VERSION,
    tutorialSeen: saved.tutorialSeen === undefined ? true : saved.tutorialSeen === true,
    unlockedLevels: levels.length ? levels : base.unlockedLevels,
    currentLevelId: Number.isInteger(saved.currentLevelId) ? saved.currentLevelId : base.currentLevelId,
    wallet: {
      currency: Number.isFinite(saved.wallet?.currency) && saved.wallet.currency >= 0
        ? saved.wallet.currency
        : base.wallet.currency,
      priceStates: isPlainObject(saved.wallet?.priceStates)
        ? Object.fromEntries(
            Object.entries(saved.wallet.priceStates)
              .filter(([, v]) => v === 'discount' || v === 'inflated')
          )
        : base.wallet.priceStates,
    },
    upgrades: {
      owned: Array.isArray(saved.upgrades?.owned) ? saved.upgrades.owned.filter((s) => typeof s === 'string') : base.upgrades.owned,
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