/**
 * Pauv Brand Colors
 * These are the official colors used throughout the application.
 * Use these constants instead of hardcoding hex values.
 */

export const colors = {
  // Backgrounds
  background: '#000000',      // Main background
  backgroundDark: '#040000',  // Darker page background
  box: '#171717',             // Card/box backgrounds
  boxLight: '#262626',        // Lighter box backgrounds
  boxHover: '#2a2a2a',        // Box hover state
  boxOutline: '#404040',      // Box borders/outlines
  border: '#333333',          // Standard borders
  navbarBg: '#0d0d0d',        // Navbar background

  // Accents
  red: '#EF4444',             // Red accent (errors, alerts, negative change)
  logo: '#E5C68D',            // Logo/brand accent (gold)
  gold: '#E5C68D',            // Gold color (same as logo)
  goldBorder: '#C4A86A',      // Gold border
  green: '#6EE7B7',           // Green accent (success, positive change)

  // Text
  textPrimary: '#FFFFFF',     // Primary text on dark backgrounds
  textSecondary: '#A3A3A3',   // Secondary/muted text
  textMuted: '#999999',       // Muted text
  textDark: '#000000',        // Dark text for light backgrounds
} as const;

// Legacy color exports for backwards compatibility
export const CR = colors.red;           // Color Red
export const CG = colors.green;         // Color Green
export const NAVBAR_BG = colors.navbarBg;
export const SURFACE = colors.box;
export const WHITE = colors.textPrimary;
export const BLACK_TEXT = colors.textDark;
export const GOLD_COLOR = colors.gold;
export const GOLD_BORDER = colors.goldBorder;
export const GOLD_BG = colors.logo;
export const CD2 = colors.logo;         // Gold accent
export const CD3 = colors.boxLight;
export const CD5 = colors.boxHover;
export const CD8 = colors.box;
export const NAVBAR_BG1 = colors.navbarBg;
export const NAVBAR_BORDER1 = colors.border;

// Type for color keys
export type ColorKey = keyof typeof colors;

// Tailwind-compatible color object for config
export const tailwindColors = {
  background: colors.background,
  box: colors.box,
  'box-light': colors.boxLight,
  'box-outline': colors.boxOutline,
  accent: {
    red: colors.red,
    logo: colors.logo,
    green: colors.green,
  },
  text: {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
  },
} as const;
