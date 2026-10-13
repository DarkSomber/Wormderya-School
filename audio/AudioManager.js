/**
 * AudioManager
 * ----------------------------------------------------------------------
 * The one place the game plays sound. Three channels:
 *
 *   SFX    short one-shots (click, correct, win...). Preloaded, replayable.
 *   VOICE  customer lines (VA). ONE line at a time: new lines either wait
 *          in a small queue, play only if the channel is idle, or cut in.
 *   MUSIC  looping BGM with fades. One track at a time ('menu' | 'level').
 *
 * Volumes come from the Settings sliders:
 *   SFX    = master * sfx
 *   VOICE  = master * sfx   (voices ride the "Sound Effects" slider)
 *   MUSIC  = master * music
 *
 * Every public call is safe: a missing file, a failed load, or a browser
 * blocking autoplay is logged in dev and ignored. Audio never crashes the game.
 *
 * Files are listed in ./audioManifest.js, which is generated from the
 * assets/audio folders by `npm run audio` (scripts/generate-audio-manifest.js).
 * ----------------------------------------------------------------------
 */
import { AppState, Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { SFX, VA, BGM } from './audioManifest';

/* global __DEV__ */

// ---- Tuning ---------------------------------------------------------------
const DEFAULT_VOLUMES = { master: 0.8, music: 0.8, sfx: 0.8 };

// Optional per-sound settings.
//   pool       how many copies of the sound can overlap (rapid taps)
//   minGapMs   ignore a repeat that arrives sooner than this
const SFX_TUNING = {
  click: { pool: 2, minGapMs: 40 },
  serve_letters: { pool: 3, minGapMs: 30 },
  // Achievement modals can be mounted twice (gameplay + store): play once.
  trophy: { minGapMs: 800 },
};

const MUSIC_FADE_MS = 600;   // fade in/out when the track changes
const DUCK_LEVEL = 0.35;     // music volume while ducked (e.g. Ratty's shop)
const DUCK_FADE_MS = 250;
const TICK_MS = 50;

const VOICE_MAX_QUEUE = 3;       // lines waiting behind the current one
const VOICE_FALLBACK_MS = 8000;  // free the voice channel even if "finished" never arrives

// ---- State ----------------------------------------------------------------
const volumes = { ...DEFAULT_VOLUMES };
let persistHandler = null;
let initialised = false;

const sfxEntries = new Map();   // name -> { players: [], next, lastAt }
const voicePlayers = new Map(); // 'greetings_1' -> player
const tracks = new Map();       // 'menu' -> { key, player, level, target, playing }

let currentTrack = null;
const duck = { cur: 1, target: 1 };
let tickId = null;

let voiceCurrent = null;        // { key, player }
let voiceQueue = [];
let voiceTimer = null;

// ---- Helpers --------------------------------------------------------------
const clamp01 = (n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const sfxVolume = () => clamp01(volumes.master * volumes.sfx);
const voiceVolume = () => sfxVolume();
const musicVolume = () => clamp01(volumes.master * volumes.music);

const warnedMissing = new Set();
function warnMissing(kind, name) {
  const id = `${kind}:${name}`;
  if (warnedMissing.has(id)) return;
  warnedMissing.add(id);
  if (__DEV__) console.warn(`[Audio] no ${kind} file for "${name}" (run \`npm run audio\` after adding it)`);
}

function warn(err) {
  if (__DEV__) console.warn('[Audio]', err?.message ?? err);
}

// Run a player call, swallowing both thrown errors and rejected promises.
function safe(fn) {
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') result.catch(warn);
  } catch (err) {
    warn(err);
  }
}

function restart(player) {
  safe(() => player.seekTo(0));
  safe(() => player.play());
}

const approach = (cur, target, step) =>
  cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);

// ---- SFX ------------------------------------------------------------------
function getSfxEntry(name) {
  let entry = sfxEntries.get(name);
  if (entry) return entry;
  const source = SFX[name];
  if (!source) {
    warnMissing('sfx', name);
    return null;
  }
  const poolSize = SFX_TUNING[name]?.pool ?? 1;
  try {
    entry = {
      players: Array.from({ length: poolSize }, () => createAudioPlayer(source)),
      next: 0,
      lastAt: 0,
    };
  } catch (err) {
    warn(err);
    return null;
  }
  sfxEntries.set(name, entry);
  return entry;
}

function playSfx(name) {
  const volume = sfxVolume();
  if (volume <= 0) return;
  const entry = getSfxEntry(name);
  if (!entry) return;

  const now = Date.now();
  if (now - entry.lastAt < (SFX_TUNING[name]?.minGapMs ?? 0)) return;
  entry.lastAt = now;

  const player = entry.players[entry.next];
  entry.next = (entry.next + 1) % entry.players.length;
  safe(() => { player.volume = volume; });
  restart(player);
}

// ---- Voice (customer VA) ----------------------------------------------------
function getVoicePlayer(key) {
  let player = voicePlayers.get(key);
  if (player) return player;
  const source = VA[key];
  if (!source) {
    warnMissing('voice', key);
    return null;
  }
  try {
    player = createAudioPlayer(source);
  } catch (err) {
    warn(err);
    return null;
  }
  // When this line ends, move on to the next queued one. If the platform can't
  // report that, the fallback timer in startVoice() still frees the channel.
  try {
    player.addListener('playbackStatusUpdate', (status) => {
      if (status?.didJustFinish) finishVoice(player);
    });
  } catch (err) {
    warn(err);
  }
  voicePlayers.set(key, player);
  return player;
}

function startVoice(key) {
  const player = getVoicePlayer(key);
  if (!player || voiceVolume() <= 0) {
    voiceCurrent = null;
    const next = voiceQueue.shift();
    if (next) startVoice(next);
    return;
  }
  voiceCurrent = { key, player };
  safe(() => { player.volume = voiceVolume(); });
  restart(player);
  clearTimeout(voiceTimer);
  voiceTimer = setTimeout(() => finishVoice(player), VOICE_FALLBACK_MS);
}

function finishVoice(player) {
  if (!voiceCurrent || voiceCurrent.player !== player) return; // stale event
  clearTimeout(voiceTimer);
  voiceCurrent = null;
  const next = voiceQueue.shift();
  if (next) startVoice(next);
}

/**
 * playVoice('greetings', 2)  ->  plays greetings_2
 *   queue   wait behind whatever is playing (the usual choice for a scripted sequence)
 *   ifIdle  only play if nothing is playing, otherwise drop (casual reactions)
 *   neither cut off the current line and play now
 */
function playVoice(type, voiceId, { queue = false, ifIdle = false } = {}) {
  const key = `${type}_${voiceId}`;
  if (!VA[key]) {
    warnMissing('voice', key);
    return;
  }
  const busy = voiceCurrent !== null;
  if (busy && ifIdle) return;
  if (busy && queue) {
    if (voiceQueue.length < VOICE_MAX_QUEUE) voiceQueue.push(key);
    return;
  }
  if (busy) stopVoice();
  startVoice(key);
}

function stopVoice() {
  voiceQueue = [];
  clearTimeout(voiceTimer);
  if (voiceCurrent) {
    const { player } = voiceCurrent;
    voiceCurrent = null;
    safe(() => player.pause());
  }
}

// ---- Music ------------------------------------------------------------------
function getTrack(key) {
  let track = tracks.get(key);
  if (track) return track;
  const source = BGM[key];
  if (!source) {
    warnMissing('music', key);
    return null;
  }
  try {
    const player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0;
    track = { key, player, level: 0, target: 0, playing: false };
  } catch (err) {
    warn(err);
    return null;
  }
  tracks.set(key, track);
  return track;
}

function applyTrackVolume(track) {
  safe(() => { track.player.volume = clamp01(musicVolume() * duck.cur * track.level); });
}

function applyAllMusicVolumes() {
  tracks.forEach(applyTrackVolume);
}

function tick() {
  let active = false;

  if (duck.cur !== duck.target) {
    duck.cur = approach(duck.cur, duck.target, TICK_MS / DUCK_FADE_MS);
    active = true;
  }

  tracks.forEach((track) => {
    if (track.level !== track.target) {
      track.level = approach(track.level, track.target, TICK_MS / MUSIC_FADE_MS);
      active = true;
    }
    applyTrackVolume(track);
    // Fully faded out: stop it and rewind so it starts from the top next time.
    if (track.level === 0 && track.target === 0 && track.playing) {
      track.playing = false;
      safe(() => track.player.pause());
      safe(() => track.player.seekTo(0));
    }
  });

  if (!active) {
    clearInterval(tickId);
    tickId = null;
  }
}

function ensureTicking() {
  if (tickId === null) tickId = setInterval(tick, TICK_MS);
}

/** setMusic('menu' | 'level' | null). Same track again = no-op. null = fade out. */
function setMusic(key) {
  const wanted = key ?? null;
  if (wanted === currentTrack) return;

  if (currentTrack) {
    const old = tracks.get(currentTrack);
    if (old) old.target = 0;
  }

  currentTrack = wanted;
  if (wanted) {
    const track = getTrack(wanted);
    if (track) {
      track.target = 1;
      if (!track.playing) {
        track.playing = true;
        restart(track.player);
      }
    } else {
      currentTrack = null;
    }
  }
  ensureTicking();
}

/** Lower the music (true) or bring it back (false). Used while Ratty's shop is open. */
function setDuck(on) {
  duck.target = on ? DUCK_LEVEL : 1;
  ensureTicking();
}

// Re-issue play() on whatever should be audible (after an autoplay block or app resume).
function resumeMusic() {
  tracks.forEach((track) => {
    if (track.playing) safe(() => track.player.play());
  });
}

// ---- Volumes (Settings sliders) ---------------------------------------------
function getVolumes() {
  return { ...volumes };
}

function setVolumes(next = {}) {
  ['master', 'music', 'sfx'].forEach((k) => {
    if (typeof next[k] === 'number' && Number.isFinite(next[k])) volumes[k] = clamp01(next[k]);
  });
  applyAllMusicVolumes();
  if (voiceCurrent) safe(() => { voiceCurrent.player.volume = voiceVolume(); });
}

function setVolume(kind, value) {
  setVolumes({ [kind]: value });
}

/** App registers how to save volumes; sliders call commitVolumes() when released. */
function setPersistHandler(fn) {
  persistHandler = typeof fn === 'function' ? fn : null;
}

function commitVolumes() {
  persistHandler?.({ ...volumes });
}

// ---- Init ---------------------------------------------------------------------
function installWebUnlock() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const events = ['pointerdown', 'keydown', 'touchstart'];
  const unlock = () => {
    events.forEach((e) => document.removeEventListener(e, unlock, true));
    resumeMusic(); // browsers refuse to autoplay until the first tap/key
  };
  events.forEach((e) => document.addEventListener(e, unlock, true));
}

function init() {
  if (initialised) return;
  initialised = true;

  safe(() => setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false }));

  // Preload SFX so the first tap isn't late. Voice and music load on first use.
  Object.keys(SFX).forEach((name) => { if (SFX[name]) getSfxEntry(name); });

  // Pause music when the app (or browser tab) leaves the foreground.
  AppState.addEventListener('change', (state) => {
    tracks.forEach((track) => {
      if (!track.playing) return;
      safe(() => (state === 'active' ? track.player.play() : track.player.pause()));
    });
  });

  installWebUnlock();
}

const audio = {
  init,
  playSfx,
  playVoice,
  stopVoice,
  setMusic,
  setDuck,
  getVolumes,
  setVolumes,
  setVolume,
  setPersistHandler,
  commitVolumes,
};

export default audio;
