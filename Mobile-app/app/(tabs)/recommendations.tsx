import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/hooks/use-app-theme";
import { fetchRecommendationsByUserId } from "@/lib/api/recommendations";
import { getApiErrorMessage } from "@/lib/api/client";
import type { RecommendationItemDto } from "@/lib/api/types";

export default function RecommendationsTab() {
  const { palette } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RecommendationItemDto[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<number[]>([]);

  const sections = useMemo(
    () => [
      {
        key: "suggested",
        title: "You might be interested in",
        items: suggestions,
      },
    ],
    [suggestions],
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
      const raw = data as unknown as Record<string, unknown>;
      const purchased = Array.isArray(raw.purchased_product_ids)
        ? (raw.purchased_product_ids as number[])
        : Array.isArray(raw.purchasedProductIds)
          ? (raw.purchasedProductIds as number[])
          : [];

      const merged = Array.isArray(raw.recommendations)
        ? (raw.recommendations as RecommendationItemDto[])
        : [];

      const checkout = Array.isArray(raw.checkout_based)
        ? (raw.checkout_based as RecommendationItemDto[])
        : Array.isArray(raw.checkoutBased)
          ? (raw.checkoutBased as RecommendationItemDto[])
          : [];

      const also = Array.isArray(raw.also_bought)
        ? (raw.also_bought as RecommendationItemDto[])
        : Array.isArray(raw.alsoBought)
          ? (raw.alsoBought as RecommendationItemDto[])
          : [];

      const finalSuggestions: RecommendationItemDto[] = [];
      const seenIds = new Set<string>();
      const pushUnique = (items: RecommendationItemDto[]) => {
        for (const item of items) {
          const id = String(item?.objectID ?? "");
          if (!id || seenIds.has(id)) continue;
          seenIds.add(id);
          finalSuggestions.push(item);
          if (finalSuggestions.length >= 8) return;
        }
      };

      pushUnique(checkout);
      pushUnique(also);
      pushUnique(merged);

      setSuggestions(finalSuggestions.slice(0, 8));
      setPurchasedIds(purchased);
    } catch (e) {
      setError(getApiErrorMessage(e, "Failed to load recommendations"));
      setSuggestions([]);
      setPurchasedIds([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

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
                  <View style={styles.recRow}>
                    {rec.picture_url ? (
                      <Image
                        source={{ uri: rec.picture_url }}
                        style={styles.recImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.recImageFallback,
                          { backgroundColor: palette.background, borderColor: palette.border },
                        ]}
                      >
                        <ThemedText style={{ color: palette.mutedText }}>
                          No image
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.recContent}>
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
                  </View>
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
  recRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  recImage: {
    width: 84,
    height: 84,
    borderRadius: 10,
  },
  recImageFallback: {
    width: 84,
    height: 84,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recContent: {
    flex: 1,
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
