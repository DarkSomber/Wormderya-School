import React, { useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { ConveyorBelt } from '../components/gameplayReusables/ConveyorBelt';
import { useWordInput, CurrentWordDisplay } from '../components/gameplayReusables/WordInput';

const BELT_ROWS = [0, 1, 2];// how many belt rows

export default function GameplayScreen({ onOpenStore }) {
  // One ref per conveyor row. useWordInput only ever calls the ref's
  // existing getLetters()/removeLetterById() — it should never touch the CONVEYOR system
  const beltRef0 = useRef(null);
  const beltRef1 = useRef(null);
  const beltRef2 = useRef(null);
  const conveyorRefs = useRef([beltRef0, beltRef1, beltRef2]).current;

  const wordInput = useWordInput(conveyorRefs);

  const handleServePlate = () => {
    // Thematically: putting the built word "on the plate" and serving it
    // to the customer submits it for validation + scoring. Swap this for
    // a dedicated submit button any time without touching useWordInput. Please I hate myself for this
    wordInput.submitWord();
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>
        
        {/* 1. HEADER BANNER (Quit button on left, coins on right) */}
        <ImageBackground 
          source={require('../assets/Placeholder/TopBoard.png')}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          <Image 
            source={require('../assets/Placeholder/QuitButton.png')}
            style={styles.quitButton} 
          />
          <Image 
            source={require('../assets/Placeholder/pixel_coins.png')}
            style={styles.moneyIcon} 
          />
        </ImageBackground>

        {/* 2. TOP CHARACTER (Dog) */}
        <View style={styles.customerBox}>
          <Image 
          source={require('../assets/Placeholder/SampleCustomer_1.png')}
          style={styles.characterDog} 
          />
          <Image 
          source={require('../assets/Placeholder/CustomerPatienceBar_1.png')}
          style={styles.patienceMeter} 
          />
        </View>

        {/* Current word being built — purely presentational, reads
            straight off useWordInput's state. maxLetters is passed
            through so the row always shows the right number of slots
            (filled + blank placeholders), not just however many letters
            happen to be picked so far. */}
        <CurrentWordDisplay
          currentWord={wordInput.currentWord}
          lastResult={wordInput.lastResult}
          maxLetters={wordInput.maxLetters}
        />

        {/* 3. Table where plates are — tapping the plate serves/submits
            the current word for validation + scoring. */}
        <ImageBackground
        source={require('../assets/Placeholder/Table.png')}
        style={styles.table} 
        resizeMode='stretch'
        >
          <TouchableOpacity onPress={handleServePlate} activeOpacity={0.7}>
            <Image 
            source={require('../assets/Placeholder/Plate.png')}
            style={styles.plate} 
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. BOTTOM CHARACTER (Chef) */}
        <View style={styles.chefBar}>
          <Image 
            source={require('../assets/Placeholder/WormProtagonist_1.png')}
            style={styles.characterChef} 
          />
        </View>

        {/* 5. CONVEYOR BELT — each row is its own ConveyorBelt instance
            (movement/spawn/wrap-around owned entirely by that component).
            onLetterPress here does nothing but hand the tapped letter off
            to the Word Input System via wordInput.selectLetter — the
            belt itself doesn't know a Word Input System exists. */}
        {BELT_ROWS.map((row) => (
          <ImageBackground
            key={row}
            source={require('../assets/Placeholder/Conveyor.png')}
            style={styles.conveyor} 
            resizeMode="stretch"
          >
            <ConveyorBelt
              ref={conveyorRefs[row]}
              style={styles.conveyorBelt}
              config={{ maxLetters: 6, slotWidth: 70, slotHeight: 60 }} // Perfect size 6, 70, 60
              onLetterPress={(letter) => wordInput.selectLetter(letter, row)}
            />
          </ImageBackground>
        ))}

        <StatusBar style="light" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* 1 */
  screenWrapper: {
    flex: 1,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#b87b4e',
    alignItems: 'center',
    justifyContent: 'space-between', 
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  headerBackground: {
    width: '100%',
    height: 130,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  quitButton: {
    width: 90,
    height: 55,
    resizeMode: 'contain',
  },
  moneyIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },

  /* 2 */
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingHorizontal: 15,
  },
  characterDog: {
    width: 160, 
    height: 160,
    resizeMode: 'contain',
  },
  patienceMeter: {
    width: 94,
    height: 130,
    marginTop: -80,
    resizeMode: 'contain',
  },

  /* 3 */
  table: {
    width: '100%',
    height: 150,
    marginTop: -60,   // pulls the table up over the bottom of the dog image
    zIndex: 2,    
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plate: {
    width: 60,
    height: 60,
  },

  /* 4 */
  chefBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 15,
  },
  characterChef: {
    width: 115, // 
    height: 115,
    resizeMode: 'contain',
  },
  sideColumn: {
    gap: 8,
  },
  sideItem: {
    width: 36,
    height: 36,
  },

  /* 5 */
  conveyor: {
    width: '100%',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conveyorBelt: {
    alignSelf: 'center',
  },
});