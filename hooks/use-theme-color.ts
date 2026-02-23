/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const fallbackColorMap: Record<string, string> = {
  background: Colors.bg,
  text: Colors.textPrimary,
  tint: Colors.accent,
  icon: Colors.textMuted,
  tabIconDefault: Colors.textMuted,
  tabIconSelected: Colors.accent,
};

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme as 'light' | 'dark'];

  if (colorFromProps) {
    return colorFromProps;
  }

  const maybePalette = (Colors as unknown as Record<string, unknown>)[theme] as
    | Record<string, string>
    | undefined;
  if (maybePalette && typeof maybePalette[colorName] === 'string') {
    return maybePalette[colorName];
  }

  if (typeof (Colors as unknown as Record<string, unknown>)[colorName] === 'string') {
    return (Colors as unknown as Record<string, string>)[colorName];
  }

  return fallbackColorMap[colorName] ?? Colors.textPrimary;
}
