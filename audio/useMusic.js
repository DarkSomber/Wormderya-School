import { useEffect } from 'react';
import audio from './AudioManager';

export function useMusic(track) {
  useEffect(() => {
    audio.setMusic(track);
  }, [track]);
}
