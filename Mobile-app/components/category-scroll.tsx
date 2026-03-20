import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppPalette, ThemeColors } from "@/constants/theme";

type Category = {
  id: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
};

type CategoryScrollProps = {
  isDark?: boolean;
  categories: Category[];
  initialSelectedId?: string;
  onSelectCategory?: (category: Category) => void;
};

export function CategoryScroll({
  isDark = false,
  categories,
  initialSelectedId,
  onSelectCategory,
}: CategoryScrollProps) {
  const palette = isDark ? AppPalette.dark : AppPalette.light;
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialSelectedId ?? categories[0]?.id ?? "",
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {categories.map((category) => {
        const isSelected = category.id === selectedCategoryId;

        return (
          <Pressable
            key={category.id}
            onPress={() => {
              setSelectedCategoryId(category.id);
              onSelectCategory?.(category);
            }}
            style={[
              styles.pill,
              { backgroundColor: palette.surface },
              isSelected && styles.selectedPill,
            ]}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons
                name={category.icon}
                size={22}
                color={isSelected ? "#FFFFFF" : palette.text}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isSelected ? "#FFFFFF" : palette.text },
                isSelected && styles.selectedLabel,
              ]}
            >
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pill: {
    width: 84,
    minHeight: 92,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  selectedPill: {
    backgroundColor: ThemeColors.primary,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: ThemeColors.text,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  selectedLabel: {
    color: "#FFFFFF",
  },
});
