# Wormderya audio

## Folders (drop your files here)

```
assets/audio/
  sfx/   click.wav  correct.wav  lose.wav  new_record.wav  ratty_buy.wav  ratty_chirp.wav
         ratty_ignore.wav  ratty_shop_appear.wav  serve_letters.wav  serve_word.wav
         trophy.wav  win.wav  wrong.wav
  va/    eating_1 ... sighing_3     (8 line types x 3 customers = 24 files)
  bgm/   one file with "menu" in its name, one with "level" (or game / play) in its name
```

Any of .wav .mp3 .ogg .m4a .aac .flac works. After adding or renaming files run:

    npm run audio

(`npm start`, `android`, `ios` and `web` run it for you.) It rewrites `audio/audioManifest.js`
and prints anything that is missing. A missing file never crashes the game; it is just silent.

## What plays when

| Sound | Trigger |
|---|---|
| `click` | any menu / popup / back button, returning a tile to the belt |
| `serve_letters` | a tile is picked from the belt onto the plate |
| `serve_word` | a word is served (Serve button or auto-submit) |
| `correct` / `wrong` | the word was valid / invalid |
| `win` / `lose` | level cleared / out of time (Rush Hour's "Time's up" uses `lose`) |
| `new_record` | beat your previous best (replaces `win`/`lose` that time); shows "NEW RECORD!" |
| `trophy` | achievement unlocked |
| `ratty_chirp` | Mr. Ratty stops by mid-level |
| `ratty_shop_appear` | the shop opens |
| `ratty_buy` / `ratty_ignore` | bought something / declined |
| `wrong` | tried to buy something unaffordable or already owned |

| Voice (`_1`..`_3` = customer) | Trigger |
|---|---|
| `greetings` | a customer steps up |
| `satisfied` (or `haha`, 30%) | a correct word, if no other voice is playing |
| `eating`, then `goodbye` | the customer's last word; the next greeting follows |
| `shocked` | wrong word |
| `ehem` | patience drops to "impatient" |
| `sighing` | patience drops to "angry" |

| Music | Where |
|---|---|
| menu | Home, Mode Select, Settings, Level Select, backstory, and Ratty's shop after a level |
| level | while a level is being played (silent during Ready/Set/GO and the end card) |

Volumes: Master x Music for BGM, Master x SFX for sound effects **and** voices.
Sliders apply live and are saved when released.

## Where to change things

- Which voice line fires when: `audio/customerVoice.js`
- Per-sound overlap / debounce, fade times, music ducking: top of `audio/AudioManager.js`
- Which voice a customer sprite uses: `voice` in `CUSTOMER_SPRITES` (`screens/GameplayScreen.js`)
