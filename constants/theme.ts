import { Platform } from 'react-native';

/** Warm, parchment-inspired palette for Pensée */
export const Colors = {
  // Backgrounds (slightly more white)
  bg: '#faf8f7',
  cardBg: '#ffffff',
  inputBg: '#ffffff',
  headerBg: '#f9f7f5',
  modalBg: '#ffffff',
  paperBg: '#ffffff',

  // Text
  textPrimary: '#3d2b1f',
  textSecondary: '#7a6055',
  textMuted: '#a89688',
  textAccent: '#b8622a',
  textOnAccent: '#ffffff',

  // Accent
  accent: '#b8622a',
  accentDark: '#8f4a1c',
  accentLight: '#d4875a',
  accentMuted: '#ede0d4',

  // Borders & Dividers
  border: '#d0c0af',
  borderLight: '#e4d8c8',
  divider: '#ddd0be',
  blockquoteBorder: '#b8622a',

  // Paper lines
  paperLine: '#ece5d8',

  // Chips
  chipBg: '#ece2d8',
  chipBorder: '#c9b09a',
  chipText: '#5c3d2e',

  // Utility
  shadow: 'rgba(61, 43, 31, 0.14)',
  overlay: 'rgba(25, 12, 3, 0.52)',
  white: '#ffffff',
};

/** Serif font family for the skeuomorphic aesthetic */
export const Font = Platform.select<{
  serif: string;
  serifBold: string;
  serifItalic: string;
}>({
  ios: { serif: 'Georgia', serifBold: 'Georgia', serifItalic: 'Georgia-Italic' },
  default: { serif: 'serif', serifBold: 'serif', serifItalic: 'serif' },
  web: {
    serif: "Georgia, 'Times New Roman', serif",
    serifBold: "Georgia, 'Times New Roman', serif",
    serifItalic: "Georgia, 'Times New Roman', serif",
  },
})!;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 14,
  xl: 20,
  pill: 100,
};
