import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "@/hooks/use-app-theme";

export default function PaypalPaymentScreen() {
  const router = useRouter();
  const { palette } = useAppTheme();
  const params = useLocalSearchParams<{ amount?: string; items?: string }>();
  const [isPaid, setIsPaid] = useState(false);

  const amount = params.amount ?? "0.00";
  const items = params.items ?? "0";

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
          </View>
        ) : (
          <Pressable
            style={[styles.payButton, { backgroundColor: palette.primary }]}
            onPress={() => setIsPaid(true)}
          >
            <Text style={styles.payButtonText}>Pay ${amount} with PayPal</Text>
          </Pressable>
        )}

        <Pressable
          style={[styles.backButton, { borderColor: palette.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: palette.text }]}>
            {isPaid ? "Back to Store" : "Cancel"}
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
