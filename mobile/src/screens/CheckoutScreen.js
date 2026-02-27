import { useMemo } from "react";
import { ScrollView, View, Text, TextInput, Button, Linking } from "react-native";
import useCheckoutStore from "../store/checkoutStore";

const inputStyle = {
  borderWidth: 1,
  borderRadius: 6,
  padding: 10,
};

export default function CheckoutScreen({ navigation }) {
  const {
    cartItems,
    deliveryAddress,
    setDeliveryAddress,
    loading,
    error,
    invoice,
    paypalOrder,
    createInvoiceFromCart,
    createPaypalOrderForInvoice,
    capturePaypalOrderForInvoice,
    resetCheckoutState,
  } = useCheckoutStore();

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const updateField = (key, value) => {
    setDeliveryAddress({ [key]: value });
  };

  const onCreatePaypalOrder = async () => {
    const invoiceResult = await createInvoiceFromCart();
    if (!invoiceResult.ok) return;
    await createPaypalOrderForInvoice(invoiceResult.invoice.invoice_id);
  };

  const onCapturePayment = async () => {
    await capturePaypalOrderForInvoice({
      invoiceId: invoice?.invoice_id,
      orderId: paypalOrder?.order_id,
    });
  };

  const onOpenPaypal = async () => {
    const url = paypalOrder?.approve_url;
    if (!url) return;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Checkout</Text>
      <Text>Cart Items: {cartItems.length}</Text>
      <Text>Total: ${cartTotal.toFixed(2)}</Text>

      <Text style={{ marginTop: 8, fontWeight: "700" }}>Delivery Info</Text>

      <TextInput
        placeholder="Full name"
        value={deliveryAddress.fullName}
        onChangeText={(value) => updateField("fullName", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={deliveryAddress.email}
        onChangeText={(value) => updateField("email", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Phone"
        value={deliveryAddress.phone}
        onChangeText={(value) => updateField("phone", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Address"
        value={deliveryAddress.address}
        onChangeText={(value) => updateField("address", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Apartment (optional)"
        value={deliveryAddress.apartment}
        onChangeText={(value) => updateField("apartment", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="City"
        value={deliveryAddress.city}
        onChangeText={(value) => updateField("city", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="State"
        value={deliveryAddress.state}
        onChangeText={(value) => updateField("state", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Zip code"
        value={deliveryAddress.zipCode}
        onChangeText={(value) => updateField("zipCode", value)}
        style={inputStyle}
      />
      <TextInput
        placeholder="Delivery notes (optional)"
        value={deliveryAddress.deliveryNotes}
        onChangeText={(value) => updateField("deliveryNotes", value)}
        style={inputStyle}
      />

      {!!error && <Text style={{ color: "red" }}>{error}</Text>}

      <Button
        title={loading ? "Processing..." : "Create Invoice + PayPal Order"}
        onPress={onCreatePaypalOrder}
        disabled={loading || !cartItems.length}
      />

      {!!paypalOrder?.approve_url && (
        <Button title="Open PayPal Approval Page" onPress={onOpenPaypal} />
      )}

      {!!paypalOrder?.order_id && (
        <View style={{ gap: 6 }}>
          <Text>PayPal Order ID: {paypalOrder.order_id}</Text>
          <Button
            title={loading ? "Capturing..." : "Capture Payment"}
            onPress={onCapturePayment}
            disabled={loading}
          />
        </View>
      )}

      {!!invoice && (
        <View style={{ marginTop: 10, gap: 6 }}>
          <Text style={{ fontWeight: "700" }}>Latest Invoice</Text>
          <Text>Invoice ID: {invoice.invoice_id}</Text>
          <Text>Payment Status: {invoice.paymentStatus}</Text>
          <Text>Total: ${Number(invoice.total_amount || 0).toFixed(2)}</Text>
        </View>
      )}

      <Button title="Back to Cart" onPress={() => navigation.navigate("Cart")} />
      <Button
        title="Reset Checkout State"
        onPress={resetCheckoutState}
        disabled={loading}
      />
    </ScrollView>
  );
}
