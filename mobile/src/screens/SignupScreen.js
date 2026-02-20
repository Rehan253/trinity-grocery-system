import { useState } from "react";
import { ScrollView, Text, TextInput, Button, View } from "react-native";
import useAuthStore from "../store/authStore";

export default function SignupScreen({ navigation }) {
  const { signup, loading, error } = useAuthStore();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    zip_code: "",
    city: "",
    country: "",
  });

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSignup = async () => {
    const ok = await signup(form);
    if (ok) navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>Signup</Text>

      <TextInput placeholder="First Name" value={form.first_name} onChangeText={(v) => setField("first_name", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Last Name" value={form.last_name} onChangeText={(v) => setField("last_name", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Email" value={form.email} onChangeText={(v) => setField("email", v)} autoCapitalize="none" keyboardType="email-address" style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Password" value={form.password} onChangeText={(v) => setField("password", v)} secureTextEntry style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Phone Number" value={form.phone_number} onChangeText={(v) => setField("phone_number", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Address" value={form.address} onChangeText={(v) => setField("address", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Zip Code" value={form.zip_code} onChangeText={(v) => setField("zip_code", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="City" value={form.city} onChangeText={(v) => setField("city", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />
      <TextInput placeholder="Country" value={form.country} onChangeText={(v) => setField("country", v)} style={{ borderWidth: 1, padding: 10, borderRadius: 6 }} />

      {!!error && (
        <View>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      <Button title={loading ? "Loading..." : "Create Account"} onPress={onSignup} disabled={loading} />
      <Button title="Back to Login" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}
