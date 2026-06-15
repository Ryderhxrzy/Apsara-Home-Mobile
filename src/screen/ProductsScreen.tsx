// @ts-nocheck
import React, { useEffect } from "react"
import {  View,
  Text,
  FlatList,
  RefreshControl,
  Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { Colors } from "../constants/colors"
import { Product } from "../services/productService"
import { useFilteredProducts } from "../hooks/query/useFilteredProducts"
import ItemCard from "../components/Items/ItemCard"
import Toast from "react-native-toast-message"
import styles from "../styles/ProductsScreen.styles"

const { width } = Dimensions.get("window")
const CARD_MARGIN = 8
const NUM_COLUMNS = 2
const CARD_WIDTH = (width - 32 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS

interface ProductsScreenProps {
  token?: string | null
  catid?: number
  brandType?: number
  roomType?: number
  title?: string
}

export default function ProductsScreen({
  token,
  catid,
  brandType,
  roomType,
  title = "Products",
}: ProductsScreenProps) {
  const {
    data: products = [],
    isLoading: loading,
    isRefetching: refreshing,
    isError,
    error,
    refetch,
  } = useFilteredProducts({ token, catid, brandType, roomType })

  useEffect(() => {
    if (isError) {
      Toast.show({
        type: "error",
        text1: "Failed to load products",
        text2: (error as any)?.message || "Please try again",
      })
    }
  }, [isError, error])

  const onRefresh = () => {
    refetch()
  }

  const handleProductPress = (product: Product) => {
    // Navigate to product detail - can be implemented later
    Toast.show({
      type: "info",
      text1: product.name,
      text2: `₱${product.priceSrp.toLocaleString()}`,
    })
  }

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.cardWrapper}>
      <ItemCard product={item} onPress={handleProductPress} />
    </View>
  )

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons
            name="cube-outline"
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerCount}>{products.length} items</Text>
      </View>

      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => `product-${item.id}`}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="cube-outline"
              size={48}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
