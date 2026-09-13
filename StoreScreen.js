import React, { useState } from 'react';
import { StyleSheet, View, Image, ImageBackground, Text } from 'react-native';

import MrRattyDiscount from './MrRattyDiscount.js';
import MrRattyInflate from './MrRattyInflate';

export default function StoreScreen({ onBack }) {
  //change to true if you want to see the pop-up
  const [showRattyModal, setShowRattyModal] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>
        
        {/* 1. TOP SIGN */}
        <Image 
          source={require('./assets/Placeholder/TopBoard.png')} 
          style={styles.shopSign} 
        />

        {/* 2. MR. RATTY */}
        <Image 
          source={require('./assets/Placeholder/MrRatty.png')} 
          style={styles.ratMerchant} 
        />

        {/* 3. MAIN BOARD */}
        <ImageBackground 
          source={require('./assets/Placeholder/Board.png')} 
          style={styles.shopPanel}
          resizeMode="stretch"
        >
          {/* Coin Balance Header */}
          <View style={styles.coinHeader}>
            <Image source={require('./assets/Placeholder/pixel_coins.png')} style={styles.coinIcon} />
            <Text style={styles.coinText}>999</Text>
          </View>

          {/* 3 Shop Items Row */}
          <View style={styles.itemRow}>
            {/* Item 1 */}
            <View style={styles.itemSlotContainer}>
              <Image 
                source={require('./assets/Placeholder/SatisfactionBoost.png')} 
                style={[styles.itemBoxImage, styles.itemSelected]} 
              />
              <View style={styles.priceContainer}>
                <Image source={require('./assets/Placeholder/pixel_coins.png')} style={styles.smallCoinIcon} />
                <Text style={styles.priceText}>10</Text>
              </View>
            </View>

            {/* Item 2 */}
            <View style={styles.itemSlotContainer}>
              <Image 
                source={require('./assets/Placeholder/Clock.png')} 
                style={styles.itemBoxImage} 
              />
              <View style={styles.priceContainer}>
                <Image source={require('./assets/Placeholder/pixel_coins.png')} style={styles.smallCoinIcon} />
                <Text style={styles.priceText}>20</Text>
              </View>
            </View>

            {/* Item 3 */}
            <View style={styles.itemSlotContainer}>
              <Image 
                source={require('./assets/Placeholder/Multiplier.png')} 
                style={styles.itemBoxImage} 
              />
              <View style={styles.priceContainer}>
                <Image source={require('./assets/Placeholder/pixel_coins.png')} style={styles.smallCoinIcon} />
                <Text style={styles.priceText}>50</Text>
              </View>
            </View>
          </View>

          {/* Description Text */}
          <Text style={styles.descriptionText}>
            Customers have more patience
          </Text>

          {/* Buy Button PNG */}
          <Image 
            source={require('./assets/Placeholder/BuyButton.png')} 
            style={styles.buyButtonImage} 
          />
        </ImageBackground>

        {/* 4. BOTTOM "NO THANK YOU!" BUTTON PNG */}
        <Image 
          source={require('./assets/Placeholder/DeclineButton.png')} 
          style={styles.backButtonImage} 
        />

      </View>
      
      <MrRattyDiscount
        visible={showThankYouModal}
        onDismiss={() => setShowThankYouModal(false)}
      />

      <MrRattyInflate
        visible={showRattyModal}
        onDismiss={() => setShowRattyModal(false)}
      />
      
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#4A3B32',
    alignItems: 'center',
    justifyContent: 'flex-start', 
  },

  // 1. SIGN AT THE TOP
  shopSign: {
    width: '100%',
    height: 150,
    resizeMode: 'stretch',
  },

  // 2. MR. RATTY
  ratMerchant: {
    width: 380,
    height: 400,
    resizeMode: 'stretch',
    // Tucks Mr. Ratty slightly under the top ceiling board
    marginTop: -150, 
  },

  // 3. MAIN SHOP PANEL
  shopPanel: {
    width: '100%',
    height: 430,
    marginRight: 15,
    paddingVertical: 25,         // Adds comfortable top & bottom padding inside board
    paddingHorizontal: 15,
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'space-between',
    // FIX 2: Negative margin pulls the board UP to overlap Mr. Ratty's lower body
    marginTop: -67, 
  },
  coinHeader: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    gap: 9,
  },
  coinIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  coinText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  divider: {
    width: '90%',
    height: 2,
    backgroundColor: '#7A5230',
    marginVertical: 10,
  },

  // ITEMS
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    marginVertical: 10,
    marginLeft: 15,
  },
  itemSlotContainer: {
    alignItems: 'center',
  },
  itemBoxImage: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  smallCoinIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  priceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },

  // DESCRIPTION & BUY BUTTON
  descriptionText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginVertical: 10,
    marginLeft: 15,
    marginTop: -10,
  },
  buyButtonImage: {
    width: 170,
    height: 55,
    marginLeft: 15,
    marginBottom: 15,
    resizeMode: 'stretch',
  },

  // 4. BACK BUTTON
  backButtonImage: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
    marginTop: 12,
  },
});