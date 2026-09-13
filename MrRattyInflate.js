import React from 'react';
import PopupModal from './PopupModal';

export default function MrRattyInflate({ visible, onDismiss }) {
  return (
      <PopupModal
      visible={visible}
      title={`Mr. Ratty will\nremember you`}
      message="The next time Mr. Ratty will appear, prices will have a chance to inflate."
      buttonText="uh..."
      buttonColor="#FFE194" // Yellow
      onPress={onDismiss}
      />
    );
}