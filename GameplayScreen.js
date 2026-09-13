import React, {useState} from 'react';
import PopupModal from './PopupModal';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, ImageBackground } from 'react-native';

export default function GameplayScreen({ onOpenStore }) {
  const [showWinModal, setShowWinModal] = useState(false);
  const [showRushHourModal, setShowRushHourModal] = useState(false);
  const [showQuitModal, handleConfirmQuit] = useState(true);
  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>
        
        {/* 1. HEADER BANNER (Quit button on left, coins on right) */}
        <ImageBackground 
          source={require('./assets/Placeholder/TopBoard.png')}
          style={styles.headerBackground}
          resizeMode="stretch"
        >
          <Image 
            source={require('./assets/Placeholder/QuitButton.png')}
            style={styles.quitButton} 
          />
          <Image 
            source={require('./assets/Placeholder/pixel_coins.png')}
            style={styles.moneyIcon} 
          />
        </ImageBackground>

        {/* 2. TOP CHARACTER (Dog) */}
        <View style={styles.customerBox}>
          <Image 
          source={require('./assets/Placeholder/SampleCustomer_1.png')}
          style={styles.characterDog} 
          />
          <Image 
          source={require('./assets/Placeholder/CustomerPatienceBar_1.png')}
          style={styles.patienceMeter} 
          />
        </View>

        {/* 3. Table where plates are */}
        <ImageBackground
        source={require('./assets/Placeholder/Table.png')}
        style={styles.table} 
        resizeMode='stretch'
        >
          <Image 
          source={require('./assets/Placeholder/Plate.png')}
          style={styles.plate} 
          />
        </ImageBackground>

        {/* 4. BOTTOM CHARACTER (Chef) */}
        <View style={styles.chefBar}>
          <Image 
            source={require('./assets/Placeholder/WormProtagonist_1.png')}
            style={styles.characterChef} 
          />
          <View style={styles.sideColumn}>
            <Image source={require('./assets/Placeholder/BlankRectangle.png')} style={styles.sideItem} />
            <Image source={require('./assets/Placeholder/BlankRectangle.png')} style={styles.sideItem} />
            <Image source={require('./assets/Placeholder/BlankRectangle.png')} style={styles.sideItem} />
          </View>
        </View>

        {/* 5. CONVEYOR BELT */}
        {[0, 1, 2].map((row) => (
          <ImageBackground
            key={row}
            source={require('./assets/Placeholder/Conveyor.png')}
            style={styles.conveyor} 
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <Image 
                key={i}
                source={require('./assets/Placeholder/Plate.png')}
                style={styles.beltPlate} 
              />
            ))}
          </ImageBackground>
        ))}

        <StatusBar style="light" />
      </View>

      {/* Pop-ups */}
      <PopupModal
      visible={showWinModal}
      title="You WON!!!"
      extraMessage="Tomorrow is another day"
      score= '1000' // Dynamic state variable (e.g., 1000)
      buttonText="Yeah!"
      buttonColor="#FFE194"
      onPress={() => setShowWinModal(false)}
      />

      <PopupModal
      visible={showQuitModal}
      title={`Are you sure you\nwant to quit?`}
      message="All your current progress will disappear and will not be saved!"
      buttonText="Quit :("
      buttonColor="#FFB3B3" // Soft Red/Pink button
      onPress={() => handleConfirmQuit(false)}
      />

      <PopupModal
      visible={showRushHourModal}
      title={`Rush Hour!`}
      message="Time's against you!"
      extraMessage="The customers are hungry! Spell out words as fast as you can, remember the longer the better!"
      buttonText="Yeah!"
      buttonColor="#FFE194"
      onPress={() => setShowRushHourModal(false)}
      />
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
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  beltPlate: {
    width: 44,
    height: 44,
  },
});