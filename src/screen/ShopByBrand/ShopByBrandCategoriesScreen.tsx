import React from "react"
import { View, Text, StyleSheet, Pressable } from "react-native"
import { Image } from "expo-image"
import Ionicons from "../../components/ui/Icon"
import { Colors } from "../../constants/colors"

interface Category {
  id: number
  name: string
  image?: string
  product_count?: number
}

interface ShopByBrandCategoriesScreenProps {
  categories: Category[]
  isDarkMode?: boolean
  onCategoryPress?: (categoryId: number) => void
}

export default function ShopByBrandCategoriesScreen({
  categories,
  isDarkMode = false,
  onCategoryPress = () => {},
}: ShopByBrandCategoriesScreenProps) {
  const themeColors = {
    text: isDarkMode ? "#f1f5f9" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1e293b" : Colors.white,
    cardBorder: isDarkMode ? "#334155" : "#e2e8f0",
    sectionBg: isDarkMode ? "#0f172a" : "#f5f5f5",
    sectionBorder: isDarkMode ? "#334155" : "#e5e7eb",
  }

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.sectionBg }]}
    >
      {categories && categories.length > 0 ? (
        <View
          style={[
            styles.productsSection,
            {
              backgroundColor: isDarkMode ? "#1e293b" : Colors.white,
              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
              marginBottom: 8,
            },
          ]}
        >
          <View style={styles.categoriesGrid}>
            {categories.map((category, index) => (
              <Pressable
                key={`category-${category.id || index}`}
                style={[
                  styles.categoryItem,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.cardBorder,
                  },
                ]}
                onPress={() => onCategoryPress(category.id)}
              >
                {category.image && (
                  <Image
                    source={{ uri: category.image }}
                    style={styles.categoryImage}
                    contentFit="cover"
                    transition={200}
                  />
                )}
                <Text
                  style={[styles.categoryName, { color: themeColors.text }]}
                  numberOfLines={2}
                >
                  {category.name}
                </Text>
                {category.product_count && (
                  <Text
                    style={[
                      styles.categoryCount,
                      { color: themeColors.textSecondary },
                    ]}
                  >
                    {category.product_count} items
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="folder-outline"
            size={48}
            color={themeColors.textSecondary}
          />
          <Text
            style={[styles.emptyText, { color: themeColors.textSecondary }]}
          >
            No categories found
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  productsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  categoryItem: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 11,
    fontWeight: "400",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
  },
})
