import { View, Text, Button } from "react-native";
import useAuthStore from "../store/authStore";

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuthStore();

  const onLogout = async () => {
    await logout();
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Home</Text>
      <Text>Welcome {user?.first_name || "User"}</Text>
      <Button title="Scan Product" onPress={() => navigation.navigate("Scanner")} />
      <Button title="Logout" onPress={onLogout} />
    </View>
  );
}
