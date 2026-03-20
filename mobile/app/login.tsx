import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import useAuthStore from '@/src/store/authStore';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const { login, loading, error } = useAuthStore((state) => ({
    login: state.login,
    loading: state.loading,
    error: state.error,
  }));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const themeColors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const handleLogin = async () => {
    const isLoggedIn = await login(email.trim(), password);
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedText type="title">Welcome back</ThemedText>
        <ThemedText style={styles.subtitle}>Sign in to continue shopping.</ThemedText>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={themeColors.icon}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            {
              borderColor: themeColors.icon,
              color: themeColors.text,
              backgroundColor: themeColors.background,
            },
          ]}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={themeColors.icon}
          secureTextEntry
          autoCapitalize="none"
          style={[
            styles.input,
            {
              borderColor: themeColors.icon,
              color: themeColors.text,
              backgroundColor: themeColors.background,
            },
          ]}
        />

        {!!error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={[
            styles.button,
            { backgroundColor: themeColors.tint, opacity: loading ? 0.7 : 1 },
          ]}>
          {loading ? (
            <ActivityIndicator color={colorScheme === 'dark' ? '#151718' : '#fff'} />
          ) : (
            <ThemedText style={styles.buttonText}>Login</ThemedText>
          )}
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    gap: 12,
    borderRadius: 16,
    padding: 20,
  },
  subtitle: {
    opacity: 0.75,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  errorText: {
    color: '#d14343',
  },
});
