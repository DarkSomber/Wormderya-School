import { useState } from 'react';
import PopupModal from './PopupModal';
import VolumeSlider from './VolumeSlider';
import audio from '../audio/AudioManager';
import GrannyTutorial from './GrannyTutorial';

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

export default function PauseModal({ visible, onResume, onExit }) {
  return (
    <PopupModal
      visible={visible}
      title="Paused"
      buttonText="Resume"
      buttonColor="#B7E4A7"
      onPress={onResume}
      cancelText="Exit"
      onCancel={onExit}
      cancelColor="#FFB3B3"
      overlayChildren={<GrannyTutorial />}
    >
      <PauseVolumes />
    </PopupModal>
  );
}
