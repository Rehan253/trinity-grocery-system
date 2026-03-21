import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { GlobalStyles } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { registerRequest } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function RegisterScreen() {
  const { palette } = useAppTheme();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 8 &&
      phone.trim().length > 0 &&
      address.trim().length > 0 &&
      zip.trim().length > 0 &&
      city.trim().length > 0 &&
      country.trim().length > 0
    );
  }, [
    firstName,
    lastName,
    email,
    password,
    phone,
    address,
    zip,
    city,
    country,
  ]);

  const clearError = () => setError(null);

  const onRegister = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    try {
      await registerRequest({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone_number: phone.trim(),
        address: address.trim(),
        zip_code: zip.trim(),
        city: city.trim(),
        country: country.trim(),
        state: state.trim() || undefined,
        role: "customer",
      });

      const signedIn = await login(email.trim().toLowerCase(), password);
      if (signedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (
    icon: ComponentProps<typeof MaterialIcons>["name"],
    node: ReactNode,
  ) => (
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
        name={icon}
        size={22}
        color={palette.iconMuted}
        style={styles.inputIcon}
      />
      {node}
    </View>
  );

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: palette.background }]}>
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
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              style={styles.backButton}
            >
              <MaterialIcons name="arrow-back" size={24} color={palette.text} />
            </Pressable>
            <ThemedText type="subtitle" style={styles.topTitle}>
              Create account
            </ThemedText>
            <View style={styles.backPlaceholder} />
          </View>

          <ThemedText style={[styles.intro, { color: palette.mutedText }]}>
            Join to shop with your preferences. Password must be at least 8
            characters.
          </ThemedText>

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
            <ThemedText style={[styles.label, { color: palette.mutedText }]}>
              First name
            </ThemedText>
            {inputRow(
              "person-outline",
              <TextInput
                value={firstName}
                onChangeText={(v) => {
                  clearError();
                  setFirstName(v);
                }}
                placeholder="First name"
                placeholderTextColor={palette.inputPlaceholder}
                autoCapitalize="words"
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Last name
            </ThemedText>
            {inputRow(
              "person-outline",
              <TextInput
                value={lastName}
                onChangeText={(v) => {
                  clearError();
                  setLastName(v);
                }}
                placeholder="Last name"
                placeholderTextColor={palette.inputPlaceholder}
                autoCapitalize="words"
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Email
            </ThemedText>
            {inputRow(
              "alternate-email",
              <TextInput
                value={email}
                onChangeText={(v) => {
                  clearError();
                  setEmail(v);
                }}
                placeholder="you@example.com"
                placeholderTextColor={palette.inputPlaceholder}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Password
            </ThemedText>
            {inputRow(
              "lock-outline",
              <TextInput
                value={password}
                onChangeText={(v) => {
                  clearError();
                  setPassword(v);
                }}
                placeholder="At least 8 characters"
                placeholderTextColor={palette.inputPlaceholder}
                autoCapitalize="none"
                secureTextEntry
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Phone
            </ThemedText>
            {inputRow(
              "phone-android",
              <TextInput
                value={phone}
                onChangeText={(v) => {
                  clearError();
                  setPhone(v);
                }}
                placeholder="+1 234 567 8900"
                placeholderTextColor={palette.inputPlaceholder}
                keyboardType="phone-pad"
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Address
            </ThemedText>
            {inputRow(
              "home",
              <TextInput
                value={address}
                onChangeText={(v) => {
                  clearError();
                  setAddress(v);
                }}
                placeholder="Street, building, etc."
                placeholderTextColor={palette.inputPlaceholder}
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <View style={styles.rowGap}>
              <View style={{ flex: 1 }}>
                <ThemedText
                  style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
                >
                  ZIP
                </ThemedText>
                {inputRow(
                  "markunread-mailbox",
                  <TextInput
                    value={zip}
                    onChangeText={(v) => {
                      clearError();
                      setZip(v);
                    }}
                    placeholder="ZIP"
                    placeholderTextColor={palette.inputPlaceholder}
                    style={[styles.input, { color: palette.inputText }]}
                  />,
                )}
              </View>
              <View style={{ flex: 1.4 }}>
                <ThemedText
                  style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
                >
                  City
                </ThemedText>
                {inputRow(
                  "location-city",
                  <TextInput
                    value={city}
                    onChangeText={(v) => {
                      clearError();
                      setCity(v);
                    }}
                    placeholder="City"
                    placeholderTextColor={palette.inputPlaceholder}
                    style={[styles.input, { color: palette.inputText }]}
                  />,
                )}
              </View>
            </View>

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              State / region (optional)
            </ThemedText>
            {inputRow(
              "map",
              <TextInput
                value={state}
                onChangeText={(v) => {
                  clearError();
                  setState(v);
                }}
                placeholder="State"
                placeholderTextColor={palette.inputPlaceholder}
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            <ThemedText
              style={[styles.label, styles.labelSpacing, { color: palette.mutedText }]}
            >
              Country
            </ThemedText>
            {inputRow(
              "public",
              <TextInput
                value={country}
                onChangeText={(v) => {
                  clearError();
                  setCountry(v);
                }}
                placeholder="Country"
                placeholderTextColor={palette.inputPlaceholder}
                autoCapitalize="words"
                style={[styles.input, { color: palette.inputText }]}
              />,
            )}

            {!!error && (
              <ThemedText style={[styles.apiError, { color: palette.danger }]}>
                {error}
              </ThemedText>
            )}

            <Pressable
              onPress={onRegister}
              disabled={!canSubmit || loading}
              android_ripple={{ color: "rgba(255,255,255,0.25)" }}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: palette.primary,
                  opacity: !canSubmit || loading ? 0.45 : pressed ? 0.92 : 1,
                  elevation: canSubmit && !loading ? 4 : 0,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.submitButtonText}>Create account</ThemedText>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.replace("/login")}
              style={styles.signInLink}
            >
              <ThemedText style={[styles.signInText, { color: palette.secondary }]}>
                Already have an account? Sign in
              </ThemedText>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  backPlaceholder: {
    width: 32,
  },
  topTitle: {
    flex: 1,
    textAlign: "center",
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  card: {
    borderRadius: 18,
    padding: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelSpacing: {
    marginTop: 14,
    marginBottom: 8,
  },
  rowGap: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 4,
    minHeight: 48,
    marginBottom: 0,
  },
  inputIcon: {
    marginLeft: 10,
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    paddingRight: 12,
  },
  apiError: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  signInLink: {
    marginTop: 18,
    alignItems: "center",
  },
  signInText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
