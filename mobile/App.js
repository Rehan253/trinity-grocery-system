import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/AuthNavigator";
import useAuthStore from "./src/store/authStore";

export default function App() {
  const { bootstrap, token } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      await bootstrap();
      setReady(true);
    };
    init();
  }, [bootstrap]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AuthNavigator isLoggedIn={!!token} />
    </NavigationContainer>
  );
}
