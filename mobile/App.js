import { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import AuthNavigator from "./src/navigation/AuthNavigator";
import useAuthStore from "./src/store/authStore";

export default function App() {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}
