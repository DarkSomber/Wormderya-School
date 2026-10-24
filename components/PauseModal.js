import { useState, useEffect } from 'react';
import PopupModal from './PopupModal';
import VolumeSlider from './VolumeSlider';
import audio from '../audio/AudioManager';
import GrannyTutorial from './GrannyTutorial';
import QuitModal from './QuitModal';

function PauseVolumes() {
  const [vols, setVols] = useState(() => audio.getVolumes());

  const live = (kind) => (value) => {
    setVols((v) => ({ ...v, [kind]: value }));
    audio.setVolume(kind, value);
  };
  const save = (preview) => () => {
    audio.commitVolumes();
    if (preview) audio.playSfx('click');
  };

  return (
    <>
      <VolumeSlider label="Master Volume" value={vols.master} onValueChange={live('master')} onSlidingComplete={save(true)} style={{ marginBottom: 8 }} />
      <VolumeSlider label="Music Volume" value={vols.music} onValueChange={live('music')} onSlidingComplete={save(false)} style={{ marginBottom: 8 }} />
      <VolumeSlider label="Sound Effects (SFX)" value={vols.sfx} onValueChange={live('sfx')} onSlidingComplete={save(true)} style={{ marginBottom: 8 }} />
    </>
  );
}

export default function PauseModal({ visible, onResume, onExit, onRetry }) {
  // Exit asks "are you sure?" first, so a misclick can't throw the run away.
  // The pause card is hidden while the question is up (two modals at once can
  // fail to show on iOS); Never mind brings it back.
  const [confirmQuit, setConfirmQuit] = useState(false);

  // Never reopen straight on the question the next time the menu is shown.
  useEffect(() => {
    if (!visible) setConfirmQuit(false);
  }, [visible]);

  return (
    <>
      <PopupModal
        visible={visible && !confirmQuit}
        title="Paused"
        buttonText="Resume"
        buttonColor="#B7E4A7"
        onPress={onResume}
        cancelText="Exit"
        onCancel={() => setConfirmQuit(true)}
        cancelColor="#FFB3B3"
        extraText={onRetry ? 'Retry' : undefined}
        onExtra={onRetry}
        extraColor="#FFE194"
        overlayChildren={<GrannyTutorial />}
      >
        <PauseVolumes />
      </PopupModal>

      <QuitModal
        visible={visible && confirmQuit}
        onQuit={() => {
          setConfirmQuit(false);
          onExit?.();
        }}
        onCancel={() => setConfirmQuit(false)}
      />
    </>
  );
}