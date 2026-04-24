import { Platform } from 'react-native';

export const theme = {
  colors: {
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
  },
  roundness: { sm: 8, md: 12, lg: 16, xl: 28, full: 9999 },
  // Floating tab bar clearance: height(70) + bottom offset + extra breathing room
  tabBarHeight: Platform.OS === 'ios' ? 110 : 100,
};
