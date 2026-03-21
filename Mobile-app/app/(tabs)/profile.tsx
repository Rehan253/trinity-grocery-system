import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/AuthContext";
import { useAccessibilitySettings } from "@/hooks/use-accessibility-settings";
import { useAppTheme } from "@/hooks/use-app-theme";

type PurchaseHistoryItem = {
  id: string;
  date: string;
  orderNo: string;
  total: string;
  items: string;
};

const purchaseHistory: PurchaseHistoryItem[] = [
  {
    id: "1",
    date: "15 Mar 2026",
    orderNo: "#GA-12041",
    total: "$34.80",
    items: "6 items",
  },
  {
    id: "2",
    date: "12 Mar 2026",
    orderNo: "#GA-12007",
    total: "$18.45",
    items: "3 items",
  },
  {
    id: "3",
    date: "08 Mar 2026",
    orderNo: "#GA-11962",
    total: "$52.10",
    items: "9 items",
  },
];

export default function ProfileScreen() {
  const { palette } = useAppTheme();
  const { user, logout } = useAuth();
  const { fontSize, boldText, setFontSize, setBoldText } = useAccessibilitySettings();
  const [activeTab, setActiveTab] = useState<"details" | "history">("details");

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
        <>
          <ThemedText style={[styles.sectionTitle, { color: palette.text }]}>
            Purchase History
          </ThemedText>

          <FlatList
            data={purchaseHistory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.historyCard,
                  { backgroundColor: palette.surface },
                ]}
              >
                <View style={styles.historyRow}>
                  <ThemedText style={[styles.orderNo, { color: palette.text }]}>
                    {item.orderNo}
                  </ThemedText>
                  <ThemedText style={[styles.total, { color: palette.primary }]}>
                    {item.total}
                  </ThemedText>
                </View>
                <View style={styles.historyRow}>
                  <ThemedText style={[styles.meta, { color: palette.mutedText }]}>
                    {item.date}
                  </ThemedText>
                  <ThemedText style={[styles.meta, { color: palette.mutedText }]}>
                    {item.items}
                  </ThemedText>
                </View>
              </View>
            )}
          />
        </>
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
  listContent: {
    paddingBottom: 24,
    gap: 10,
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
