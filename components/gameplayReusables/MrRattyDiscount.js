import React, { useEffect } from 'react';
import PopupModal from '../PopupModal';
import audio from '../../audio/AudioManager';

//Changed because it's redundant
export default function MrRattyDiscount({ visible, onDismiss }) {
  useEffect(() => {
    if (visible) audio.playSfx('ratty_chirp');
  }, [visible]);

  return (
    <PopupModal
      visible={visible}
      title={`Mr. Ratty stops\nby to chat...`}
      message="He looks like he's judging your cooking. Best get back to it."
      buttonText="Get back to work"
      buttonColor="#FFE194"
      onPress={onDismiss}
    />
  );
}