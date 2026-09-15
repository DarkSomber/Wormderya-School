import React from 'react';
import PopupModal from '../PopupModal';

export default function MrRattyDiscount({ visible, onDismiss }) {
  return (
      <PopupModal
      visible={visible}
      title={`Thank you for\nyour patronage!`}
      message="The next time Mr. Ratty will appear, prices will have a chance to get a discount."
      buttonText="Thank you!"
      buttonColor="#d51a1a" // Yellow
      onPress={onDismiss}
      />
    );
}