import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import useAuthStore from '@/src/store/authStore';

export default function IndexScreen() {
  const token = useAuthStore((state) => state.token);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      await bootstrap();
      if (isMounted) {
        setReady(true);
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, [bootstrap]);

  if (!ready) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
