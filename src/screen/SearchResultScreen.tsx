import React, { useEffect, useCallback } from "react"
import {
  View,
  Text,
  RefreshControl,
  TouchableOpacity,
  BackHandler,
} from "react-native"
import { FlashList } from "@shopify/flash-list"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import ItemCard from "../components/Items/ItemCard"
import Toast from "react-native-toast-message"
import { useSearchResults } from "../hooks/query/useSearchResults"
import type { ProductCard } from "../services/productService"
import { SearchResultsSkeleton } from "../components/SkeletonLoader/SkeletonLoader"
import styles from "../styles/SearchResultScreen.styles"

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
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useSearchResults({ query, limit: 50 })

  const loading = isLoading
  const refreshing = isRefetching

  useEffect(() => {
    if (isError) {
      Toast.show({
        type: "error",
        text1: "Search Failed",
        text2: (error as any)?.message || "Unable to load search results",
      })
    }
  }, [isError, error])

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
    refetch()
  }

  const renderItem = useCallback(
    ({ item }: { item: ProductCard }) => (
      <View style={styles.gridItem}>
        <ItemCard
          product={item}
          onPress={onProductPress}
          token={token}
          isDarkMode={isDarkMode}
        />
      </View>
    ),
    [onProductPress, token, isDarkMode]
  )

  const keyExtractor = useCallback(
    (item: ProductCard) => `search-${item.id}`,
    []
  )

  const renderEmpty = useCallback(
    () => (
      <View
        style={[styles.emptyContainer, isDarkMode && styles.emptyContainerDark]}
      >
        <Ionicons
          name="search-outline"
          size={48}
          color={isDarkMode ? "#9ca3af" : Colors.textSecondary}
        />
        <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>
          No results found for &quot;{query}&quot;
        </Text>
      </View>
    ),
    [isDarkMode, query]
  )

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
        <SearchResultsSkeleton isDarkMode={isDarkMode} />
      ) : (
        <FlashList
          masonry
          numColumns={2}
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          style={isDarkMode ? styles.scrollDark : styles.scroll}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  )
}
