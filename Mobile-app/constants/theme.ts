/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform, StyleSheet } from "react-native";

export const ThemeColors = {
  primary: "#FF6B35",
  secondary: "#004E89",
  background: "#F4F7F6",
  text: "#1A1A1A",
} as const;

export const AppPalette = {
  light: {
    primary: "#FF6B35",
    secondary: "#004E89",
    background: "#F4F7F6",
    text: "#1A1A1A",
    surface: "#FFFFFF",
    surfaceMuted: "#E9ECEF",
    mutedText: "#6C757D",
    border: "#DDDDDD",
    danger: "#C1121F",
    overlay: "rgba(0, 0, 0, 0.35)",
    headerSubtle: "#D9E2EC",
    inputBackground: "#FFFFFF",
    inputText: "#1A1A1A",
    inputPlaceholder: "#7A7A7A",
    iconMuted: "#5A5A5A",
  },
  dark: {
    primary: "#FF6B35",
    secondary: "#004E89",
    background: "#0D1B2A",
    text: "#F4F7F6",
    surface: "#14273D",
    surfaceMuted: "#1E3550",
    mutedText: "#C7D3E0",
    border: "#2B4563",
    danger: "#FF9B8A",
    overlay: "rgba(0, 0, 0, 0.45)",
    headerSubtle: "#E3ECF5",
    inputBackground: "#FFFFFF",
    inputText: "#1A1A1A",
    inputPlaceholder: "#7A7A7A",
    iconMuted: "#5A5A5A",
  },
} as const;

const tintColorLight = ThemeColors.primary;
const tintColorDark = ThemeColors.primary;

export const Colors = {
  light: {
    text: AppPalette.light.text,
    background: AppPalette.light.background,
    primary: AppPalette.light.primary,
    secondary: AppPalette.light.secondary,
    tint: tintColorLight,
    icon: AppPalette.light.iconMuted,
    tabIconDefault: AppPalette.light.iconMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: AppPalette.dark.text,
    background: AppPalette.dark.background,
    primary: AppPalette.dark.primary,
    secondary: AppPalette.dark.secondary,
    tint: tintColorDark,
    icon: AppPalette.dark.iconMuted,
    tabIconDefault: AppPalette.dark.iconMuted,
    tabIconSelected: tintColorDark,
  },
};

export const GlobalStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
});

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
