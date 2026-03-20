import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { CategoryScroll } from "@/components/category-scroll";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { useAppTheme } from "@/hooks/use-app-theme";

const categories = [
  { id: "all", label: "All", icon: "apps" as const },
  { id: "fruits", label: "Fruits", icon: "apple" as const },
  { id: "vegetables", label: "Veggies", icon: "eco" as const },
  { id: "dairy", label: "Dairy", icon: "egg" as const },
  { id: "bakery", label: "Bakery", icon: "bakery-dining" as const },
  { id: "snacks", label: "Snacks", icon: "cookie" as const },
];

type Product = {
  id: string;
  category: string;
  name: string;
  unit: string;
  price: string;
  imageUri: string;
  barcode: string;
  details: string;
};

const products: Product[] = [
  {
    id: "1",
    category: "fruits",
    name: "Red Apples",
    unit: "1 kg",
    price: "$4.99",
    barcode: "200000000001",
    details: "Fresh Washington apples, sweet and crisp.",
    imageUri:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "2",
    category: "fruits",
    name: "Bananas",
    unit: "1 dozen",
    price: "$2.49",
    barcode: "200000000002",
    details: "Ripe Cavendish bananas, naturally sweet.",
    imageUri:
      "https://images.unsplash.com/photo-1574226516831-e1dff420e37f?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "3",
    category: "vegetables",
    name: "Broccoli",
    unit: "500 g",
    price: "$3.25",
    barcode: "200000000003",
    details: "Farm-fresh broccoli rich in vitamins.",
    imageUri:
      "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "4",
    category: "fruits",
    name: "Avocado",
    unit: "1 pc",
    price: "$1.89",
    barcode: "200000000004",
    details: "Creamy Hass avocado, ready to eat.",
    imageUri:
      "https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "5",
    category: "vegetables",
    name: "Spinach",
    unit: "300 g",
    price: "$2.15",
    barcode: "200000000005",
    details: "Tender baby spinach leaves.",
    imageUri:
      "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "6",
    category: "vegetables",
    name: "Tomatoes",
    unit: "1 kg",
    price: "$3.10",
    barcode: "200000000006",
    details: "Juicy red tomatoes for salads and cooking.",
    imageUri:
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "7",
    category: "dairy",
    name: "Whole Milk",
    unit: "1 L",
    price: "$2.99",
    barcode: "200000000007",
    details: "Pasteurized whole milk, 3.5% fat.",
    imageUri:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "8",
    category: "dairy",
    name: "Greek Yogurt",
    unit: "400 g",
    price: "$4.20",
    barcode: "200000000008",
    details: "High-protein plain Greek yogurt.",
    imageUri:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "9",
    category: "bakery",
    name: "Sourdough Bread",
    unit: "1 loaf",
    price: "$5.40",
    barcode: "200000000009",
    details: "Artisan sourdough loaf baked daily.",
    imageUri:
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "10",
    category: "bakery",
    name: "Croissant",
    unit: "4 pack",
    price: "$4.75",
    barcode: "200000000010",
    details: "Buttery flaky croissants, pack of four.",
    imageUri:
      "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "11",
    category: "snacks",
    name: "Mixed Nuts",
    unit: "250 g",
    price: "$6.30",
    barcode: "200000000011",
    details: "Roasted mixed nuts with no added sugar.",
    imageUri:
      "https://images.unsplash.com/photo-1599599810694-57a0d6f9b8de?auto=format&fit=crop&w=500&q=60",
  },
  {
    id: "12",
    category: "snacks",
    name: "Potato Chips",
    unit: "150 g",
    price: "$2.80",
    barcode: "200000000012",
    details: "Sea-salt potato chips, crispy texture.",
    imageUri:
      "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=60",
  },
];

function parsePrice(price: string) {
  return Number(price.replace("$", ""));
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export default function HomeScreen() {
  const { isDark, palette, toggleTheme } = useAppTheme();
  const router = useRouter();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState<string>("");
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(
    null,
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === "all" || product.category === selectedCategoryId;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategoryId]);

  const cartCount = useMemo(
    () => Object.values(cartItems).reduce((sum, quantity) => sum + quantity, 0),
    [cartItems],
  );

  function handleAddToCart(productId: string) {
    setCartItems((currentItems) => ({
      ...currentItems,
      [productId]: (currentItems[productId] ?? 0) + 1,
    }));
  }

  function handleDecreaseFromCart(productId: string) {
    setCartItems((currentItems) => {
      const currentQuantity = currentItems[productId] ?? 0;

      if (currentQuantity <= 1) {
        const { [productId]: _removed, ...remainingItems } = currentItems;
        return remainingItems;
      }

      return {
        ...currentItems,
        [productId]: currentQuantity - 1,
      };
    });
  }

  function handleRemoveFromCart(productId: string) {
    setCartItems((currentItems) => {
      const { [productId]: _removed, ...remainingItems } = currentItems;
      return remainingItems;
    });
  }

  function handleClearCart() {
    setCartItems({});
  }

  function handleProceedCheckout() {
    if (cartProducts.length === 0) {
      return;
    }

    setIsCartVisible(false);
    router.push({
      pathname: "/paypal-payment",
      params: {
        amount: cartSubtotal.toFixed(2),
        items: String(cartCount),
      },
    });
  }

  async function handleOpenScanner() {
    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        setScannerFeedback("Camera permission is required to scan products.");
        return;
      }
    }

    setScannerFeedback("Point camera at a product barcode.");
    setScannerBusy(false);
    setIsScannerVisible(true);
  }

  function handleBarcodeScanned(scanResult: BarcodeScanningResult) {
    if (scannerBusy) {
      return;
    }

    setScannerBusy(true);
    const scannedCode = scanResult.data?.trim();
    const scannedProduct = products.find(
      (product) => product.barcode === scannedCode,
    );

    if (scannedProduct) {
      handleAddToCart(scannedProduct.id);
      setLastScannedProduct(scannedProduct);
      setScannerFeedback(`Scanned ${scannedProduct.name}. Added to cart.`);
    } else {
      setScannerFeedback(
        `No product mapped for barcode: ${scannedCode ?? "Unknown"}`,
      );
    }

    setTimeout(() => {
      setIsScannerVisible(false);
      setScannerBusy(false);
    }, 700);
  }

  const cartProducts = useMemo(
    () => products.filter((product) => (cartItems[product.id] ?? 0) > 0),
    [cartItems],
  );

  const cartSubtotal = useMemo(
    () =>
      cartProducts.reduce((sum, product) => {
        const quantity = cartItems[product.id] ?? 0;
        return sum + parsePrice(product.price) * quantity;
      }, 0),
    [cartItems, cartProducts],
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.background }]}>
      <Header
        isDark={isDark}
        cartCount={cartCount}
        searchValue={searchQuery}
        onSearchChangeText={setSearchQuery}
        onToggleTheme={toggleTheme}
        onScanPress={handleOpenScanner}
        onCartPress={() => setIsCartVisible(true)}
      />

      {lastScannedProduct ? (
        <View
          style={[styles.scannedInfoCard, { backgroundColor: palette.surface }]}
        >
          <Text style={[styles.scannedTitle, { color: palette.primary }]}>
            Last scanned
          </Text>
          <Text style={[styles.scannedName, { color: palette.text }]}>
            {lastScannedProduct.name}
          </Text>
          <Text style={[styles.scannedDetail, { color: palette.mutedText }]}>
            {lastScannedProduct.details}
          </Text>
          <Text style={[styles.scannedMeta, { color: palette.mutedText }]}>
            {lastScannedProduct.unit} • {lastScannedProduct.price} • Barcode{" "}
            {lastScannedProduct.barcode}
          </Text>
        </View>
      ) : null}

      <View style={styles.categoriesSection}>
        <CategoryScroll
          isDark={isDark}
          categories={categories}
          initialSelectedId="all"
          onSelectCategory={(category) => setSelectedCategoryId(category.id)}
        />
      </View>

      <FlatList
        data={filteredProducts}
        style={styles.productList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            isDark={isDark}
            name={item.name}
            unit={item.unit}
            price={item.price}
            imageUri={item.imageUri}
            onAddPress={() => handleAddToCart(item.id)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => setIsScannerVisible(false)}
      >
        <View
          style={[
            styles.scannerScreen,
            { backgroundColor: palette.background },
          ]}
        >
          <CameraView
            style={styles.cameraView}
            barcodeScannerSettings={{
              barcodeTypes: [
                "ean13",
                "ean8",
                "upc_a",
                "upc_e",
                "code128",
                "qr",
              ],
            }}
            onBarcodeScanned={scannerBusy ? undefined : handleBarcodeScanned}
          />

          <View
            style={[
              styles.scannerOverlay,
              { backgroundColor: palette.overlay },
            ]}
          >
            <Text style={styles.scannerTitle}>Scan Product Barcode</Text>
            <Text style={styles.scannerHint}>{scannerFeedback}</Text>
            <View style={styles.scannerActions}>
              <Pressable
                style={[
                  styles.scannerButton,
                  { backgroundColor: palette.primary },
                ]}
                onPress={() => {
                  setScannerBusy(false);
                  setScannerFeedback("Point camera at a product barcode.");
                }}
              >
                <Text style={styles.scannerButtonText}>Scan Again</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.scannerButton,
                  { backgroundColor: palette.secondary },
                ]}
                onPress={() => setIsScannerVisible(false)}
              >
                <Text style={styles.scannerButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCartVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCartVisible(false)}
      >
        <View
          style={[styles.modalBackdrop, { backgroundColor: palette.overlay }]}
        >
          <View
            style={[styles.modalCard, { backgroundColor: palette.surface }]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>
                Your Cart
              </Text>
              <View style={styles.modalHeaderActions}>
                {cartProducts.length > 0 ? (
                  <Pressable onPress={handleClearCart}>
                    <Text
                      style={[styles.clearText, { color: palette.primary }]}
                    >
                      Clear
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setIsCartVisible(false)}>
                  <Text style={[styles.closeText, { color: palette.primary }]}>
                    Close
                  </Text>
                </Pressable>
              </View>
            </View>

            {cartProducts.length === 0 ? (
              <Text style={[styles.emptyText, { color: palette.mutedText }]}>
                Your cart is empty.
              </Text>
            ) : (
              <>
                {cartProducts.map((product) => {
                  const quantity = cartItems[product.id] ?? 0;
                  const itemTotal = parsePrice(product.price) * quantity;

                  return (
                    <View
                      key={product.id}
                      style={[
                        styles.cartRow,
                        { borderBottomColor: palette.border },
                      ]}
                    >
                      <View style={styles.cartInfoColumn}>
                        <Text
                          style={[styles.cartItemName, { color: palette.text }]}
                        >
                          {product.name}
                        </Text>
                        <Text
                          style={[
                            styles.cartItemPrice,
                            { color: palette.mutedText },
                          ]}
                        >
                          {product.price} each
                        </Text>
                        <Pressable
                          onPress={() => handleRemoveFromCart(product.id)}
                        >
                          <Text
                            style={[
                              styles.removeText,
                              { color: palette.danger },
                            ]}
                          >
                            Remove
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.cartControlsColumn}>
                        <View style={styles.qtyControlRow}>
                          <Pressable
                            onPress={() => handleDecreaseFromCart(product.id)}
                            style={[
                              styles.qtyButton,
                              { backgroundColor: palette.primary },
                            ]}
                          >
                            <Text style={styles.qtyButtonText}>-</Text>
                          </Pressable>
                          <Text
                            style={[
                              styles.cartItemQty,
                              { color: palette.primary },
                            ]}
                          >
                            {quantity}
                          </Text>
                          <Pressable
                            onPress={() => handleAddToCart(product.id)}
                            style={[
                              styles.qtyButton,
                              { backgroundColor: palette.primary },
                            ]}
                          >
                            <Text style={styles.qtyButtonText}>+</Text>
                          </Pressable>
                        </View>
                        <Text
                          style={[
                            styles.itemTotalText,
                            { color: palette.text },
                          ]}
                        >
                          {formatCurrency(itemTotal)}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <View
                  style={[styles.totalRow, { borderTopColor: palette.border }]}
                >
                  <Text style={[styles.totalLabel, { color: palette.text }]}>
                    Subtotal
                  </Text>
                  <Text style={[styles.totalValue, { color: palette.primary }]}>
                    {formatCurrency(cartSubtotal)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.paymentCard,
                    {
                      backgroundColor: palette.background,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <View style={styles.paymentHeader}>
                    <Text
                      style={[
                        styles.paymentLabel,
                        { color: palette.mutedText },
                      ]}
                    >
                      Payment Method
                    </Text>
                    <Text
                      style={[styles.paymentChange, { color: palette.primary }]}
                    >
                      Selected
                    </Text>
                  </View>
                  <View style={styles.paymentMethodRow}>
                    <View style={styles.paypalBadge}>
                      <Text style={styles.paypalBadgeText}>PayPal</Text>
                    </View>
                    <Text
                      style={[
                        styles.paymentMethodText,
                        { color: palette.text },
                      ]}
                    >
                      Pay with PayPal
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleProceedCheckout}
                  style={[
                    styles.checkoutButton,
                    { backgroundColor: palette.primary },
                  ]}
                >
                  <Text style={styles.checkoutButtonText}>
                    Proceed to Checkout
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scannedInfoCard: {
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  scannedTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  scannedName: {
    fontSize: 16,
    fontWeight: "700",
  },
  scannedDetail: {
    marginTop: 2,
    fontSize: 13,
  },
  scannedMeta: {
    marginTop: 4,
    fontSize: 12,
  },
  categoriesSection: {
    paddingVertical: 12,
  },
  productsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productList: {
    flex: 1,
  },
  productRow: {
    justifyContent: "space-between",
  },
  scannerScreen: {
    flex: 1,
  },
  cameraView: {
    flex: 1,
  },
  scannerOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 8,
  },
  scannerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  scannerHint: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  scannerActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  scannerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 28,
    maxHeight: "60%",
  },
  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  clearText: {
    color: "#FF6B35",
    fontWeight: "700",
  },
  closeText: {
    color: "#FF6B35",
    fontWeight: "700",
  },
  emptyText: {
    color: "#5A5A5A",
    fontSize: 15,
  },
  cartRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cartInfoColumn: {
    flex: 1,
    paddingRight: 8,
  },
  cartControlsColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  cartItemName: {
    color: "#1A1A1A",
    fontSize: 15,
    fontWeight: "500",
  },
  cartItemPrice: {
    color: "#6C757D",
    fontSize: 13,
    marginTop: 3,
  },
  removeText: {
    marginTop: 6,
    color: "#C1121F",
    fontWeight: "600",
    fontSize: 13,
  },
  qtyControlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 20,
  },
  cartItemQty: {
    color: "#FF6B35",
    fontSize: 15,
    fontWeight: "700",
  },
  itemTotalText: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "700",
  },
  totalRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#DDDDDD",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    color: "#FF6B35",
    fontSize: 18,
    fontWeight: "800",
  },
  paymentCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentChange: {
    fontSize: 12,
    fontWeight: "700",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paypalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#003087",
  },
  paypalBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  checkoutButton: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
