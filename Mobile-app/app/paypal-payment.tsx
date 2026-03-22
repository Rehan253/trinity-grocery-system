import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";
import { getApiErrorMessage } from "@/lib/api/client";
import { capturePayPalOrder, createPayPalOrder } from "@/lib/api/payments";
import { CLEAR_CART_AFTER_CHECKOUT_KEY } from "@/lib/storage/checkoutFlags";

function getQueryParam(
  params: Linking.QueryParams | null | undefined,
  key: string,
): string | undefined {
  const v = params?.[key];
  if (Array.isArray(v)) return v[0];
  if (typeof v === "string") return v;
  return undefined;
}

export default function PaypalPaymentScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const params = useLocalSearchParams<{
    amount?: string;
    items?: string;
    invoiceId?: string;
  }>();

  const [isPaid, setIsPaid] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  const amount = params.amount ?? "0.00";
  const items = params.items ?? "0";
  const invoiceIdRaw = params.invoiceId ?? "";
  const invoiceIdNum = Number(invoiceIdRaw);
  const hasValidInvoice =
    invoiceIdRaw.length > 0 && Number.isFinite(invoiceIdNum) && invoiceIdNum > 0;

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const completeSuccess = useCallback(async () => {
    setIsPaid(true);
    try {
      await AsyncStorage.setItem(CLEAR_CART_AFTER_CHECKOUT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const runPayPalFlow = useCallback(async () => {
    if (!hasValidInvoice) {
      Alert.alert(
        "Missing order",
        "No invoice was found. Go back and try checkout again.",
      );
      return;
    }

    setPayBusy(true);
    try {
      const redirectUrl = Linking.createURL("/paypal-payment");
      const created = await createPayPalOrder({
        invoice_id: invoiceIdNum,
        return_url: redirectUrl,
        cancel_url: redirectUrl,
      });

      const orderId = created.order_id;
      const approveUrl = created.approve_url ?? "";

      if (approveUrl.includes("mock-paypal.local")) {
        await capturePayPalOrder(invoiceIdNum, orderId);
        await completeSuccess();
        return;
      }

      if (!approveUrl) {
        Alert.alert(
          "PayPal",
          "No approval URL was returned. Check PayPal credentials and backend logs.",
        );
        return;
      }

      const session = await WebBrowser.openAuthSessionAsync(
        approveUrl,
        redirectUrl,
      );

      if (session.type === "cancel") {
        return;
      }

      if (session.type !== "success" || !session.url) {
        Alert.alert("PayPal", "Could not complete the PayPal session.");
        return;
      }

      const parsed = Linking.parse(session.url);
      const token = getQueryParam(parsed.queryParams, "token");

      if (!token) {
        Alert.alert(
          "Payment",
          "PayPal did not return a payment token. You can cancel or try again.",
        );
        return;
      }

      await capturePayPalOrder(invoiceIdNum, token);
      await completeSuccess();
    } catch (e) {
      Alert.alert("PayPal", getApiErrorMessage(e, "Payment failed."));
    } finally {
      setPayBusy(false);
    }
  }, [completeSuccess, hasValidInvoice, invoiceIdNum]);

  function handleBack() {
    if (isPaid) {
      router.replace("/(tabs)");
      return;
    }
    router.back();
  }

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
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

        {!hasValidInvoice ? (
          <Text style={[styles.warnText, { color: palette.danger }]}>
            Invalid or missing invoice. Use Proceed to Checkout from the cart.
          </Text>
        ) : null}

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
              Invoice
            </Text>
            <Text style={[styles.summaryValue, { color: palette.text }]}>
              #{invoiceIdRaw}
            </Text>
          </View>
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
          </View>
        ) : (
          <Pressable
            disabled={payBusy || !hasValidInvoice}
            style={[
              styles.payButton,
              {
                backgroundColor: palette.primary,
                opacity: payBusy || !hasValidInvoice ? 0.65 : 1,
              },
            ]}
            onPress={() => void runPayPalFlow()}
          >
            {payBusy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.payButtonText}>Pay ${amount} with PayPal</Text>
            )}
          </Pressable>
        )}

        <Pressable
          style={[styles.backButton, { borderColor: palette.border }]}
          onPress={handleBack}
        >
          <Text style={[styles.backButtonText, { color: palette.text }]}>
            {isPaid ? "Back to Store" : "Cancel"}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
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
  warnText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
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
