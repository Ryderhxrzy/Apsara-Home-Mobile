import React, { useEffect, useState, useCallback, useMemo } from "react"
import {  View,
  Text,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import ItemCard from "../components/Items/ItemCard"
import Toast from "react-native-toast-message"
import { meilisearchService } from "../services/meilisearchService"
import type { ProductCard } from "../services/productService"
import styles from "../styles/SearchResultScreen.styles"

const { width } = Dimensions.get("window")

interface SearchResultScreenProps {
  token?: string | null
  query: string
  onBack?: () => void
  onProductPress?: (product: ProductCard) => void
  isDarkMode?: boolean
}

export default function SearchResultScreen({
  token,
  query,
  onBack,
  onProductPress,
  isDarkMode = false,
}: SearchResultScreenProps) {
  const [products, setProducts] = useState<ProductCard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchResults = useCallback(async () => {
    if (!query.trim()) {
      setProducts([])
      setLoading(false)
      setRefreshing(false)
      return
    }
    try {
      setLoading(true)
      const results = await meilisearchService.searchProducts(query.trim(), 50)

      console.log("🔍 Search Results:", {
        count: results.length,
        firstItem: results[0] && {
          id: results[0].id,
          name: results[0].name,
          hasImage: !!results[0].image,
        },
      })
      setProducts(results)
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Search Failed",
        text2: error.message || "Unable to load search results",
      })
      setProducts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [query])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  useEffect(() => {
    const onBackPress = () => {
      if (onBack) {
        onBack()
        return true
      }
      return false
    }

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    )
    return () => backHandler.remove()
  }, [onBack])

  const onRefresh = () => {
    setRefreshing(true)
    fetchResults()
  }

  const masonryColumns = useMemo(() => {
    const leftColumn: ProductCard[] = []
    const rightColumn: ProductCard[] = []

    products.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product)
      } else {
        rightColumn.push(product)
      }
    })

    return { leftColumn, rightColumn }
  }, [products])

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.containerDark]}
      edges={["top"]}
    >
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDarkMode ? "#f8fafc" : Colors.text}
              />
            </TouchableOpacity>
          )}
          <View style={styles.headerTextContainer}>
            <Text
              style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
              numberOfLines={1}
            >
              Search Results
            </Text>
            <Text
              style={[styles.headerQuery, isDarkMode && styles.headerQueryDark]}
              numberOfLines={2}
            >{`"${query}"`}</Text>
          </View>
        </View>
        <Text
          style={[styles.headerCount, isDarkMode && styles.headerCountDark]}
        >
          {products.length} items
        </Text>
      </View>

      {loading && !refreshing ? (
        <View
          style={[
            styles.loadingContainer,
            isDarkMode && styles.loadingContainerDark,
          ]}
        >
          <Ionicons
            name="search-outline"
            size={48}
            color={isDarkMode ? "#9ca3af" : Colors.textSecondary}
          />
          <Text
            style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}
          >
            Searching...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.scroll, isDarkMode && styles.scrollDark]}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {products.length === 0 ? (
            <View
              style={[
                styles.emptyContainer,
                isDarkMode && styles.emptyContainerDark,
              ]}
            >
              <Ionicons
                name="search-outline"
                size={48}
                color={isDarkMode ? "#9ca3af" : Colors.textSecondary}
              />
              <Text
                style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}
              >
                No results found for "{query}"
              </Text>
            </View>
          ) : (
            <View style={styles.masonryGrid}>
              <View style={styles.masonryColumn}>
                {masonryColumns.leftColumn.map((product) => (
                  <View key={`search-${product.id}`} style={styles.productItem}>
                    <ItemCard
                      product={product}
                      onPress={onProductPress}
                      token={token}
                      isDarkMode={isDarkMode}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.masonryColumn}>
                {masonryColumns.rightColumn.map((product) => (
                  <View key={`search-${product.id}`} style={styles.productItem}>
                    <ItemCard
                      product={product}
                      onPress={onProductPress}
                      token={token}
                      isDarkMode={isDarkMode}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
