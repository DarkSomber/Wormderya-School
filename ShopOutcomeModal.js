import React from 'react';
import PopupModal from './PopupModal';

export default function ShopOutcomeModal({ visible, outcome, onDismiss }) {
  const isInflate = outcome === 'inflate';

  return (
    <PopupModal
      visible={visible}
      title={isInflate ? "Mr. Ratty will\nremember you" : "Thank you for\nyour patronage!"}
      message={
        isInflate 
          ? "The next time Mr. Ratty will appear, prices will have a chance to inflate."
          : "The next time Mr. Ratty will appear, prices will have a chance to get a discount."
      }
      buttonText={isInflate ? "uh..." : "Thank you!"}
      buttonColor="#FFE194"
      onPress={onDismiss}
    />
  );
}