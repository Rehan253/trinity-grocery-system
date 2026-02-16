import { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import useAuthStore from "../store/authStore";

export default function LoginScreen({ navigation }) {
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onLogin = async () => {
    const ok = await login(email.trim(), password);
    if (ok) navigation.replace("Home");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      {!!error && <Text style={{ color: "red" }}>{error}</Text>}

      <Button title={loading ? "Loading..." : "Login"} onPress={onLogin} disabled={loading} />
      <Button title="Go to Signup" onPress={() => navigation.navigate("Signup")} />
    </View>
  );
}
