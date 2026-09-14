/**
 * Central place for custom font family names used in the word-input UI.
 * "We want to use that a lot" per the request — add new exports here as
 * more UI adopts it, instead of hardcoding the family-name string in
 * every style that wants it.
 *
 * IMPORTANT: this only *names* the font — React Native still needs it
 * registered/loaded before any style using it will actually render with
 * it (otherwise it silently falls back to the platform default, no error).
 * The .otf lives at ../assets/Placeholder/Fonts/Daydream-DEMO.otf (project root ->
 * assets). If it isn't loaded yet, add it wherever your app currently
 * loads fonts — typically with expo-font's useFonts/loadAsync near the
 * app root — using this same key:
 *
 *   useFonts({ [FONT_WARNING]: require('../assets/Placeholder/Fonts/Daydream-DEMO.otf') })
 */
export const FONT_WARNING = 'Daydream-DEMO';