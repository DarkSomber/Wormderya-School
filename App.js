import React, { useState } from 'react';
import GameplayScreen from './GameplayScreen'; 
import StoreScreen from './StoreScreen';      

export default function App() {
  // Switch between 'gameplay' and 'store'
  const [currentScreen, setCurrentScreen] = useState('store');

  if (currentScreen === 'store') {
    return <StoreScreen onBack={() => setCurrentScreen('gameplay')} />;
  }

  return <GameplayScreen onOpenStore={() => setCurrentScreen('store')} />;
}