import { useThemeStore } from '@/stores/themeStore';
import { palettes, theme } from '@/constants/theme';

export function useTheme() {
  const resolved = useThemeStore((s) => s.resolved);
  return {
    colors: palettes[resolved],
    roundness: theme.roundness,
    tabBarHeight: theme.tabBarHeight,
    dark: resolved === 'dark',
    resolved,
  };
}
