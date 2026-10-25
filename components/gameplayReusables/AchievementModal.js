import React, { useEffect } from 'react';
import PopupModal from '../PopupModal';
import audio from '../../audio/AudioManager';

export default function AchievementModal({ visible, achievement, onDismiss }) {
  const achievementId = achievement?.id;
  useEffect(() => {
    if (visible && achievementId) audio.playSfx('trophy');
  }, [visible, achievementId]);

  if (!achievement) return null;

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