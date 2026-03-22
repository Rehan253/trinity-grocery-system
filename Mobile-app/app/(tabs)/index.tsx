import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from "expo-camera";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  unstable_batchedUpdates,
} from "react-native";
import { Image } from "expo-image";

import { CategoryScroll } from "@/components/category-scroll";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getApiErrorMessage } from "@/lib/api/client";
import { addInvoiceItem, createInvoice } from "@/lib/api/invoices";
import { fetchProductByBarcode, fetchProducts } from "@/lib/api/products";
import { CLEAR_CART_AFTER_CHECKOUT_KEY } from "@/lib/storage/checkoutFlags";
import { productMatchesCategoryTab } from "@/lib/utils/categoryMapping";
import {
  mapProductDtoToCatalog,
  PRODUCT_IMAGE_PLACEHOLDER,
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
  const { height: windowHeight } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuth();
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});
  const [isCartVisible, setIsCartVisible] = useState(false);
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [scannerFeedback, setScannerFeedback] = useState<string>("");
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannerPreviewProduct, setScannerPreviewProduct] =
    useState<CatalogProduct | null>(null);
  const [scannerLookupLoading, setScannerLookupLoading] = useState(false);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsRefreshing, setProductsRefreshing] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const loadProducts = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
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
    },
    [],
  );

  useEffect(() => {
    loadProducts("initial");
  }, [loadProducts]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        try {
          const v = await AsyncStorage.getItem(CLEAR_CART_AFTER_CHECKOUT_KEY);
          if (v === "1") {
            setCartItems({});
            await AsyncStorage.removeItem(CLEAR_CART_AFTER_CHECKOUT_KEY);
          }
        } catch {
          /* ignore */
        }
      })();
    }, []),
  );

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

  const cartModalMaxHeight = windowHeight * 0.88;
  /** Title row + margins; footer = subtotal + PayPal row + checkout (fixed, not scrolled). */
  const cartModalHeaderReserve = 68;
  const cartModalFooterReserve = 288;
  const cartItemsScrollMaxHeight = Math.max(
    120,
    cartModalMaxHeight - cartModalHeaderReserve - cartModalFooterReserve,
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

  async function handleProceedCheckout() {
    if (cartProducts.length === 0 || checkoutBusy) {
      return;
    }

    setIsCartVisible(false);
    router.push({
      pathname: "/paypal-payment",
      params: {
        amount: cartSubtotal.toFixed(2),
        items: String(cartCount),
        cartData: JSON.stringify(cartItems),
      },
    });
  }

  function resetScannerModalState() {
    setScannerBusy(false);
    setScannerLookupLoading(false);
    setScannerPreviewProduct(null);
    setManualBarcode("");
    setScannerFeedback("Point camera at a product barcode or enter the code below.");
  }

  async function handleOpenScanner() {
    if (!cameraPermission?.granted) {
      const permissionResponse = await requestCameraPermission();
      if (!permissionResponse.granted) {
        resetScannerModalState();
        setScannerFeedback(
          "Camera is off — enter a barcode below to look up a product.",
        );
        setIsScannerVisible(true);
        return;
      }
    }

    resetScannerModalState();
    setIsScannerVisible(true);
  }

  async function lookupBarcodeByCode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) {
      setScannerFeedback("Enter or scan a barcode.");
      return;
    }

    setScannerLookupLoading(true);
    setScannerFeedback("");
    try {
      const dto = await fetchProductByBarcode(trimmed);
      const item = mapProductDtoToCatalog(dto);
      setScannerPreviewProduct(item);
      setManualBarcode(trimmed);
    } catch {
      setScannerFeedback(`No product for barcode: ${trimmed}`);
    } finally {
      setScannerLookupLoading(false);
      setScannerBusy(false);
    }
  }

  function handleBarcodeScanned(scanResult: BarcodeScanningResult) {
    if (scannerPreviewProduct || scannerLookupLoading || scannerBusy) {
      return;
    }

    const scannedCode = scanResult.data?.trim() ?? "";
    if (!scannedCode) {
      setScannerFeedback("Invalid barcode.");
      return;
    }

    setScannerBusy(true);
    void lookupBarcodeByCode(scannedCode);
  }

  function handleManualBarcodeLookup() {
    if (scannerLookupLoading || scannerBusy) return;
    void lookupBarcodeByCode(manualBarcode);
  }

  function handleAddPreviewProductToCart() {
    if (!scannerPreviewProduct) return;
    const item = scannerPreviewProduct;
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
    setScannerPreviewProduct(null);
    setScannerFeedback(`Added ${item.name} to cart. Scan or enter another.`);
  }

  function handleScannerBackToCamera() {
    setScannerPreviewProduct(null);
    setScannerBusy(false);
    setScannerLookupLoading(false);
    setScannerFeedback(
      "Point camera at a product barcode or enter the code below.",
    );
  }

  function closeScannerModal() {
    setIsScannerVisible(false);
    resetScannerModalState();
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
              <Text
                style={[styles.listEmptyText, { color: palette.mutedText }]}
              >
                Loading products…
              </Text>
            </View>
          ) : productsError ? (
            <View style={styles.listEmpty}>
              <Text
                style={[styles.listEmptyText, { color: palette.mutedText }]}
              >
                Pull to refresh or tap Retry above.
              </Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.listEmpty}>
              <Text
                style={[styles.listEmptyText, { color: palette.mutedText }]}
              >
                No products in the catalog yet.
              </Text>
            </View>
          ) : (
            <View style={styles.listEmpty}>
              <Text
                style={[styles.listEmptyText, { color: palette.mutedText }]}
              >
                No products match this category or search.
              </Text>
            </View>
          )
        }
      />

      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={closeScannerModal}
      >
        <KeyboardAvoidingView
          style={[
            styles.scannerScreen,
            { backgroundColor: palette.background },
          ]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {scannerPreviewProduct ? (
            <ScrollView
              style={styles.scannerPreviewScroll}
              contentContainerStyle={styles.scannerPreviewContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={[styles.scannerPreviewTitle, { color: palette.text }]}>
                Product found
              </Text>
              <Image
                source={{
                  uri:
                    scannerPreviewProduct.imageCandidates[0] ??
                    PRODUCT_IMAGE_PLACEHOLDER,
                }}
                style={styles.scannerPreviewImage}
                contentFit="cover"
                transition={200}
              />
              <Text
                style={[styles.scannerPreviewName, { color: palette.text }]}
                numberOfLines={3}
              >
                {scannerPreviewProduct.name}
              </Text>
              {scannerPreviewProduct.source.brand ? (
                <Text
                  style={[
                    styles.scannerPreviewMeta,
                    { color: palette.mutedText },
                  ]}
                >
                  {scannerPreviewProduct.source.brand}
                </Text>
              ) : null}
              <Text
                style={[styles.scannerPreviewPrice, { color: palette.primary }]}
              >
                {scannerPreviewProduct.price}
              </Text>
              <Text
                style={[styles.scannerPreviewMeta, { color: palette.mutedText }]}
              >
                {scannerPreviewProduct.unit}
              </Text>
              {scannerPreviewProduct.details ? (
                <Text
                  style={[
                    styles.scannerPreviewDescription,
                    { color: palette.mutedText },
                  ]}
                >
                  {scannerPreviewProduct.details}
                </Text>
              ) : null}
              <Text
                style={[styles.scannerPreviewBarcode, { color: palette.text }]}
              >
                Barcode: {scannerPreviewProduct.barcode || "—"}
              </Text>

              <Pressable
                style={[
                  styles.scannerPreviewPrimaryBtn,
                  { backgroundColor: palette.primary },
                ]}
                onPress={handleAddPreviewProductToCart}
              >
                <Text style={styles.scannerPreviewPrimaryBtnText}>
                  Add to cart
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.scannerPreviewSecondaryBtn,
                  { borderColor: palette.border },
                ]}
                onPress={handleScannerBackToCamera}
              >
                <Text
                  style={[
                    styles.scannerPreviewSecondaryBtnText,
                    { color: palette.text },
                  ]}
                >
                  Scan or enter another
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.scannerPreviewSecondaryBtn,
                  { borderColor: palette.border },
                ]}
                onPress={closeScannerModal}
              >
                <Text
                  style={[
                    styles.scannerPreviewSecondaryBtnText,
                    { color: palette.text },
                  ]}
                >
                  Close
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            <>
              {cameraPermission?.granted ? (
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
                  onBarcodeScanned={
                    scannerLookupLoading || scannerBusy
                      ? undefined
                      : handleBarcodeScanned
                  }
                />
              ) : (
                <View
                  style={[
                    styles.cameraView,
                    styles.scannerCameraPlaceholder,
                    { backgroundColor: palette.surface },
                  ]}
                >
                  <Text
                    style={[styles.scannerCameraPlaceholderText, { color: palette.text }]}
                  >
                    Camera access is off. You can still look up a product by
                    entering its barcode below.
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.scannerOverlay,
                  { backgroundColor: palette.overlay },
                ]}
              >
                <Text style={styles.scannerTitle}>Scan Product Barcode</Text>
                {scannerLookupLoading ? (
                  <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 8 }} />
                ) : (
                  <Text style={styles.scannerHint}>{scannerFeedback}</Text>
                )}

                <View
                  style={[
                    styles.scannerManualCard,
                    { backgroundColor: palette.surface },
                  ]}
                >
                  <Text
                    style={[styles.scannerManualLabel, { color: palette.text }]}
                  >
                    Enter barcode manually
                  </Text>
                  <TextInput
                    value={manualBarcode}
                    onChangeText={setManualBarcode}
                    placeholder="EAN, UPC, or code"
                    placeholderTextColor={palette.mutedText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    editable={!scannerLookupLoading}
                    style={[
                      styles.scannerManualInput,
                      {
                        backgroundColor: palette.background,
                        color: palette.text,
                        borderColor: palette.border,
                      },
                    ]}
                    onSubmitEditing={handleManualBarcodeLookup}
                    returnKeyType="search"
                  />
                  <Pressable
                    disabled={scannerLookupLoading}
                    style={[
                      styles.scannerManualSubmit,
                      {
                        backgroundColor: palette.primary,
                        opacity: scannerLookupLoading ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleManualBarcodeLookup}
                  >
                    <Text style={styles.scannerManualSubmitText}>
                      Look up product
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.scannerActions}>
                  <Pressable
                    style={[
                      styles.scannerButton,
                      { backgroundColor: palette.primary },
                    ]}
                    onPress={() => {
                      setScannerBusy(false);
                      setScannerLookupLoading(false);
                      setScannerFeedback(
                        "Point camera at a product barcode or enter the code below.",
                      );
                    }}
                  >
                    <Text style={styles.scannerButtonText}>Reset</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.scannerButton,
                      { backgroundColor: palette.secondary },
                    ]}
                    onPress={closeScannerModal}
                  >
                    <Text style={styles.scannerButtonText}>Close</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
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
            style={[
              styles.modalCard,
              {
                backgroundColor: palette.surface,
                maxHeight: cartModalMaxHeight,
              },
            ]}
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
              <View style={styles.cartModalColumn}>
                <ScrollView
                  style={{ maxHeight: cartItemsScrollMaxHeight }}
                  contentContainerStyle={styles.cartItemsScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
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
                            style={[
                              styles.cartItemName,
                              { color: palette.text },
                            ]}
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
                </ScrollView>

                <View style={styles.cartModalFooter}>
                  <View
                    style={[
                      styles.totalRow,
                      { borderTopColor: palette.border },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: palette.text }]}>
                      Subtotal
                    </Text>
                    <Text
                      style={[styles.totalValue, { color: palette.primary }]}
                    >
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
                        style={[
                          styles.paymentChange,
                          { color: palette.primary },
                        ]}
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
                    disabled={checkoutBusy}
                    onPress={() => void handleProceedCheckout()}
                    style={[
                      styles.checkoutButton,
                      {
                        backgroundColor: palette.primary,
                        opacity: checkoutBusy ? 0.7 : 1,
                      },
                    ]}
                  >
                    {checkoutBusy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.checkoutButtonText}>
                        Proceed to Checkout
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
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
  scannerCameraPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scannerCameraPlaceholderText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  scannerManualCard: {
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  scannerManualLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  scannerManualInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  scannerManualSubmit: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerManualSubmitText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  scannerPreviewScroll: {
    flex: 1,
  },
  scannerPreviewContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  scannerPreviewTitle: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  scannerPreviewImage: {
    width: "100%",
    height: 220,
    borderRadius: 14,
    backgroundColor: "#E9ECEF",
    marginBottom: 14,
  },
  scannerPreviewName: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
  },
  scannerPreviewMeta: {
    fontSize: 14,
    marginTop: 6,
  },
  scannerPreviewPrice: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 10,
  },
  scannerPreviewDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  scannerPreviewBarcode: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
  },
  scannerPreviewPrimaryBtn: {
    marginTop: 22,
    minHeight: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerPreviewPrimaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  scannerPreviewSecondaryBtn: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scannerPreviewSecondaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
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
  },
  cartModalColumn: {
    flexShrink: 1,
  },
  cartItemsScrollContent: {
    paddingBottom: 8,
    /** Gutter so the vertical scroll thumb sits right of the qty + / − controls (LTR). */
    paddingEnd: 18,
  },
  cartModalFooter: {
    flexShrink: 0,
    paddingTop: 8,
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
