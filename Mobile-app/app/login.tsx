import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { GlobalStyles } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function LoginScreen() {
  const { palette } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canContinue = useMemo(() => {
    return email.trim().length > 0 && password.length > 0;
  }, [email, password]);

  const onLogin = () => {
    if (!canContinue) return;
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={styles.keyboard}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.hero}>
            <View
              style={[
                styles.heroAccent,
                { backgroundColor: palette.secondary },
              ]}
            />
            <View
              style={[
                styles.logoRing,
                {
                  borderColor: palette.primary,
                  backgroundColor: palette.surface,
                },
              ]}
            >
              <MaterialIcons
                name="shopping-basket"
                size={36}
                color={palette.primary}
              />
            </View>
            <ThemedText type="title" style={styles.heroTitle}>
              The Filtered Fridge
            </ThemedText>
            <ThemedText
              style={[styles.heroTagline, { color: palette.mutedText }]}
            >
              Fresh picks, delivered your way
            </ThemedText>
          </View>

          {/* Form card */}
          <View
            style={[
              styles.card,
              GlobalStyles.card,
              {
                backgroundColor: palette.surface,
                borderWidth: 1,
                borderColor: palette.border,
              },
            ]}
          >
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Sign in
            </ThemedText>
            <ThemedText
              style={[styles.cardSubtitle, { color: palette.mutedText }]}
            >
              Enter your details to continue shopping.
            </ThemedText>

            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: palette.mutedText }]}>
                Email
              </ThemedText>
              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.inputBackground,
                  },
                ]}
              >
                <MaterialIcons
                  name="alternate-email"
                  size={22}
                  color={palette.iconMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={palette.inputPlaceholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                  style={[styles.input, { color: palette.inputText }]}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ThemedText
                  style={[styles.label, { color: palette.mutedText }]}
                >
                  Password
                </ThemedText>
              </View>
              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: palette.border,
                    backgroundColor: palette.inputBackground,
                  },
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={22}
                  color={palette.iconMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={palette.inputPlaceholder}
                  autoCapitalize="none"
                  secureTextEntry
                  style={[styles.input, { color: palette.inputText }]}
                />
              </View>
            </View>

            <Pressable
              onPress={onLogin}
              disabled={!canContinue}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              style={({ pressed }) => [
                styles.loginButton,
                {
                  backgroundColor: palette.primary,
                  opacity: !canContinue ? 0.45 : pressed ? 0.92 : 1,
                  elevation: canContinue ? 4 : 0,
                },
              ]}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
  },
  hero: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 28,
  },
  heroAccent: {
    position: "absolute",
    top: -40,
    alignSelf: "center",
    width: 280,
    height: 160,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    opacity: 0.18,
  },
  logoRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    textAlign: "center",
    marginBottom: 6,
  },
  heroTagline: {
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 18,
    padding: 22,
  },
  cardTitle: {
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  inputIcon: {
    marginLeft: 10,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 12,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
