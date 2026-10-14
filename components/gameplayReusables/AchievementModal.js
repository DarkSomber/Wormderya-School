import React, { useEffect } from 'react';
import PopupModal from '../PopupModal';
import audio from '../../audio/AudioManager';

export default function AchievementModal({ visible, achievement, onDismiss }) {
  // Plays once per achievement shown (the AudioManager ignores the duplicate
  // when this modal is mounted twice, e.g. gameplay + store).
  const achievementId = achievement?.id;
  useEffect(() => {
    if (visible && achievementId) audio.playSfx('trophy');
  }, [visible, achievementId]);

  if (!achievement) return null;

  //Generic popup modal to be passed with arguments
  return (
    <PopupModal
      visible={visible}
      title="Achievement Unlocked!"
      message={achievement.title}
      extraMessage={achievement.description}
      buttonText="Nice!"
      buttonColor="#FFE194"
      onPress={onDismiss}
    />
  );
}