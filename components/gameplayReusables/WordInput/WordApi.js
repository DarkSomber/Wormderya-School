import AsyncStorage from '@react-native-async-storage/async-storage';
import { HINTS, RIDDLES } from '../hints';
import { TAGALOG_WORD_DATABASE } from './TagalogWordDatabase';

const API = 'https://en.wiktionary.org/w/api.php';
const OK_CATEGORY = 'Category:Tagalog lemmas';
const BLOCKED = [
  'Category:Tagalog vulgarities',
  'Category:Tagalog swear words',
  'Category:Tagalog offensive terms',
  'Category:Tagalog slang',
  'Category:Tagalog back slang',
  'Category:Tagalog colloquialisms',
  'Category:Tagalog obsolete forms',
];
const CACHE_KEY = 'wormderya.validWords.v1';
const TIMEOUT_MS = 6000;
const HEADERS = {
  'User-Agent': 'Wormderya/1.0 (Student Project Game)',
  'Api-User-Agent': 'Wormderya/1.0 (Student Project Game)',
};

const valid = new Set();   
const invalid = new Set(); 

const offlineWords = new Set([
  ...TAGALOG_WORD_DATABASE,
  ...[...HINTS, ...RIDDLES].map((e) => e.answer),
]);

export async function loadWordCache() {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    JSON.parse(raw ?? '[]').forEach((w) => valid.add(w));
  } catch (e) {
    console.warn('[Words] cache load failed:', e?.message ?? e);
  }
}

export async function isOnline() {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API}?action=query&meta=siteinfo&format=json&origin=*`, {
      signal: ctrl.signal,
      headers: HEADERS,
    });
    if (__DEV__ && !res.ok) console.warn('[Words] probe HTTP', res.status);
    return true;
  } catch (e) {
    if (__DEV__) console.warn('[Words] probe failed:', e?.message ?? e);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function shouldShowOfflineNotice() {
  try {
    return !(await isOnline());
  } catch {
    return false;
  }
}

async function lookup(word) {
  const cats = [OK_CATEGORY, ...BLOCKED].join('|');
  const url =
    `${API}?action=query&format=json&origin=*&prop=categories&cllimit=max` +
    `&clcategories=${encodeURIComponent(cats)}` +
    `&titles=${encodeURIComponent(word.toLowerCase())}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: HEADERS,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const page = Object.values(json.query?.pages ?? {})[0];
    if (!page || page.missing !== undefined) return false;
    const names = (page.categories ?? []).map((c) => c.title);
    return names.includes(OK_CATEGORY) && !BLOCKED.some((b) => names.includes(b));
  } finally {
    clearTimeout(timer);
  }
}

export async function checkWord(word) {
  const w = word.toUpperCase();
  if (w.length < 2) return false;
  if (offlineWords.has(w) || valid.has(w)) return true;
  if (invalid.has(w)) return false;
  try {
    const ok = await lookup(w);
    if (ok) {
      valid.add(w);
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify([...valid])).catch(() => {});
    } else {
      invalid.add(w);
    }
    return ok;
  } catch (e) {
    console.warn('[Words] lookup failed:', e?.message ?? e);
    return false; 
  }
}