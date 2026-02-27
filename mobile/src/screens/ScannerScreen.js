import { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Image } from "react-native";
import useProductStore from "../store/productStore";
import useCheckoutStore from "../store/checkoutStore";

export default function ScannerScreen({ navigation }) {
  const { scannedProduct, loading, error, fetchByBarcode, clearScannedProduct } = useProductStore();
  const { addToCart, cartItems } = useCheckoutStore();
  const [barcode, setBarcode] = useState("");
  const [addedMessage, setAddedMessage] = useState("");

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const onSearch = async () => {
    setAddedMessage("");
    await fetchByBarcode(barcode);
  };

  const onAddToCart = () => {
    if (!scannedProduct?.id) return;
    addToCart({
      productId: scannedProduct.id,
      quantity: 1,
      name: scannedProduct.name,
      price: Number(scannedProduct.price || 0),
    });
    setAddedMessage("Added to cart");
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Scanner (Manual Mode)</Text>
      <Text>Cart items: {cartCount}</Text>
      <Text>Enter barcode to simulate scan:</Text>

      <TextInput
        placeholder="e.g. 1234567890123"
        value={barcode}
        onChangeText={setBarcode}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      <Button title={loading ? "Searching..." : "Find Product"} onPress={onSearch} disabled={loading} />
      <Button title="Clear Result" onPress={clearScannedProduct} />
      <Button title="Go to Cart" onPress={() => navigation.navigate("Cart")} />

      {!!error && <Text style={{ color: "red" }}>{error}</Text>}
      {!!addedMessage && <Text style={{ color: "green" }}>{addedMessage}</Text>}

      {scannedProduct && (
        <View style={{ marginTop: 8, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: "700" }}>{scannedProduct.name}</Text>
          <Text>Brand: {scannedProduct.brand || "N/A"}</Text>
          <Text>Barcode: {scannedProduct.barcode || "N/A"}</Text>
          <Text>Category: {scannedProduct.category || "N/A"}</Text>
          <Text>Price: ${Number(scannedProduct.price || 0).toFixed(2)}</Text>
          <Text>Stock: {scannedProduct.quantity_in_stock ?? 0}</Text>
          <Text>Nutritional Info: {scannedProduct.nutritional_info || "N/A"}</Text>

          {scannedProduct.picture_url ? (
            <Image
              source={{ uri: scannedProduct.picture_url }}
              style={{ width: 180, height: 180, borderRadius: 8, marginTop: 8 }}
              resizeMode="contain"
            />
          ) : null}

          <Button title="Add to Cart" onPress={onAddToCart} />
        </View>
      )}
    </ScrollView>
  );
}
