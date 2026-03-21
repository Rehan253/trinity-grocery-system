import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { fetchRecommendationsByUserId } from "@/lib/api/recommendations";
import { getApiErrorMessage } from "@/lib/api/client";
import type { RecommendationItemDto } from "@/lib/api/types";

type RecommendationSection = {
  key: string;
  title: string;
  items: RecommendationItemDto[];
};

export default function RecommendationsTab() {
  const { palette } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutBased, setCheckoutBased] = useState<RecommendationItemDto[]>(
    [],
  );
  const [alsoBought, setAlsoBought] = useState<RecommendationItemDto[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<number[]>([]);

  const sections = useMemo<RecommendationSection[]>(
    () => [
      {
        key: "checkout",
        title: "Based on your previous checkouts",
        items: checkoutBased,
      },
      {
        key: "also-bought",
        title: "Customers also bought",
        items: alsoBought,
      },
    ],
    [alsoBought, checkoutBased],
  );

  const load = useCallback(async () => {
    if (!user?.id) {
      setError("Please login first.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchRecommendationsByUserId(user.id);
      setCheckoutBased(Array.isArray(data.checkout_based) ? data.checkout_based : []);
      setAlsoBought(Array.isArray(data.also_bought) ? data.also_bought : []);
      setPurchasedIds(
        Array.isArray(data.purchased_product_ids) ? data.purchased_product_ids : [],
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to load recommendations"));
      setCheckoutBased([]);
      setAlsoBought([]);
      setPurchasedIds([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: palette.text }]}>
          Recommendations
        </ThemedText>
        <Pressable
          onPress={load}
          disabled={loading}
          style={[
            styles.refreshButton,
            { backgroundColor: palette.primary, opacity: loading ? 0.6 : 1 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={styles.refreshButtonText}>Refresh</ThemedText>
          )}
        </Pressable>
      </View>

      <View
        style={[
          styles.metaCard,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <ThemedText style={[styles.metaText, { color: palette.mutedText }]}>
          Purchased IDs: {purchasedIds.length > 0 ? purchasedIds.join(", ") : "None yet"}
        </ThemedText>
      </View>

      {error ? (
        <View
          style={[
            styles.errorBanner,
            { backgroundColor: palette.surface, borderColor: palette.border },
          ]}
        >
          <ThemedText style={{ color: palette.danger }}>{error}</ThemedText>
        </View>
      ) : null}

      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>
              {item.title}
            </ThemedText>
            {item.items.length === 0 ? (
              <ThemedText style={{ color: palette.mutedText }}>
                No items in this section yet.
              </ThemedText>
            ) : (
              item.items.map((rec) => (
                <View
                  key={`${item.key}-${rec.objectID}`}
                  style={[
                    styles.recCard,
                    { backgroundColor: palette.surface, borderColor: palette.border },
                  ]}
                >
                  <ThemedText style={[styles.recTitle, { color: palette.text }]}>
                    {rec.name || `Product ${rec.objectID}`}
                  </ThemedText>
                  <ThemedText style={{ color: palette.mutedText }}>
                    ID: {rec.objectID}
                  </ThemedText>
                  <ThemedText style={{ color: palette.mutedText }}>
                    Brand: {rec.brand || "N/A"}
                  </ThemedText>
                  <ThemedText style={{ color: palette.mutedText }}>
                    Category: {rec.category || "N/A"}
                  </ThemedText>
                  <ThemedText style={{ color: palette.mutedText }}>
                    Price: ${Number(rec.price || 0).toFixed(2)}
                  </ThemedText>
                </View>
              ))
            )}
          </View>
        )}
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.emptyWrap}>
              <ThemedText style={{ color: palette.mutedText }}>
                Tap Refresh to load recommendations.
              </ThemedText>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  refreshButton: {
    minHeight: 40,
    minWidth: 98,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  metaCard: {
    marginTop: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  metaText: {
    fontSize: 13,
  },
  errorBanner: {
    marginTop: 10,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  recCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  recTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
});
