import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  addInvoiceItemRequest,
  createInvoiceRequest,
} from "@/lib/api/invoices";
import {
  capturePaypalOrderRequest,
  createPaypalOrderRequest,
} from "@/lib/api/payments";

export default function PaypalPaymentScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ amount?: string; items?: string; cart?: string }>();
  const [isPaid, setIsPaid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [captureId, setCaptureId] = useState<string | null>(null);

  const amount = params.amount ?? "0.00";
  const items = params.items ?? "0";
  const cartParam = typeof params.cart === "string" ? params.cart : "";

  const parsedCartItems = (() => {
    if (!cartParam) return [] as { product_id: number; quantity: number }[];
    try {
      const parsed: unknown = JSON.parse(cartParam);
      if (!Array.isArray(parsed)) return [] as { product_id: number; quantity: number }[];
      return parsed
        .map((item) => {
          const productId = Number(
            (item as { product_id?: number | string }).product_id,
          );
          const quantity = Number((item as { quantity?: number | string }).quantity);
          if (!Number.isInteger(productId) || productId <= 0) return null;
          if (!Number.isInteger(quantity) || quantity <= 0) return null;
          return { product_id: productId, quantity };
        })
        .filter(
          (item): item is { product_id: number; quantity: number } => item !== null,
        );
    } catch {
      return [] as { product_id: number; quantity: number }[];
    }
  })();

  const handlePay = async () => {
    if (isProcessing) return;
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (parsedCartItems.length === 0) {
      setError("Cart items are missing. Go back and start checkout again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fullName =
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Customer";

      const invoice = await createInvoiceRequest({
        paymentMethod: "paypal",
        deliveryAddress: {
          fullName,
          email: user.email || "customer@example.com",
          phone: user.phone_number || "0000000000",
          address: user.address || "Unknown address",
          apartment: "",
          city: user.city || "Unknown city",
          state: user.state || "NA",
          zipCode: user.zip_code || "00000",
          deliveryNotes: "Placed from mobile app",
        },
      });

      const currentInvoiceId = Number(invoice.invoice_id);
      setInvoiceId(currentInvoiceId);

      for (const item of parsedCartItems) {
        await addInvoiceItemRequest(currentInvoiceId, item);
      }

      const order = await createPaypalOrderRequest(currentInvoiceId);
      const capture = await capturePaypalOrderRequest(
        currentInvoiceId,
        order.order_id,
      );

      if (capture.capture_status !== "COMPLETED") {
        throw new Error(
          `Payment capture was not completed (${capture.capture_status || "UNKNOWN"})`,
        );
      }

      setCaptureId(capture.capture_id ?? null);
      setIsPaid(true);
    } catch (e) {
      setError(getApiErrorMessage(e, "PayPal checkout failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
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
              {items}
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

        {isPaid ? (
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
        ) : (
          <Pressable
            style={[styles.payButton, { backgroundColor: palette.primary }]}
            onPress={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Pay ${amount} with PayPal</Text>
            )}
          </Pressable>
        )}

        {error ? (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: palette.background, borderColor: palette.border },
            ]}
          >
            <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.backButton, { borderColor: palette.border }]}
          onPress={() => (isPaid ? router.replace("/(tabs)/recommendations") : router.back())}
        >
          <Text style={[styles.backButtonText, { color: palette.text }]}>
            {isPaid ? "View Recommendations" : "Cancel"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
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
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
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
