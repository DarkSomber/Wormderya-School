import React from 'react';
import PopupModal from '../PopupModal';

export default function AchievementModal({ visible, achievement, onDismiss }) {
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