import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useAccessibilitySettings } from "@/hooks/use-accessibility-settings";
import { useAppTheme } from "@/hooks/use-app-theme";
import { fetchMyInvoices } from "@/lib/api/invoices";
import { getApiErrorMessage } from "@/lib/api/client";
import type { MyInvoiceSummaryDto } from "@/lib/api/types";

function formatInvoiceDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatMoney(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  return `$${n.toFixed(2)}`;
}

function itemCountLabel(count: number): string {
  if (count === 1) return "1 item";
  return `${count} items`;
}

export default function ProfileScreen() {
  const { palette } = useAppTheme();
  const { token, user, logout } = useAuth();
  const { fontSize, boldText, setFontSize, setBoldText } = useAccessibilitySettings();
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

  const [invoices, setInvoices] = useState<MyInvoiceSummaryDto[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesRefreshing, setInvoicesRefreshing] = useState(false);
  const [invoicesError, setInvoicesError] = useState<string | null>(null);

  const loadMyInvoices = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      if (!token) return;
      if (mode === "refresh") setInvoicesRefreshing(true);
      else setInvoicesLoading(true);
      setInvoicesError(null);
      try {
        const rows = await fetchMyInvoices();
        setInvoices(rows);
      } catch (e) {
        setInvoicesError(getApiErrorMessage(e, "Could not load orders"));
      } finally {
        setInvoicesLoading(false);
        setInvoicesRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (activeTab === "history" && token) {
      loadMyInvoices("initial");
    }
  }, [activeTab, token, loadMyInvoices]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.screen, { backgroundColor: palette.background }]}
    >
      <View style={[styles.tabBar, { backgroundColor: palette.surface }]}>
        <Pressable
          onPress={() => setActiveTab("details")}
          style={[
            styles.tabButton,
            activeTab === "details" && { backgroundColor: palette.primary },
          ]}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "details" ? "#FFFFFF" : palette.text },
            ]}
          >
            Details
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("history")}
          style={[
            styles.tabButton,
            activeTab === "history" && { backgroundColor: palette.primary },
          ]}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "history" ? "#FFFFFF" : palette.text },
            ]}
          >
            History
          </ThemedText>
        </Pressable>
      </View>

      {activeTab === "details" ? (
        <>
          <View
            style={[styles.profileCard, { backgroundColor: palette.surface }]}
          >
            <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
              <MaterialIcons name="person" size={30} color="#FFFFFF" />
            </View>
            <View style={styles.profileText}>
              <ThemedText style={[styles.name, { color: palette.text }]}>
                {user
                  ? [user.first_name, user.last_name].filter(Boolean).join(" ").trim() ||
                    user.email
                  : "—"}
              </ThemedText>
              <ThemedText style={[styles.email, { color: palette.mutedText }]}>
                {user?.email ?? "—"}
              </ThemedText>
            </View>
          </View>

          <View
            style={[styles.detailsCard, { backgroundColor: palette.surface }]}
          >
            <ThemedText style={[styles.detailLabel, { color: palette.mutedText }]}>
              Phone
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: palette.text }]}>
              {user?.phone_number ?? "—"}
            </ThemedText>

            <ThemedText
              style={[
                styles.detailLabel,
                styles.detailLabelSpacing,
                { color: palette.mutedText },
              ]}
            >
              Address
            </ThemedText>
            <ThemedText style={[styles.detailValue, { color: palette.text }]}>
              {user?.address
                ? [user.address, user.city, user.country]
                    .filter(Boolean)
                    .join(", ")
                : "—"}
            </ThemedText>
          </View>

          <View
            style={[styles.preferencesCard, { backgroundColor: palette.surface }]}
          >
            <ThemedText style={[styles.preferencesTitle, { color: palette.text }]}>
              Accessibility Preferences
            </ThemedText>

            <ThemedText style={[styles.preferenceLabel, { color: palette.mutedText }]}>
              Font size
            </ThemedText>
            <View style={styles.fontSizeRow}>
              {[
                { key: "small", label: "Small" },
                { key: "default", label: "Default" },
                { key: "large", label: "Large" },
              ].map((option) => {
                const isActive = fontSize === option.key;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() =>
                      setFontSize(option.key as "small" | "default" | "large")
                    }
                    style={[
                      styles.fontSizeButton,
                      {
                        backgroundColor: isActive
                          ? palette.primary
                          : palette.surfaceMuted,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.fontSizeButtonText,
                        { color: isActive ? "#FFFFFF" : palette.text },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.switchRow}>
              <View>
                <ThemedText style={[styles.preferenceLabel, { color: palette.text }]}>
                  Bold text
                </ThemedText>
                <ThemedText
                  style={[
                    styles.preferenceHelp,
                    { color: palette.mutedText },
                  ]}
                >
                  Makes app text heavier for readability.
                </ThemedText>
              </View>
              <Switch
                value={boldText}
                onValueChange={setBoldText}
                trackColor={{ false: palette.surfaceMuted, true: palette.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <Pressable
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                borderColor: palette.border,
                backgroundColor: pressed ? palette.surfaceMuted : palette.surface,
              },
            ]}
          >
            <MaterialIcons name="logout" size={20} color={palette.danger} />
            <ThemedText style={[styles.logoutText, { color: palette.danger }]}>
              Log out
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <View style={styles.historySection}>
          <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>
            Order history
          </ThemedText>

          {invoicesError ? (
            <View
              style={[
                styles.invoicesErrorBanner,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <ThemedText style={[styles.invoicesErrorText, { color: palette.danger }]}>
                {invoicesError}
              </ThemedText>
              <Pressable
                onPress={() => loadMyInvoices("initial")}
                style={[styles.retryInvoices, { backgroundColor: palette.primary }]}
              >
                <ThemedText style={styles.retryInvoicesText}>Retry</ThemedText>
              </Pressable>
            </View>
          ) : null}

          <FlatList
            data={invoices}
            keyExtractor={(item) => String(item.invoice_id)}
            style={styles.historyList}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={invoicesRefreshing}
                onRefresh={() => loadMyInvoices("refresh")}
                tintColor={palette.primary}
              />
            }
            ListEmptyComponent={
              invoicesLoading ? (
                <View style={styles.invoicesEmpty}>
                  <ActivityIndicator size="large" color={palette.primary} />
                  <ThemedText
                    style={[styles.invoicesEmptyText, { color: palette.mutedText }]}
                  >
                    Loading orders…
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.invoicesEmpty}>
                  <ThemedText
                    style={[styles.invoicesEmptyText, { color: palette.mutedText }]}
                  >
                    {invoicesError
                      ? "Pull down to refresh."
                      : "No orders yet. Your purchases will appear here."}
                  </ThemedText>
                </View>
              )
            }
            renderItem={({ item }) => (
              <View
                style={[
                  styles.historyCard,
                  { backgroundColor: palette.surface },
                ]}
              >
                <View style={styles.historyRow}>
                  <ThemedText style={[styles.orderNo, { color: palette.text }]}>
                    Order #{item.invoice_id}
                  </ThemedText>
                  <ThemedText style={[styles.total, { color: palette.primary }]}>
                    {formatMoney(item.total_amount)}
                  </ThemedText>
                </View>
                <View style={styles.historyRow}>
                  <ThemedText style={[styles.meta, { color: palette.mutedText }]}>
                    {formatInvoiceDate(item.created_at)}
                  </ThemedText>
                  <ThemedText style={[styles.meta, { color: palette.mutedText }]}>
                    {itemCountLabel(item.item_count)}
                  </ThemedText>
                </View>
                <View style={[styles.historyRow, styles.statusRow]}>
                  <ThemedText style={[styles.statusLabel, { color: palette.mutedText }]}>
                    {item.payment_method
                      ? `${item.payment_method} · ${item.payment_status}`
                      : item.payment_status}
                  </ThemedText>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  profileCard: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  email: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  detailsCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  preferencesCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },
  preferencesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  preferenceHelp: {
    fontSize: 12,
  },
  fontSizeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  fontSizeButton: {
    flex: 1,
    borderRadius: 10,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  fontSizeButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailLabelSpacing: {
    marginTop: 12,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  historySection: {
    flex: 1,
  },
  historyList: {
    flex: 1,
  },
  invoicesErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  invoicesErrorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  retryInvoices: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryInvoicesText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  invoicesEmpty: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  invoicesEmptyText: {
    marginTop: 12,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
    flexGrow: 1,
  },
  statusRow: {
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  historyCard: {
    borderRadius: 14,
    padding: 12,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNo: {
    fontSize: 15,
    fontWeight: "700",
  },
  total: {
    fontSize: 15,
    fontWeight: "800",
  },
  meta: {
    marginTop: 5,
    fontSize: 12,
  },
});
