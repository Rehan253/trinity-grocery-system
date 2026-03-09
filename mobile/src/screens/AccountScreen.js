import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, Button, View } from "react-native";
import useAuthStore from "../store/authStore";

const inputStyle = {
  borderWidth: 1,
  borderRadius: 6,
  padding: 10,
};

const buildFormFromUser = (user) => ({
  first_name: user?.first_name || "",
  last_name: user?.last_name || "",
  email: user?.email || "",
  phone_number: user?.phone_number || "",
  address: user?.address || "",
  zip_code: user?.zip_code || "",
  city: user?.city || "",
  state: user?.state || "",
  country: user?.country || "",
});

export default function AccountScreen({ navigation }) {
  const { user, updateProfile, refreshMe, loading, error } = useAuthStore();
  const [form, setForm] = useState(buildFormFromUser(user));
  const [message, setMessage] = useState("");

  useEffect(() => {
    setForm(buildFormFromUser(user));
  }, [user]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setMessage("");
    const payload = {
      ...form,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      zip_code: form.zip_code.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
    };

    const result = await updateProfile(payload);
    if (result.ok) {
      setMessage("Profile updated successfully");
    }
  };

  const onReloadFromServer = async () => {
    setMessage("");
    await refreshMe();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Manage Account</Text>

      <TextInput
        placeholder="First Name"
        value={form.first_name}
        onChangeText={(value) => setField("first_name", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Last Name"
        value={form.last_name}
        onChangeText={(value) => setField("last_name", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Email"
        value={form.email}
        onChangeText={(value) => setField("email", value)}
        autoCapitalize="none"
        keyboardType="email-address"
        style={inputStyle}
      />
      <TextInput
        placeholder="Phone Number"
        value={form.phone_number}
        onChangeText={(value) => setField("phone_number", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Address"
        value={form.address}
        onChangeText={(value) => setField("address", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Zip Code"
        value={form.zip_code}
        onChangeText={(value) => setField("zip_code", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="City"
        value={form.city}
        onChangeText={(value) => setField("city", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="State (optional)"
        value={form.state}
        onChangeText={(value) => setField("state", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Country"
        value={form.country}
        onChangeText={(value) => setField("country", value)}
        style={inputStyle}
      />

      {!!error && (
        <View>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      )}

      {!!message && (
        <View>
          <Text style={{ color: "green" }}>{message}</Text>
        </View>
      )}

      <Button title={loading ? "Saving..." : "Save Profile"} onPress={onSave} disabled={loading} />
      <Button title="Reload from Server" onPress={onReloadFromServer} disabled={loading} />
      <Button title="Back to Home" onPress={() => navigation.goBack()} disabled={loading} />
    </ScrollView>
  );
}
