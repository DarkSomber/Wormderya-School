import React from 'react';
import PopupModal from './PopupModal';

export default function LevelResultModal({ visible, type = 'win', score, onConfirm }) {
  const isWin = type === 'win';

  return (
    <PopupModal
      visible={visible}
      title={isWin ? "You WON!!!" : "GAME OVER"}
      message={isWin ? "Tomorrow is another day" : "Don't give up!"}
      score={score}
      buttonText={isWin ? "Yeah!" : "Try Again"}
      buttonColor={isWin ? "#FFE194" : "#FFB3B3"}
      onPress={onConfirm}
    />
  );
}