import { Platform } from 'react-native';

export const UbarColors = {
  black: '#000000',
  white: '#FFFFFF',
  background: '#F6F6F6',
  surface: '#FFFFFF',
  primary: '#000000',
  accent: '#E8192C',        // red badge/discount
  accentYellow: '#F5A623',
  textPrimary: '#1A1A1A',
  textSecondary: '#767676',
  textMuted: '#9E9E9E',
  border: '#E8E8E8',
  tabActive: '#000000',
  tabInactive: '#AEAEAE',
  searchBg: '#FFFFFF',
  cardBg: '#F0F0F0',
  badgeRed: '#E8192C',
};

// Keep the old Colors export for legacy compat
export const Colors = {
  light: {
    text: '#11181C',
    background: '#F6F6F6',
    tint: '#000000',
    icon: '#687076',
    tabIconDefault: '#AEAEAE',
    tabIconSelected: '#000000',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
