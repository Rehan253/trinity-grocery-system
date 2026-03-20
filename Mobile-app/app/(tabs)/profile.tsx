import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "details" ? "#FFFFFF" : palette.text },
            ]}
          >
            Details
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("history")}
          style={[
            styles.tabButton,
            activeTab === "history" && { backgroundColor: palette.primary },
          ]}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "history" ? "#FFFFFF" : palette.text },
            ]}
          >
            History
          </Text>
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
              <Text style={[styles.name, { color: palette.text }]}>
                Usama Iqbal
              </Text>
              <Text style={[styles.email, { color: palette.mutedText }]}>
                usama@example.com
              </Text>
            </View>
          </View>

          <View
            style={[styles.detailsCard, { backgroundColor: palette.surface }]}
          >
            <Text style={[styles.detailLabel, { color: palette.mutedText }]}>
              Phone
            </Text>
            <Text style={[styles.detailValue, { color: palette.text }]}>
              +92 300 0000000
            </Text>

            <Text
              style={[
                styles.detailLabel,
                styles.detailLabelSpacing,
                { color: palette.mutedText },
              ]}
            >
              Address
            </Text>
            <Text style={[styles.detailValue, { color: palette.text }]}>
              Home, Lahore, Pakistan
            </Text>

            <Text
              style={[
                styles.detailLabel,
                styles.detailLabelSpacing,
                { color: palette.mutedText },
              ]}
            >
              Member Since
            </Text>
            <Text style={[styles.detailValue, { color: palette.text }]}>
              Jan 2026
            </Text>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Purchase History
          </Text>

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
                  <Text style={[styles.orderNo, { color: palette.text }]}>
                    {item.orderNo}
                  </Text>
                  <Text style={[styles.total, { color: palette.primary }]}>
                    {item.total}
                  </Text>
                </View>
                <View style={styles.historyRow}>
                  <Text style={[styles.meta, { color: palette.mutedText }]}>
                    {item.date}
                  </Text>
                  <Text style={[styles.meta, { color: palette.mutedText }]}>
                    {item.items}
                  </Text>
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
