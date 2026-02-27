import { ScrollView, View, Text, Button } from "react-native";
import useCheckoutStore from "../store/checkoutStore";

export default function CartScreen({ navigation }) {
  const { cartItems, updateCartQuantity, removeFromCart, clearCart } = useCheckoutStore();

  const subtotal = cartItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Cart</Text>
      <Text>Items: {cartItems.length}</Text>

      {!cartItems.length ? (
        <View style={{ gap: 10 }}>
          <Text>Your cart is empty.</Text>
          <Button title="Go to Scanner" onPress={() => navigation.navigate("Scanner")} />
        </View>
      ) : (
        <>
          {cartItems.map((item) => (
            <View
              key={`cart-${item.productId}`}
              style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 8 }}
            >
              <Text style={{ fontWeight: "700" }}>
                {item.name || `Product #${item.productId}`}
              </Text>
              <Text>Product ID: {item.productId}</Text>
              <Text>Qty: {item.quantity}</Text>
              <Text>Unit Price: ${Number(item.price || 0).toFixed(2)}</Text>
              <Text>
                Line Total: $
                {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
              </Text>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button
                  title="-"
                  onPress={() =>
                    updateCartQuantity(item.productId, Number(item.quantity || 0) - 1)
                  }
                />
                <Button
                  title="+"
                  onPress={() =>
                    updateCartQuantity(item.productId, Number(item.quantity || 0) + 1)
                  }
                />
              </View>

              <Button title="Remove Item" onPress={() => removeFromCart(item.productId)} />
            </View>
          ))}

          <View style={{ marginTop: 8, gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: "700" }}>
              Subtotal: ${subtotal.toFixed(2)}
            </Text>
            <Button title="Proceed to Checkout" onPress={() => navigation.navigate("Checkout")} />
            <Button title="Clear Cart" onPress={clearCart} />
          </View>
        </>
      )}
    </ScrollView>
  );
}
