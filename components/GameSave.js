import AsyncStorage from '@react-native-async-storage/async-storage';
/* global __DEV__ */

const SAVE_KEY = '@wormderya/save-v1';
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

export async function loadGameData() {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return safeClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return safeClone(DEFAULT_SAVE);
    return mergeWithDefaults(parsed);
  } catch (err) {
    if (__DEV__) console.warn('[GameSave] load failed, using defaults:', err?.message);
    return safeClone(DEFAULT_SAVE);
  }
}

export async function saveGameData(data) {
  try {
    const payload = { ...data, version: SAVE_VERSION };
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[GameSave] save failed:', err?.message);
    return false;
  }
}

export async function clearGameData() {
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
    return true;
  } catch (err) {
    if (__DEV__) console.warn('[GameSave] clear failed:', err?.message);
    return false;
  }
}

// Merge in-memory state over defaults so missing fields don't crash.
function mergeWithDefaults(saved) {
  const base = safeClone(DEFAULT_SAVE);
  return {
    version: SAVE_VERSION,
    unlockedLevels: Array.isArray(saved.unlockedLevels) && saved.unlockedLevels.length
      ? saved.unlockedLevels.filter((n) => Number.isInteger(n))
      : base.unlockedLevels,
    currentLevelId: Number.isInteger(saved.currentLevelId) ? saved.currentLevelId : base.currentLevelId,
    wallet: {
      currency: Number.isFinite(saved.wallet?.currency) ? saved.wallet.currency : base.wallet.currency,
      priceStates: saved.wallet?.priceStates && typeof saved.wallet.priceStates === 'object'
        ? saved.wallet.priceStates
        : base.wallet.priceStates,
    },
    upgrades: {
      owned: Array.isArray(saved.upgrades?.owned) ? saved.upgrades.owned.filter((s) => typeof s === 'string') : base.upgrades.owned,
      consumables: saved.upgrades?.consumables && typeof saved.upgrades.consumables === 'object'
        ? saved.upgrades.consumables
        : base.upgrades.consumables,
    },
    achievements: {
      unlocked: Array.isArray(saved.achievements?.unlocked)
        ? saved.achievements.unlocked.filter((s) => typeof s === 'string')
        : base.achievements.unlocked,
    },
    bestScores: Object.fromEntries(
      Object.entries(saved.bestScores && typeof saved.bestScores === 'object' ? saved.bestScores : {})
        .filter(([, v]) => Number.isFinite(v) && v > 0)
    ),
    settings: {
      master: Number.isFinite(saved.settings?.master) ? saved.settings.master : base.settings.master,
      music: Number.isFinite(saved.settings?.music) ? saved.settings.music : base.settings.music,
      sfx: Number.isFinite(saved.settings?.sfx) ? saved.settings.sfx : base.settings.sfx,
    },
  };
}