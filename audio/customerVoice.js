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

  patience(voice, band) {
    audio.playVoice(band === 'angry' ? 'sighing' : 'ehem', voice, { ifIdle: true });
  },
};
