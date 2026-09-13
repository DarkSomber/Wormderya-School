import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground, Image,StatusBar } from 'react-native';
import RushHourModal from './RushHourModal';
import QuitModal from './QuitModal';
import LevelResultModal from './LevelResultModal';

export default function GameplayScreen({ onOpenStore }) {
// Modal visibility states
  const [showRushHour, setShowRushHour] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [levelResult, setLevelResult] = useState(null); // null | 'win' | 'lose'
  const playerScore = 1500; //Change to whatever number
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

      <View>

      {/* --- MODAL COMPONENTS --- */}

      {/* 1. Rush Hour Modal */}
      <RushHourModal
        visible={showRushHour}
        onDismiss={() => setShowRushHour(false)}
      />

      {/* 2. Quit Modal */}
      <QuitModal
        visible={showQuit}
        onQuit={() => setShowQuit(false)}
      />

      {/* 3. Level Result (Win / Game Over) Modal */}
      <LevelResultModal
        visible={levelResult !== null}
        type={levelResult || 'win'}
        score={playerScore}
        onConfirm={() => setLevelResult(null)}
      />

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
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  beltPlate: {
    width: 44,
    height: 44,
  },
});