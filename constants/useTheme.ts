import { useColorScheme } from '@/hooks/use-color-scheme';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from './theme';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    colors: isDark ? Colors.dark : Colors.light,
    typography: Typography,
    spacing: Spacing,
    shadows: Shadows,
    borderRadius: BorderRadius,
    isDark,
    colorScheme,
  };
}
