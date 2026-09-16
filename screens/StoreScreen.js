import React, { useState } from 'react';
import ShopOutcomeModal from './ShopOutcomeModal.js';
import { StyleSheet, View, Image, ImageBackground, TouchableOpacity, Text } from 'react-native';

// Same 3 items/prices that used to be hardcoded directly in the JSX,
// now data so each item slot can be selected instead of only item 1
// ever being "chosen" (which never even showed, since `itemSelected`
// wasn't a real style before now).
const SHOP_ITEMS = [
  {
    id: 'satisfaction-boost',
    image: require('../assets/Placeholder/SatisfactionBoost.png'),
    basePrice: 10,
    description: 'Customers have more patience',
  },
  {
    id: 'extra-time',
    image: require('../assets/Placeholder/Clock.png'),
    basePrice: 20,
    description: 'Adds a few seconds to the clock',
  },
  {
    id: 'score-multiplier',
    image: require('../assets/Placeholder/Multiplier.png'),
    basePrice: 50,
    description: 'Doubles points from words for a short while',
  },
];
const ALL_ITEM_IDS = SHOP_ITEMS.map((item) => item.id);

/**
 * StoreScreen
 * -----------
 * `wallet` is the useWallet() instance created once in App.js — passed
 * down as a prop rather than instantiated here, since this screen gets
 * unmounted/remounted on every trip to/from Gameplay, and currency +
 * discount/inflate marks need to survive that.
 */
export default function StoreScreen({ onBack, wallet }) {
  // null = hidden | 'inflate' = price rise | 'discount' = price drop
  const [rattyOutcome, setRattyOutcome] = useState(null);

  // Which item is currently highlighted — defaults to the first one so
  // the screen still looks the same as before on first render.
  const [selectedItemId, setSelectedItemId] = useState(SHOP_ITEMS[0].id);
  const selectedItem = SHOP_ITEMS.find((item) => item.id === selectedItemId);
  const selectedPrice = wallet.getEffectivePrice(selectedItem.id, selectedItem.basePrice);
  const affordable = wallet.canAfford(selectedItem.id, selectedItem.basePrice);

  const handleBuy = () => {
    const result = wallet.buyItem(selectedItem.id, selectedItem.basePrice, ALL_ITEM_IDS);
    if (result.success) setRattyOutcome('discount');
    // insufficient funds: Buy is disabled below when !affordable, so
    // this branch shouldn't actually fire in normal use.
  };

  const handleDecline = () => {
    wallet.declineOffer(ALL_ITEM_IDS);
    setRattyOutcome('inflate');
  };

  return (
    <View style={styles.screenWrapper}>
      <View style={styles.container}>

        {/* Back button — leaves the shop at any point without buying,
            independent of the "No thank you!" button below (which only
            declines Mr. Ratty's specific offer and stays on this screen) */}
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButtonWrapper}>
          <Image source={require('../assets/Final/buttons/buttonBack.png')} style={styles.backButtonIcon} />
        </TouchableOpacity>

        {/* 1. TOP SIGN */}
        <Image
          source={require('../assets/Placeholder/TopBoard.png')}
          style={styles.shopSign}
        />

        {/* 2. MR. RATTY */}
        <Image
          source={require('../assets/Placeholder/MrRatty.png')}
          style={styles.ratMerchant}
        />

        {/* 3. MAIN BOARD */}
        <ImageBackground
          source={require('../assets/Placeholder/Board.png')}
          style={styles.shopPanel}
          resizeMode="stretch"
        >
          {/* Coin Balance Header — live wallet balance, not a hardcoded 999 */}
          <View style={styles.coinHeader}>
            <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.coinIcon} />
            <Text style={styles.coinText}>{wallet.currency}</Text>
          </View>

          {/* 3 Shop Items Row — each one tappable, price reflects live discount/inflate state */}
          <View style={styles.itemRow}>
            {SHOP_ITEMS.map((item) => {
              const price = wallet.getEffectivePrice(item.id, item.basePrice);
              const onSale = price < item.basePrice;
              const pricedUp = price > item.basePrice;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.itemSlotContainer}
                  onPress={() => setSelectedItemId(item.id)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={item.image}
                    style={[styles.itemBoxImage, selectedItemId === item.id && styles.itemSelected]}
                  />
                  <View style={styles.priceContainer}>
                    <Image source={require('../assets/Placeholder/pixel_coins.png')} style={styles.smallCoinIcon} />
                    <Text style={styles.priceText}>
                      {price}{onSale ? ' ↓' : ''}{pricedUp ? ' ↑' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description Text — follows whichever item is selected */}
          <Text style={styles.descriptionText}>
            {selectedItem.description}
          </Text>
          <Text style={styles.affordabilityText}>
            {selectedPrice} coins{!affordable ? ' — not enough coins' : ''}
          </Text>

          {/* Buy Button — buys whatever's currently selected, disabled if unaffordable */}
          <TouchableOpacity
            onPress={handleBuy}
            activeOpacity={0.8}
            disabled={!affordable}
            style={!affordable ? styles.buyButtonDisabled : undefined}
          >
            <Image
              source={require('../assets/Placeholder/BuyButton.png')}
              style={styles.buyButtonImage}
            />
          </TouchableOpacity>
        </ImageBackground>

        {/* 4. BOTTOM "NO THANK YOU!" BUTTON — declines the whole offer */}
        <TouchableOpacity onPress={handleDecline}>
          <Image
            source={require('../assets/Placeholder/DeclineButton.png')}
            style={styles.backButtonImage}
          />
        </TouchableOpacity>

      </View>

      {/* SHOP OUTCOME MODAL */}
      <ShopOutcomeModal
        visible={rattyOutcome !== null}
        outcome={rattyOutcome}
        onDismiss={() => setRattyOutcome(null)}
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

  // Back button — top-left, above everything else, so it's reachable
  // no matter what else is on screen (uses the same buttonBack.png the
  // rest of the app uses for "leave this screen").
  backButtonWrapper: {
    position: 'absolute',
    top: 20,
    left: 15,
    zIndex: 10,
  },
  backButtonIcon: {
    width: 60,
    height: 36,
    resizeMode: 'contain',
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
    // Negative margin pulls the board UP to overlap Mr. Ratty's lower body
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
  // Actually defined now — previously referenced in the item row but
  // never declared, so tapping/selecting an item had no visible effect.
  itemSelected: {
    borderWidth: 3,
    borderColor: '#FFE194',
    borderRadius: 10,
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
  affordabilityText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#7A2E2E',
    textAlign: 'center',
    marginBottom: 6,
  },
  buyButtonImage: {
    width: 170,
    height: 55,
    marginLeft: 15,
    marginBottom: 15,
    resizeMode: 'stretch',
  },
  buyButtonDisabled: {
    opacity: 0.4,
  },

  // 4. "NO THANK YOU!" BUTTON (declines Mr. Ratty's offer, stays on this screen)
  backButtonImage: {
    width: '100%',
    height: 80,
    resizeMode: 'contain',
    marginTop: 12,
  },
});