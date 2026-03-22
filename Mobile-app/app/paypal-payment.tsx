import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getApiErrorMessage } from "@/lib/api/client";
import { addInvoiceItemRequest, createInvoiceRequest } from "@/lib/api/invoices";
import {
  capturePaypalOrderRequest,
  createPaypalOrderRequest,
} from "@/lib/api/payments";

type CartEntry = { productId: number; quantity: number };

type PaymentStep =
  | "form"
  | "processing"
  | "approving"
  | "capturing"
  | "success"
  | "error";

function parseCartEntries(
  cartData?: string,
  cart?: string,
): CartEntry[] {
  if (typeof cart === "string" && cart.trim()) {
    try {
      const parsed: unknown = JSON.parse(cart);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            const productId = Number(
              (item as { product_id?: number | string }).product_id,
            );
            const quantity = Number(
              (item as { quantity?: number | string }).quantity,
            );
            if (!Number.isInteger(productId) || productId <= 0) return null;
            if (!Number.isInteger(quantity) || quantity <= 0) return null;
            return { productId, quantity };
          })
          .filter((item): item is CartEntry => item !== null);
      }
    } catch {
      // Fall through to the legacy payload format.
    }
  }

  if (typeof cartData === "string" && cartData.trim()) {
    try {
      const raw: Record<string, number> = JSON.parse(cartData);
      return Object.entries(raw)
        .map(([id, qty]) => {
          const productId = Number(id);
          const quantity = Number(qty);
          if (!Number.isInteger(productId) || productId <= 0) return null;
          if (!Number.isInteger(quantity) || quantity <= 0) return null;
          return { productId, quantity };
        })
        .filter((item): item is CartEntry => item !== null);
    } catch {
      return [];
    }
  }

  return [];
}

export default function PaypalPaymentScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    amount?: string;
    items?: string;
    cartData?: string;
    cart?: string;
  }>();

  const amount = params.amount ?? "0.00";
  const itemCount = params.items ?? "0";
  const cartEntries = parseCartEntries(params.cartData, params.cart);

  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [city, setCity] = useState(user?.city ?? "");
  const [zipCode, setZipCode] = useState(user?.zip_code ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");

  const [step, setStep] = useState<PaymentStep>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);

  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    address.trim() &&
    city.trim() &&
    zipCode.trim();

  async function handlePayWithPaypal() {
    if (!user) {
      setErrorMsg("You must be logged in.");
      setStep("error");
      return;
    }

    if (!isFormValid || cartEntries.length === 0) {
      return;
    }

    setStep("processing");
    setErrorMsg("");

    try {
      setStatusMsg("Creating your order...");
      const invoice = await createInvoiceRequest({
        paymentMethod: "paypal",
        deliveryAddress: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: user.email,
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: user.state ?? undefined,
          zipCode: zipCode.trim(),
        },
      });

      const currentInvoiceId = Number(invoice.invoice_id);
      setInvoiceId(currentInvoiceId);

      setStatusMsg("Adding items to order...");
      for (const entry of cartEntries) {
        await addInvoiceItemRequest(currentInvoiceId, {
          product_id: entry.productId,
          quantity: entry.quantity,
        });
      }

      setStatusMsg("Connecting to PayPal...");
      const order = await createPaypalOrderRequest(currentInvoiceId);
      const { order_id: orderId, approve_url: approveUrl, mock } = order;

      if (mock) {
        setStatusMsg("Mock payment enabled. Skipping PayPal approval...");
      } else {
        if (!approveUrl) {
          throw new Error("No PayPal approval URL received");
        }
        setStep("approving");
        setStatusMsg("Waiting for PayPal approval...");
        await WebBrowser.openBrowserAsync(approveUrl);
      }

      setStep("capturing");
      setStatusMsg("Completing payment...");
      const capture = await capturePaypalOrderRequest(currentInvoiceId, orderId);

      if (capture.capture_status !== "COMPLETED") {
        throw new Error(
          `Payment not completed. Status: ${capture.capture_status || "UNKNOWN"}`,
        );
      }

      setCaptureId(capture.capture_id ?? null);
      setStep("success");
    } catch (e) {
      setErrorMsg(getApiErrorMessage(e, "Payment failed. Please try again."));
      setStep("error");
    }
  }

  function renderInput(
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder = "",
  ) {
    return (
      <View style={styles.inputGroup}>
        <Text style={[styles.inputLabel, { color: palette.mutedText }]}>
          {label}
        </Text>
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: palette.background,
              color: palette.text,
              borderColor: palette.border,
            },
          ]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={palette.mutedText}
        />
      </View>
    );
  }

  const handleBack = () => {
    if (step === "success") {
      router.replace("/(tabs)/recommendations");
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: palette.surface }]}>
          <View style={styles.logoRow}>
            <View style={styles.paypalBadge}>
              <Text style={styles.paypalBadgeText}>PayPal</Text>
            </View>
            <Text style={[styles.title, { color: palette.text }]}>
              PayPal Payment
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: palette.mutedText }]}>
            Secure checkout for your grocery order.
          </Text>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: palette.background,
                borderColor: palette.border,
              },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.mutedText }]}>
                Items
              </Text>
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                {itemCount}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.mutedText }]}>
                Payment Method
              </Text>
              <Text style={[styles.summaryValue, { color: palette.text }]}>
                PayPal
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotalLabel, { color: palette.text }]}>
                Total
              </Text>
              <Text
                style={[styles.summaryTotalValue, { color: palette.primary }]}
              >
                ${amount}
              </Text>
            </View>
          </View>

          {step === "form" && (
            <>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: palette.text, marginTop: 18 },
                ]}
              >
                Delivery Address
              </Text>

              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  {renderInput("First Name", firstName, setFirstName)}
                </View>
                <View style={styles.nameField}>
                  {renderInput("Last Name", lastName, setLastName)}
                </View>
              </View>
              {renderInput("Address", address, setAddress, "Street address")}
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  {renderInput("City", city, setCity)}
                </View>
                <View style={styles.nameField}>
                  {renderInput("Zip Code", zipCode, setZipCode)}
                </View>
              </View>
              {renderInput("Phone (optional)", phone, setPhone)}

              <Pressable
                style={[
                  styles.payButton,
                  {
                    backgroundColor: isFormValid
                      ? palette.primary
                      : palette.border,
                  },
                ]}
                onPress={handlePayWithPaypal}
                disabled={!isFormValid || cartEntries.length === 0}
              >
                <Text style={styles.payButtonText}>
                  Pay ${amount} with PayPal
                </Text>
              </Pressable>

              {cartEntries.length === 0 && (
                <Text
                  style={[
                    styles.errorText,
                    { color: palette.danger, marginTop: 8 },
                  ]}
                >
                  No cart items found. Go back and add products.
                </Text>
              )}
            </>
          )}

          {(step === "processing" ||
            step === "approving" ||
            step === "capturing") && (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="large" color={palette.primary} />
              <Text style={[styles.statusText, { color: palette.text }]}>
                {statusMsg}
              </Text>
              {step === "approving" && (
                <Text style={[styles.statusHint, { color: palette.mutedText }]}>
                  Complete the payment on the PayPal page that opened.
                  {"\n"}
                  Return here when done.
                </Text>
              )}
            </View>
          )}

          {step === "success" && (
            <View
              style={[
                styles.successCard,
                {
                  backgroundColor: palette.background,
                  borderColor: palette.border,
                },
              ]}
            >
              <MaterialIcons
                name="check-circle"
                size={28}
                color={palette.primary}
              />
              <Text style={[styles.successTitle, { color: palette.text }]}>
                Payment Successful
              </Text>
              <Text style={[styles.successText, { color: palette.mutedText }]}>
                Your PayPal payment has been completed successfully.
              </Text>
              {invoiceId ? (
                <Text style={[styles.successMeta, { color: palette.mutedText }]}>
                  Invoice ID: {invoiceId}
                </Text>
              ) : null}
              {captureId ? (
                <Text style={[styles.successMeta, { color: palette.mutedText }]}>
                  Capture ID: {captureId}
                </Text>
              ) : null}
            </View>
          )}

          {step === "error" && (
            <View
              style={[
                styles.errorCard,
                {
                  backgroundColor: palette.background,
                  borderColor: palette.danger,
                },
              ]}
            >
              <MaterialIcons name="error" size={28} color={palette.danger} />
              <Text style={[styles.errorTitle, { color: palette.danger }]}>
                Payment Failed
              </Text>
              <Text style={[styles.errorText, { color: palette.mutedText }]}>
                {errorMsg}
              </Text>
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: palette.primary },
                ]}
                onPress={() => {
                  setStep("form");
                  setErrorMsg("");
                }}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={[styles.backButton, { borderColor: palette.border }]}
            onPress={handleBack}
          >
            <Text style={[styles.backButtonText, { color: palette.text }]}>
              {step === "success" ? "View Recommendations" : "Cancel"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 18,
    padding: 18,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paypalBadge: {
    backgroundColor: "#003087",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  paypalBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  summaryCard: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: "800",
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    gap: 10,
  },
  nameField: {
    flex: 1,
  },
  inputGroup: {
    marginTop: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  payButton: {
    marginTop: 20,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  statusContainer: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  statusHint: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  successCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  successTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
  },
  successText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  successMeta: {
    marginTop: 6,
    fontSize: 12,
    textAlign: "center",
  },
  errorCard: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  errorTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  backButton: {
    marginTop: 12,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
