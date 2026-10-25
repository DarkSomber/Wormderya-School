import React from 'react';
import PopupModal from '../components/PopupModal';

export default function RushHourModal({ visible, onDismiss, onBack, highScore = 0 }) {
  return (
    <PopupModal
      visible={visible}
      title="RUSH HOUR!"
      message={`Time's against you!\nHigh score: ${highScore}`}
      extraMessage="The customers are hungry! Spell out words as fast as you can, remember the longer the better!"
      buttonText="Yeah!"
      buttonColor="#FFE194"
      onPress={onDismiss}
      cancelText="Back"
      onCancel={onBack}
    />
  );
}