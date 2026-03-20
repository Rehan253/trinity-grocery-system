import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppPalette } from "@/constants/theme";

type HeaderProps = {
  isDark?: boolean;
  cartCount?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChangeText?: (value: string) => void;
  onToggleTheme?: () => void;
  onScanPress?: () => void;
  onCartPress?: () => void;
};

export function Header({
  isDark = false,
  cartCount = 0,
  searchPlaceholder = "Search groceries",
  searchValue,
  onSearchChangeText,
  onToggleTheme,
  onScanPress,
  onCartPress,
}: HeaderProps) {
  const badgeScale = useRef(new Animated.Value(1)).current;
  const previousCartCount = useRef(cartCount);
  const palette = isDark ? AppPalette.dark : AppPalette.light;

  useEffect(() => {
    if (cartCount > previousCartCount.current) {
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1.22,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(badgeScale, {
          toValue: 1,
          friction: 4,
          tension: 160,
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousCartCount.current = cartCount;
  }, [badgeScale, cartCount]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safeArea, { backgroundColor: palette.secondary }]}
    >
      <View style={[styles.container, { backgroundColor: palette.secondary }]}>
        <Pressable onPress={onToggleTheme} style={styles.themeToggleButton}>
          <MaterialIcons
            name={isDark ? "light-mode" : "dark-mode"}
            size={18}
            color="#FFFFFF"
          />
          <Text style={styles.themeToggleText}>
            {isDark ? "Light" : "Dark"}
          </Text>
        </Pressable>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: palette.inputBackground },
          ]}
        >
          <MaterialIcons name="search" size={18} color={palette.iconMuted} />
          <TextInput
            style={[styles.searchInput, { color: palette.inputText }]}
            placeholder={searchPlaceholder}
            placeholderTextColor={palette.inputPlaceholder}
            value={searchValue}
            onChangeText={onSearchChangeText}
          />
        </View>

        <View style={styles.rightActions}>
          <Pressable onPress={onScanPress} style={styles.iconButton}>
            <MaterialIcons name="qr-code-scanner" size={22} color="#FFFFFF" />
          </Pressable>

          <Pressable onPress={onCartPress} style={styles.cartButton}>
            <MaterialIcons name="shopping-cart" size={24} color="#FFFFFF" />
            <Animated.View
              style={[
                styles.badge,
                {
                  backgroundColor: palette.primary,
                  transform: [{ scale: badgeScale }],
                },
              ]}
            >
              <Text style={styles.badgeText}>{cartCount}</Text>
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: AppPalette.light.secondary,
  },
  container: {
    backgroundColor: AppPalette.light.secondary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  themeToggleButton: {
    minWidth: 70,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  themeToggleText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  searchBar: {
    flex: 1,
    minHeight: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#1A1A1A",
    fontSize: 14,
    paddingVertical: 0,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  cartButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B35",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
