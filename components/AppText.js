import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONT_REGULAR, FONT_MEDIUM, FONT_SEMIBOLD, FONT_BOLD } from './gameplayReusables/Font';

// Custom fonts ignore fontWeight on Android, so map weight -> font file.
function familyForWeight(weight) {
  switch (String(weight)) {
    case '500': return FONT_MEDIUM;
    case '600': return FONT_SEMIBOLD;
    case '700': case '800': case '900': case 'bold': return FONT_BOLD;
    default: return FONT_REGULAR;
  }
}

const AppText = React.forwardRef(function AppText({ style, ...rest }, ref) {
  const flat = StyleSheet.flatten(style) || {};
  const { fontWeight, fontFamily, ...others } = flat;
  return (
    <RNText
      ref={ref}
      {...rest}
      style={{ ...others, fontFamily: fontFamily || familyForWeight(fontWeight) }}
    />
  );
});

export default AppText;