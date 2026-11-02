import { Platform } from 'react-native';

export const colors = {
  primary: '#0F172A',      // Slate 900
  primaryDark: '#020617',  // Slate 950
  brand: '#2563EB',        // Blue 600
  brandDark: '#1D4ED8',    // Blue 700
  brandLight: 'rgba(37, 99, 235, 0.20)',   // Subtle translucent blue for dark emerald surfaces
  accent: '#F59E0B',       // Amber 500
  accentLight: 'rgba(245, 158, 11, 0.22)', // Translucent amber
  success: '#10B981',      // Emerald 500
  successLight: 'rgba(16, 185, 129, 0.20)', // Translucent emerald
  danger: '#EF4444',       // Red 500
  dangerLight: 'rgba(239, 68, 68, 0.20)',  // Translucent red
  bg: 'transparent',       // Transparent screen container to reveal flowing emerald canvas
  canvas: '#0A4D3C',       // Rich executive emerald canvas foundation
  surfaceMuted: 'rgba(6, 35, 27, 0.70)', // Dark emerald muted surface
  card: 'rgba(8, 45, 35, 0.78)',         // Dark emerald glass card surface
  cardSolid: '#0A4233',                  // Fallback dark emerald
  border: 'rgba(52, 211, 153, 0.25)',    // Emerald glass bevel border
  borderLight: 'rgba(52, 211, 153, 0.15)',// Soft emerald glass border
  borderSolid: '#0E5240',                // Solid dark emerald border
  text: '#F8FAFC',                       // Near-white for dark glass surfaces
  textMuted: '#94A3B8',                  // Slate 400
  textLight: '#64748B',                  // Slate 500
  white: '#FFFFFF',
  // Emerald Ambient Tokens
  emeraldDeep: '#022C22',
  emeraldForest: '#064E3B',
  emeraldMid: '#059669',
  emeraldSoft: '#10B981',
  emeraldMint: '#A7F3D0',

  // Cohesive Dark Emerald Glassmorphism Palette
  glass: {
    card: 'rgba(8, 45, 35, 0.78)',          // Dark emerald glass card surface
    cardDeep: 'rgba(6, 35, 27, 0.85)',      // Deep emerald glass surface
    cardDark: 'rgba(10, 25, 38, 0.85)',      // Midnight obsidian glass for Launch Special
    header: 'rgba(5, 32, 24, 0.90)',        // Dark emerald frosted navigation header
    tabBar: 'rgba(5, 32, 24, 0.94)',        // Dark emerald frosted tab bar
    pill: 'rgba(10, 55, 42, 0.75)',         // Dark emerald frosted pills
    pillActive: '#2563EB',
    selected: 'rgba(37, 99, 235, 0.22)',    // Active card / option selection
    selectedBorder: '#3B82F6',              // Active card border highlight
    border: 'rgba(52, 211, 153, 0.25)',     // Subtle emerald glass bevel border
    borderLight: 'rgba(52, 211, 153, 0.15)', // Soft border highlight
    borderDark: 'rgba(59, 130, 246, 0.25)',  // Navy/blue border highlight
    borderHighlight: 'rgba(110, 231, 183, 0.35)', // Vibrant mint highlight
    input: 'rgba(6, 38, 29, 0.85)',         // Dark emerald input surface
    inputBorder: 'rgba(52, 211, 153, 0.30)',
    highlight: 'rgba(52, 211, 153, 0.18)',
  },

  // On-Canvas Typography & Accents (Sitting directly over emerald backdrop)
  onCanvas: {
    text: '#FFFFFF',
    textMuted: '#CBD5E1',
    textLight: '#94A3B8',
    accent: '#6EE7B7',     // Mint Emerald link highlight
    accentBlue: '#93C5FD', // Ice Blue link highlight
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
};

export const typography = {
  titleLarge: { fontSize: 24, fontWeight: '700' as const, lineHeight: 30 },
  titleMedium: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
  titleSmall: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  bodyLarge: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  bodySmall: { fontSize: 11, fontWeight: '400' as const, lineHeight: 15 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
  price: { fontSize: 22, fontWeight: '800' as const },
};

export const glassShadows = {
  card: {
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  cardDark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 6,
  },
  floating: {
    shadowColor: '#01150F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.40,
    shadowRadius: 20,
    elevation: 6,
  },
};
