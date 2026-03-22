import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/context/AuthContext";
import { AccessibilitySettingsProvider } from "@/hooks/use-accessibility-settings";
import { AppThemeProvider, useAppTheme } from "@/hooks/use-app-theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AccessibilitySettingsProvider>
      <AppThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </AppThemeProvider>
    </AccessibilitySettingsProvider>
  );
}

function RootNavigator() {
  const { isDark } = useAppTheme();

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            /** Used as iOS back label when opening screens (e.g. PayPal) from tabs. */
            title: "Home",
            headerBackTitle: " ",
          }}
        />
        <Stack.Screen
          name="paypal-payment"
          options={{
            title: "PayPal Payment",
            presentation: "card",
            /** RN Native Stack v7+: chevron only, no “(tabs)” text (iOS). */
            headerBackButtonDisplayMode: "minimal",
          }}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}
