import React from 'react';
import PopupModal from '../PopupModal';

//Changed because it's redundant
export default function MrRattyDiscount({ visible, onDismiss }) {
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