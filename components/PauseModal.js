import React from 'react';
import PopupModal from './PopupModal';

/**
 * PauseModal
 * -----------
 * Same PopupModal base as QuitModal — "Resume" is the primary button
 * (closes the modal, nothing else), "Quit" is the secondary/cancel-
 * styled button. Tapping "Quit" here does NOT quit immediately — it
 * hands off to onQuitPress so the caller can show the existing
 * QuitModal confirmation on top of it, same as tapping the header Quit
 * button would. That way there's still exactly one quit confirmation
 * step, not two stacked modals or a quit with no confirmation at all.
 */
export default function PauseModal({ visible, onResume, onQuitPress }) {
  return (
    <PopupModal
      visible={visible}
      title="Paused"
      buttonText="Resume"
      buttonColor="#B7E4A7"
      onPress={onResume}
      cancelText="Quit"
      onCancel={onQuitPress}
    />
  );
}