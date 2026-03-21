import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppPalette, GlobalStyles, ThemeColors } from "@/constants/theme";
import { PRODUCT_IMAGE_PLACEHOLDER } from "@/lib/utils/resolveProductImageUrl";

const { width: screenWidth } = Dimensions.get("window");

export const PRODUCT_CARD_WIDTH = screenWidth * 0.45;

type ProductCardProps = {
  isDark?: boolean;
  name: string;
  price: string;
  /** Tried in order until one loads (stored URL, OFF variants, placeholder). */
  imageUris: string[];
  unit?: string;
  onAddPress?: () => void;
};

export function ProductCard({
  isDark = false,
  name,
  price,
  imageUris,
  unit,
  onAddPress,
}: ProductCardProps) {
  const palette = isDark ? AppPalette.dark : AppPalette.light;
  const cardScale = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const feedbackTranslateY = useRef(new Animated.Value(0)).current;
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);

  const effectiveUris =
    imageUris.length > 0 ? imageUris : [PRODUCT_IMAGE_PLACEHOLDER];
  const safeIndex = Math.min(candidateIndex, effectiveUris.length - 1);
  const displayUri = effectiveUris[safeIndex] ?? PRODUCT_IMAGE_PLACEHOLDER;

  const imageUrisKey = useMemo(() => imageUris.join("|"), [imageUris]);

  useEffect(() => {
    setCandidateIndex(0);
  }, [imageUrisKey]);

  function handleAddWithEffect() {
    onAddPress?.();

    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 1.14,
        friction: 4,
        tension: 190,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 1.02,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setShowAddFeedback(true);
    feedbackOpacity.setValue(1);
    feedbackTranslateY.setValue(0);
    Animated.parallel([
      Animated.timing(feedbackOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(feedbackTranslateY, {
        toValue: -18,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(() => setShowAddFeedback(false));
  }

  return (
    <Animated.View
      style={[
        styles.card,
        GlobalStyles.card,
        { backgroundColor: palette.surface },
        { transform: [{ scale: cardScale }] },
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          { backgroundColor: palette.surfaceMuted },
        ]}
      >
        <Image
          source={{ uri: displayUri }}
          style={styles.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`${displayUri}-${safeIndex}`}
          onError={() => {
            setCandidateIndex((i) => {
              const uris =
                imageUris.length > 0 ? imageUris : [PRODUCT_IMAGE_PLACEHOLDER];
              return i < uris.length - 1 ? i + 1 : i;
            });
          }}
        />
      </View>

      <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
        {name}
      </Text>

      {unit ? (
        <Text
          style={[styles.unit, { color: palette.mutedText }]}
          numberOfLines={1}
        >
          {unit}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={styles.price}>{price}</Text>

        <View style={styles.addActionWrap}>
          {showAddFeedback ? (
            <Animated.Text
              style={[
                styles.addFeedback,
                {
                  opacity: feedbackOpacity,
                  transform: [{ translateY: feedbackTranslateY }],
                },
              ]}
            >
              +1
            </Animated.Text>
          ) : null}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={handleAddWithEffect}
              style={styles.addButton}
              hitSlop={10}
            >
              <MaterialIcons name="add" size={30} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  imageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#E9ECEF",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    color: ThemeColors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  unit: {
    color: "#6C757D",
    fontSize: 12,
    marginTop: 2,
  },
  footerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  price: {
    color: ThemeColors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ThemeColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addActionWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  addFeedback: {
    position: "absolute",
    bottom: 56,
    color: ThemeColors.primary,
    fontSize: 16,
    fontWeight: "800",
  },
});
