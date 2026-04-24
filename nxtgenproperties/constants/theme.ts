import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedMode = 'light' | 'dark';

const lightColors = {
  primary: '#0F766E',
  primaryContainer: '#CCFBF1',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#042F2C',
  secondary: '#1B2838',
  secondaryContainer: '#D5DDE7',
  surface: '#FFFFFF',
  cardBackground: '#F4F7F6',
  surfaceVariant: '#E0EDEA',
  outline: '#64766F',
  outlineVariant: '#CBD5D1',
  error: '#BA1A1A',
  success: '#10B981',
  gold: '#D4A24C',
  background: '#FFFFFF',
  onSurface: '#1B2838',
};

const darkColors: typeof lightColors = {
  primary: '#2DD4BF',
  primaryContainer: '#134E4A',
  onPrimary: '#052E2B',
  onPrimaryContainer: '#CCFBF1',
  secondary: '#E2E8F0',
  secondaryContainer: '#1E293B',
  surface: '#0F172A',
  cardBackground: '#1E293B',
  surfaceVariant: '#1E2A3B',
  outline: '#94A3B8',
  outlineVariant: '#334155',
  error: '#F87171',
  success: '#34D399',
  gold: '#EAB94A',
  background: '#0B1220',
  onSurface: '#E2E8F0',
};

export const palettes = { light: lightColors, dark: darkColors };

// Active mode is tracked here so the `theme.colors` Proxy below can return the
// current palette on every read. This keeps ~28 existing call sites working
// without a mass refactor — they just need their component to re-render, which
// the root `key={resolved}` remount guarantees.
let activeMode: ResolvedMode = 'light';
export function _setActiveMode(mode: ResolvedMode) {
  activeMode = mode;
}
export function _getActiveMode(): ResolvedMode {
  return activeMode;
}

const colorsProxy = new Proxy({} as typeof lightColors, {
  get: (_target, prop) => palettes[activeMode][prop as keyof typeof lightColors],
  ownKeys: () => Reflect.ownKeys(palettes[activeMode]),
  getOwnPropertyDescriptor: (_t, prop) =>
    Object.getOwnPropertyDescriptor(palettes[activeMode], prop),
});

const roundness = { sm: 8, md: 12, lg: 16, xl: 28, full: 9999 };
const tabBarHeight = Platform.OS === 'ios' ? 110 : 100;

export const theme = {
  colors: colorsProxy,
  roundness,
  tabBarHeight,
};

export const lightTheme = { colors: lightColors, roundness, tabBarHeight };
export const darkTheme = { colors: darkColors, roundness, tabBarHeight };
