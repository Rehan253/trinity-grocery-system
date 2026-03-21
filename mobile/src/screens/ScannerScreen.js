import { useState } from "react";
import { View, Text, TextInput, Button, ScrollView, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import useProductStore from "../store/productStore";
import useCheckoutStore from "../store/checkoutStore";

export default function ScannerScreen({ navigation }) {
  const { scannedProduct, loading, error, fetchByBarcode, clearScannedProduct } = useProductStore();
  const { addToCart, cartItems } = useCheckoutStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [barcode, setBarcode] = useState("");
  const [addedMessage, setAddedMessage] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  const cartCount = cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  const onSearch = async () => {
    setAddedMessage(""); 
    setScanMessage("");
    await fetchByBarcode(barcode);
  };

  const onBarcodeScanned = async ({ data }) => {
    if (!scannerEnabled || !data) return;
    setScannerEnabled(false);
    setBarcode(data);
    setAddedMessage("");
    setScanMessage(`Scanned: ${data}`);
    await fetchByBarcode(data);
  };

  const onRescan = () => {
    setScannerEnabled(true);
    setScanMessage("");
  };

  const onClearResult = () => {
    clearScannedProduct();
    setAddedMessage("");
    setScanMessage("");
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
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Scanner</Text>
      <Text>Cart items: {cartCount}</Text>

      <Text style={{ fontWeight: "700" }}>Camera Scanner</Text>
      {!permission ? (
        <Text>Loading camera permission...</Text>
      ) : permission.granted ? (
        <View
          style={{
            height: 260,
            borderRadius: 10,
            overflow: "hidden",
            borderWidth: 1,
            backgroundColor: "#000",
          }}
        >
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={scannerEnabled ? onBarcodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
            }}
          />
        </View>
      ) : (
        <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 }}>
          <Text>Camera permission is required for scanning.</Text>
          <Button title="Allow Camera Access" onPress={requestPermission} />
        </View>
      )}

      <Button title="Scan Again" onPress={onRescan} />
      {!!scanMessage && <Text>{scanMessage}</Text>}

      <Text style={{ fontWeight: "700", marginTop: 4 }}>Manual Mode (Fallback)</Text>
      <Text>Enter barcode manually if camera is unavailable:</Text>

      <TextInput
        placeholder="e.g. 1234567890123"
        value={barcode}
        onChangeText={setBarcode}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, borderRadius: 6 }}
      />

      <Button title={loading ? "Searching..." : "Find Product"} onPress={onSearch} disabled={loading} />
      <Button title="Clear Result" onPress={onClearResult} />
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
