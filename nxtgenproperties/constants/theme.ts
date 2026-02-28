import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: '#FF6B35',
    primaryContainer: '#FFDBC9',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#2D1600',
    secondary: '#1B2838',
    secondaryContainer: '#D5DDE7',
    surface: '#FFFBFF',
    cardBackground: '#FFF3EC',
    surfaceVariant: '#F5DED1',
    outline: '#84746A',
    outlineVariant: '#D7C3B8',
    error: '#BA1A1A',
    success: '#10B981',
    gold: '#F59E0B',
  },
  roundness: { sm: 8, md: 12, lg: 16, xl: 28, full: 9999 },
  // Floating tab bar clearance: height(70) + bottom offset + extra breathing room
  tabBarHeight: Platform.OS === 'ios' ? 110 : 100,
};
