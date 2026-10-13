import { useEffect } from 'react';
import audio from './AudioManager';

/** useMusic('menu' | 'level' | null): asks the AudioManager for that track (fades between tracks). */
export function useMusic(track) {
  useEffect(() => {
    audio.setMusic(track);
  }, [track]);
}
