import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  unstable_batchedUpdates,
} from "react-native";

import { CategoryScroll } from "@/components/category-scroll";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { useAppTheme } from "@/hooks/use-app-theme";
import { fetchProductByBarcode, fetchProducts } from "@/lib/api/products";
import { getApiErrorMessage } from "@/lib/api/client";
import { productMatchesCategoryTab } from "@/lib/utils/categoryMapping";
import {
  mapProductDtoToCatalog,
  type CatalogProduct,
} from "@/lib/utils/productMapper";

const categories = [
  { id: "all", label: "All", icon: "apps" as const },
  { id: "fruits", label: "Fruits", icon: "apple" as const },
  { id: "vegetables", label: "Veggies", icon: "eco" as const },
  { id: "dairy", label: "Dairy", icon: "egg" as const },
  { id: "bakery", label: "Bakery", icon: "bakery-dining" as const },
  { id: "snacks", label: "Snacks", icon: "cookie" as const },
];

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

type CheckoutCartItem = {
  product_id: number;
  quantity: number;
  name: string;
  price: number;
};

function productMatchesSearch(product: CatalogProduct, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const s = product.source;
  const tags = (s.dietaryTags ?? []).join(" ").toLowerCase();
  const ingredients = (s.ingredients ?? []).join(" ").toLowerCase();
  const haystack = [
    product.name,
    s.brand,
    s.description,
    s.category,
    tags,
    ingredients,
    product.barcode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
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
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsRefreshing, setProductsRefreshing] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = useCallback(async (mode: "initial" | "refresh" = "initial") => {
    if (mode === "initial") {
      setProductsLoading(true);
    } else {
      setProductsRefreshing(true);
    }
    setProductsError(null);
    try {
      const rows = await fetchProducts();
      setProducts(rows.map(mapProductDtoToCatalog));
    } catch (e) {
      setProductsError(getApiErrorMessage(e, "Could not load products"));
    } finally {
      setProductsLoading(false);
      setProductsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts("initial");
  }, [loadProducts]);

  const onRefreshProducts = useCallback(() => {
    loadProducts("refresh");
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = productMatchesCategoryTab(
        selectedCategoryId,
        product.source,
      );
      const matchesSearch = productMatchesSearch(product, searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const cartProducts = useMemo(
    () => products.filter((product) => (cartItems[product.id] ?? 0) > 0),
    [cartItems, products],
  );

  const cartSubtotal = useMemo(
    () =>
      cartProducts.reduce((sum, product) => {
        const quantity = cartItems[product.id] ?? 0;
        return sum + product.priceValue * quantity;
      }, 0),
    [cartItems, cartProducts],
  );

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

    const checkoutItems: CheckoutCartItem[] = cartProducts
      .map((product) => {
        const quantity = cartItems[product.id] ?? 0;
        const parsedId = Number(product.id);
        if (!Number.isInteger(parsedId) || parsedId <= 0 || quantity <= 0) {
          return null;
        }
        return {
          product_id: parsedId,
          quantity,
          name: product.name,
          price: product.priceValue,
        };
      })
      .filter((item): item is CheckoutCartItem => item !== null);

    setIsCartVisible(false);
    router.push({
      pathname: "/paypal-payment",
      params: {
        amount: cartSubtotal.toFixed(2),
        items: String(cartCount),
        cart: JSON.stringify(checkoutItems),
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
    const scannedCode = scanResult.data?.trim() ?? "";

    const finish = () => {
      setTimeout(() => {
        setIsScannerVisible(false);
        setScannerBusy(false);
      }, 700);
    };

    if (!scannedCode) {
      setScannerFeedback("Invalid barcode.");
      finish();
      return;
    }

    void (async () => {
      try {
        const dto = await fetchProductByBarcode(scannedCode);
        const item = mapProductDtoToCatalog(dto);
        // Batch so the product exists in `products` in the same render as cart qty
        unstable_batchedUpdates(() => {
          setProducts((prev) => {
            if (prev.some((p) => p.id === item.id)) return prev;
            return [item, ...prev];
          });
          setCartItems((current) => ({
            ...current,
            [item.id]: (current[item.id] ?? 0) + 1,
          }));
        });
        setScannerFeedback(`Added ${item.name} to cart.`);
      } catch {
        setScannerFeedback(
          `No product for barcode: ${scannedCode || "Unknown"}`,
        );
      } finally {
        finish();
      }
    })();
  }

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

      {productsError ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <Text style={[styles.errorBannerText, { color: palette.danger }]}>
            {productsError}
          </Text>
          <Pressable
            onPress={() => loadProducts("initial")}
            style={[styles.retryButton, { backgroundColor: palette.primary }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
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
            imageUris={item.imageCandidates}
            onAddPress={() => handleAddToCart(item.id)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.productsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={productsRefreshing}
            onRefresh={onRefreshProducts}
            tintColor={palette.primary}
          />
        }
        ListEmptyComponent={
          productsLoading ? (
            <View style={styles.listEmpty}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={[styles.listEmptyText, { color: palette.mutedText }]}>
                Loading products…
              </Text>
            </View>
          ) : productsError ? (
            <View style={styles.listEmpty}>
              <Text style={[styles.listEmptyText, { color: palette.mutedText }]}>
                Pull to refresh or tap Retry above.
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.listEmpty}>
              <Text style={[styles.listEmptyText, { color: palette.mutedText }]}>
                No products in the catalog yet.
              </Text>
            </View>
          ) : (
            <View style={styles.listEmpty}>
              <Text style={[styles.listEmptyText, { color: palette.mutedText }]}>
                No products match this category or search.
              </Text>
            </View>
          )
        }
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
                  const itemTotal = product.priceValue * quantity;

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
  categoriesSection: {
    paddingVertical: 12,
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  retryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  listEmpty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  listEmptyText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
  },
  productsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  productList: {
    flex: 1,
  },
  productRow: {
    justifyContent: "flex-start",
    gap: 12,
    marginBottom: 0,
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
