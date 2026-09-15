import React from 'react';
import PopupModal from './PopupModal';

export default function QuitModal({ visible, onQuit, onCancel }) {
  return (
    <PopupModal
      visible={visible}
      title={`Are you sure you\nwant to quit?`}
      message="All your current progress will disappear and will not be saved!"
      buttonText="Quit :("
      buttonColor="#FFB3B3"
      onPress={onQuit}
      cancelText="Never mind"
      onCancel={onCancel}
    />
  );
}