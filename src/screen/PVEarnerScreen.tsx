// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from "react"
import {  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import DailyCheckin from "../components/DailyCheckin/DailyCheckin"
import MissionTasks from "../components/MissionTasks/MissionTasks"
import ItemCard from "../components/Items/ItemCard"
import { useOptimizedProducts } from "../hooks/useOptimizedProducts"
import { Product } from "../services/productService"
import styles from "../styles/PVEarnerScreen.styles"

interface PVEarnerScreenProps {
  isDarkMode: boolean
  onBack: () => void
  onDailyCheckin?: () => void
  token?: string | null
  wishlistItems?: any[]
  onWishlistChange?: () => void
  onProductPress?: (id: number) => void
  onShopPress?: () => void
}

export default function PVEarnerScreen({
  isDarkMode,
  onBack,
  onDailyCheckin,
  token,
  wishlistItems = [],
  onWishlistChange = () => {},
  onProductPress = () => {},
  onShopPress = () => {},
}: PVEarnerScreenProps) {
  const insets = useSafeAreaInsets()
  const [currentPage, setCurrentPage] = useState(1)
  const [localWishlistItems, setLocalWishlistItems] = useState(wishlistItems)

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack])

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f8fafc",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useOptimizedProducts({
      token,
    })

  const currentPageProducts = useMemo(() => {
    let products: Product[] = []
    if (data?.pages) {
      for (let i = 0; i < currentPage && i < data.pages.length; i++) {
        products = [...products, ...(data.pages[i]?.products || [])]
      }
    }
    // Limit to 20 products
    return products.slice(0, 20)
  }, [data, currentPage])

  const masonryData = useMemo(() => {
    const leftColumn: Product[] = []
    const rightColumn: Product[] = []

    currentPageProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product)
      } else {
        rightColumn.push(product)
      }
    })

    return { leftColumn, rightColumn }
  }, [currentPageProducts])

  const renderItem = useCallback(
    (item: Product) => {
      const wishlistItem = localWishlistItems?.find(
        (w) => w.product.id === item.id
      )
      const productCard = {
        id: item.id,
        name: item.name,
        image: item.image,
        soldCount: item.soldCount,
        originalPrice: item.priceSrp,
        memberPrice: item.priceMember,
        pv: item.prodpv,
        brandName: item.brand,
        variantCount: item.variants?.length ?? 0,
        categoryId: item.catid,
        brandId: item.brandType,
        badges: {
          musthave: item.musthave,
          bestseller: item.bestseller,
          salespromo: item.salespromo,
        },
      }

      const handleWishlistToggle = (
        productId: number,
        isWishlisted: boolean
      ) => {
        if (isWishlisted) {
          setLocalWishlistItems([
            ...localWishlistItems,
            { product: { id: productId }, wishlist_id: 0 },
          ])
        } else {
          setLocalWishlistItems(
            localWishlistItems.filter((w) => w.product.id !== productId)
          )
        }
        onWishlistChange?.()
      }

      return (
        <ItemCard
          product={productCard}
          token={token}
          isDarkMode={isDarkMode}
          onPress={() => onProductPress(item.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={handleWishlistToggle}
        />
      )
    },
    [localWishlistItems, token, isDarkMode, onProductPress, onWishlistChange]
  )

  const renderLoadingPlaceholders = () => {
    const dummyProducts = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      name: "Loading...",
      image: undefined,
      soldCount: 0,
      priceSrp: 0,
      priceMember: 0,
      prodpv: 0,
      brand: "Brand",
      variants: [],
      musthave: false,
      bestseller: false,
      salespromo: false,
    }))

    const leftColumn = dummyProducts.filter((_, i) => i % 2 === 0)
    const rightColumn = dummyProducts.filter((_, i) => i % 2 !== 0)

    const renderDummyCard = (item: any) => (
      <View key={`loading-${item.id}`} style={styles.masonryItem}>
        <View
          style={[
            styles.dummyCard,
            { backgroundColor: colors.containerBg, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.dummyImageContainer,
              { backgroundColor: isDarkMode ? "#0f172a" : "#f1f5f9" },
            ]}
          >
            <Image
              source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png"
            }}
              style={styles.dummyImage}
              contentFit="contain"
              transition={200}
              tintColor={isDarkMode ? "#cbd5e1" : "#4b5563"}
            />
          </View>
          <View style={styles.dummyContent}>
            <View
              style={[
                styles.dummyLine,
                { backgroundColor: isDarkMode ? "#334155" : "#e5e7eb" },
              ]}
            />
            <View
              style={[
                styles.dummyLine,
                {
                  backgroundColor: isDarkMode ? "#334155" : "#e5e7eb",
                  width: "70%",
                },
              ]}
            />
            <View
              style={[
                styles.dummyLine,
                {
                  backgroundColor: isDarkMode ? "#334155" : "#e5e7eb",
                  width: "50%",
                  marginTop: 8,
                },
              ]}
            />
          </View>
        </View>
      </View>
    )

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {leftColumn.map((item) => renderDummyCard(item))}
        </View>
        <View style={styles.masonryColumn}>
          {rightColumn.map((item) => renderDummyCard(item))}
        </View>
      </View>
    )
  }

  const renderProductsContent = () => {
    if (currentPageProducts.length === 0 && isLoading) {
      return renderLoadingPlaceholders()
    }

    if (currentPageProducts.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
          <Ionicons name="cube-outline" size={48} color={colors.textSec} />
          <Text style={[styles.emptyText, { color: colors.textSec }]}>
            No products found
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {masonryData.leftColumn.map((product, index) => (
            <View
              key={`left-${product.id}-${index}`}
              style={styles.masonryItem}
            >
              {renderItem(product)}
            </View>
          ))}
        </View>
        <View style={styles.masonryColumn}>
          {masonryData.rightColumn.map((product, index) => (
            <View
              key={`right-${product.id}-${index}`}
              style={styles.masonryItem}
            >
              {renderItem(product)}
            </View>
          ))}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.bg }]}
      edges={["left", "right", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.containerBg,
            borderBottomColor: colors.border,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back-outline"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          PV Earner
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Daily Check-In and Missions */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <DailyCheckin
          isDarkMode={isDarkMode}
          token={token}
          onViewMore={onBack}
        />
        <MissionTasks isDarkMode={isDarkMode} />

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={[styles.productsSectionTitle, { color: colors.text }]}>
            Explore Products
          </Text>
          {renderProductsContent()}
        </View>

        {/* Shop More Button */}
        <TouchableOpacity
          style={[styles.shopMoreButton, { marginHorizontal: 8 }]}
          activeOpacity={0.85}
          onPress={onShopPress}
        >
          <LinearGradient
            colors={["#0284c7", "#0ea5e9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shopMoreGradient}
          >
            <Ionicons name="storefront" size={20} color={Colors.white} />
            <Text style={styles.shopMoreText}>Shop More Products</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
