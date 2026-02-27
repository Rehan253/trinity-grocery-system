import { useEffect } from "react";
import { ScrollView, View, Text, Button } from "react-native";
import useCheckoutStore from "../store/checkoutStore";

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
};

export default function PurchaseHistoryScreen({ navigation }) {
  const { purchaseHistory, loading, error, fetchPurchaseHistory } = useCheckoutStore();

  useEffect(() => {
    fetchPurchaseHistory();
  }, [fetchPurchaseHistory]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Purchase History</Text>

      {loading && <Text>Loading purchase history...</Text>}
      {!!error && <Text style={{ color: "red" }}>{error}</Text>}

      {!loading && !purchaseHistory.length ? (
        <Text>No purchases found yet.</Text>
      ) : (
        purchaseHistory.map((invoice) => (
          <View
            key={`invoice-${invoice.invoice_id}`}
            style={{ borderWidth: 1, borderRadius: 8, padding: 12, gap: 6 }}
          >
            <Text style={{ fontWeight: "700" }}>Invoice #{invoice.invoice_id}</Text>
            <Text>Total: ${Number(invoice.total_amount || 0).toFixed(2)}</Text>
            <Text>Items: {invoice.item_count ?? 0}</Text>
            <Text>Payment Status: {invoice.payment_status || "unknown"}</Text>
            <Text>Payment Method: {invoice.payment_method || "N/A"}</Text>
            <Text>Created At: {formatDate(invoice.created_at)}</Text>
          </View>
        ))
      )}

      <Button
        title={loading ? "Refreshing..." : "Refresh"}
        onPress={fetchPurchaseHistory}
        disabled={loading}
      />
      <Button title="Back to Home" onPress={() => navigation.navigate("Home")} />
    </ScrollView>
  );
}
