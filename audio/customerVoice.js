/**
 * customerVoice
 * ----------------------------------------------------------------------
 * Decides WHICH customer line plays WHEN. Every voice file is
 * <type>_<n>, where n (1-3) is the customer: eating_1, goodbye_2, ...
 *
 *   greetings   a customer steps up                       (queued)
 *   satisfied   a dish was right (or haha, 30% of the time) (only if quiet)
 *   eating      the customer's LAST dish is served        (queued)
 *   goodbye     ...then they leave                        (queued)
 *   shocked     a wrong word was served                   (only if quiet)
 *   ehem        patience drops to "impatient"             (only if quiet)
 *   sighing     patience drops to "angry"                 (only if quiet)
 *
 * "only if quiet" = skipped when another voice line is still playing, so
 * reactions never pile up. To retune the game's voice, edit this file only.
 * ----------------------------------------------------------------------
 */
import audio from './AudioManager';

export const VOICE_COUNT = 3;

const HAHA_CHANCE = 0.3;

export const customerVoice = {
  greet(voice) {
    audio.playVoice('greetings', voice, { queue: true });
  },

  served(voice, { lastForCustomer }) {
    if (lastForCustomer) {
      audio.playVoice('eating', voice, { queue: true });
      audio.playVoice('goodbye', voice, { queue: true });
    } else {
      const type = Math.random() < HAHA_CHANCE ? 'haha' : 'satisfied';
      audio.playVoice(type, voice, { ifIdle: true });
    }
  },

  wrong(voice) {
    audio.playVoice('shocked', voice, { ifIdle: true });
  },

  // band: 'impatient' | 'angry'
  patience(voice, band) {
    audio.playVoice(band === 'angry' ? 'sighing' : 'ehem', voice, { ifIdle: true });
  },
};
