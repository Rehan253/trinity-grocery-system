import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isReady, token } = useAuth();

  if (!isReady) {
    return (
      <ThemedView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/login" />;
}
