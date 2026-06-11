// @ts-nocheck
import React, { useMemo, useState, useRef } from "react"
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native"
import { Image } from "expo-image"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../../constants/colors"
import FeaturedItems from "../../components/Items/FeaturedItems"
import Toast from "react-native-toast-message"
import styles, { width } from "../../styles/ShopByBrandHomeScreen.styles"

const BANNER_IMAGES = [
  "https://t3.ftcdn.net/jpg/04/65/46/52/360_F_465465254_1pN9MGrA831idD6zIBL7q8rnZZpUCQTy.jpg",
  "https://t3.ftcdn.net/jpg/04/65/46/52/360_F_465465254_1pN9MGrA831idD6zIBL7q8rnZZpUCQTy.jpg",
]

const STATIC_VOUCHERS = [
  {
    id: 1,
    discount: "30%",
    description: "Discount on all products",
    code: "SAVE30",
    minSpend: "₱500",
    validity: "Until Dec 31",
  },
  {
    id: 2,
    discount: "₱200",
    description: "Off on purchases",
    code: "BRAND200",
    minSpend: "₱1000",
    validity: "Until Dec 31",
  },
  {
    id: 3,
    discount: "25%",
    description: "Special discount",
    code: "SPECIAL25",
    minSpend: "₱750",
    validity: "Until Dec 31",
  },
  {
    id: 4,
    discount: "₱500",
    description: "Limited time offer",
    code: "LUCKY500",
    minSpend: "₱2000",
    validity: "Until Dec 31",
  },
]

interface Product {
  id: number
  name: string
  image: string
  price?: string
  priceMember?: string
  priceDp?: string
  prodpv?: string
  pv?: string
  original_price?: string
  discounted_price?: string
  musthave?: boolean
  bestseller?: boolean
  salespromo?: boolean
  priceSrp?: number
  soldCount?: number
  brand?: string
  variants?: any[]
}

interface ShopByBrandHomeScreenProps {
  products: Product[]
  token?: string | null
  isDarkMode?: boolean
  onProductPress?: (id: number) => void
  wishlistItems?: any[]
  onWishlistChange?: () => void
  loading?: boolean
  onSeeMore?: () => void
}

export default function ShopByBrandHomeScreen({
  products,
  token,
  isDarkMode = false,
  onProductPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
  loading = false,
  onSeeMore = () => {},
}: ShopByBrandHomeScreenProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)
  const carouselRef = useRef<ScrollView>(null)

  const handleCopyCode = (code: string) => {
    setCopiedCode(code)
    Toast.show({
      type: "success",
      text1: "Copied!",
      text2: `Voucher code ${code} copied to clipboard`,
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x
    const index = Math.round(contentOffsetX / (width * 0.9))
    setCurrentBannerIndex(index)
  }

  const themeColors = {
    containerBg: isDarkMode ? "#0f172a" : "#f5f5f5",
    text: isDarkMode ? "#f1f5f9" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1e293b" : Colors.white,
    cardBorder: isDarkMode ? "#334155" : "#e2e8f0",
    divider: isDarkMode ? "#334155" : "#eef2f7",
  }

  const featuredProducts = useMemo(
    () => products.filter((p) => p.musthave).slice(0, 8),
    [products]
  )

  const bestSellerProducts = useMemo(
    () => products.filter((p) => p.bestseller).slice(0, 8),
    [products]
  )

  const renderFeaturedItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find((w) => w.product.id === item.id)

    return (
      <View key={`featured-${item.id}`} style={styles.featuredItemWrap}>
        <FeaturedItems
          product={{
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            priceMember: item.priceMember,
            priceDp: item.priceDp,
            prodpv: item.prodpv,
            original_price: item.priceSrp,
            discounted_price: item.price,
            musthave: item.musthave,
            bestseller: item.bestseller,
          }}
          token={token}
          isDarkMode={isDarkMode}
          onPress={() => onProductPress(item.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={onWishlistChange}
        />
      </View>
    )
  }


  return (
    <View style={{ flex: 1 }}>
      {/* Voucher Section */}
      <View
        style={[
          styles.voucherSectionContainer,
          {
            backgroundColor: isDarkMode ? "#1e293b" : Colors.white,
            borderColor: isDarkMode ? "#334155" : "#e2e8f0",
            marginBottom: 8,
          },
        ]}
      >
        <View style={styles.voucherHeader}>
          <View style={styles.voucherContent}>
            <Text style={[styles.voucherTitle, { color: themeColors.text }]}>
              Special Offers
            </Text>
            <Text
              style={[
                styles.voucherSubtitle,
                { color: themeColors.textSecondary },
              ]}
            >
              Check out available vouchers
            </Text>
          </View>
          <Ionicons name="ticket-outline" size={24} color={Colors.sky} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vouchersGrid}
        >
          {STATIC_VOUCHERS.map((voucher) => (
            <View
              key={voucher.id}
              style={[
                styles.voucherCard,
                { backgroundColor: isDarkMode ? "#0f172a" : "#f9fafb" },
              ]}
            >
              <View style={styles.voucherCardLeft}>
                <View style={styles.discountBox}>
                  <Text style={styles.discountText}>{voucher.discount}</Text>
                  <Text style={styles.discountLabel}>OFF</Text>
                </View>
              </View>

              <View style={styles.voucherCardDivider} />

              <View style={styles.voucherCardRight}>
                <Text
                  style={[styles.voucherCardDesc, { color: themeColors.text }]}
                  numberOfLines={1}
                >
                  {voucher.description}
                </Text>
                <Text
                  style={[
                    styles.voucherCardCode,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  {voucher.code}
                </Text>
                <Text
                  style={[
                    styles.voucherCardMinSpend,
                    { color: themeColors.textSecondary },
                  ]}
                >
                  Min. {voucher.minSpend}
                </Text>
                <Pressable
                  style={[
                    styles.copyButton,
                    {
                      backgroundColor:
                        copiedCode === voucher.code ? "#dcfce7" : "#e0f2fe",
                    },
                  ]}
                  onPress={() => handleCopyCode(voucher.code)}
                >
                  <Ionicons
                    name={copiedCode === voucher.code ? "checkmark" : "copy"}
                    size={14}
                    color={copiedCode === voucher.code ? "#16a34a" : Colors.sky}
                  />
                  <Text
                    style={[
                      styles.copyButtonText,
                      {
                        color:
                          copiedCode === voucher.code ? "#16a34a" : Colors.sky,
                      },
                    ]}
                  >
                    {copiedCode === voucher.code ? "Copied" : "Copy"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {featuredProducts.length > 0 && (
        <View
          style={[
            styles.featuredSection,
            {
              backgroundColor: isDarkMode ? "#1e293b" : Colors.white,
              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
              marginBottom: 8,
            },
          ]}
        >
          <View
            style={[
              styles.featuredHeaderRow,
              { borderBottomColor: isDarkMode ? "#334155" : "#eef2f7" },
            ]}
          >
            <View>
              <Text style={[styles.featuredTitle, { color: themeColors.text }]}>
                Featured Products
              </Text>
            </View>
            <TouchableOpacity onPress={onSeeMore}>
              <Text style={[styles.seeMoreText, { color: Colors.sky }]}>
                See More
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredGrid}
          >
            {featuredProducts.map((item) => renderFeaturedItem(item))}
          </ScrollView>
        </View>
      )}

      {/* Banner Carousel Section */}
      <View style={[styles.bannerContainer, { marginBottom: 8 }]}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleBannerScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContent}
        >
          {BANNER_IMAGES.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.bannerImage}
              contentFit="cover"
              transition={200}
            />
          ))}
        </ScrollView>
        <View style={styles.carouselIndicators}>
          {BANNER_IMAGES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    currentBannerIndex === index ? Colors.sky : "#cbd5e1",
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Best Products Section */}
      {bestSellerProducts.length > 0 && (
        <View
          style={[
            styles.bestProductsSection,
            {
              backgroundColor: isDarkMode ? "#1e293b" : Colors.white,
              borderColor: isDarkMode ? "#334155" : "#e2e8f0",
              marginBottom: 8,
            },
          ]}
        >
          <View
            style={[
              styles.bestProductsHeader,
              { borderBottomColor: isDarkMode ? "#334155" : "#eef2f7" },
            ]}
          >
            <Text
              style={[styles.bestProductsTitle, { color: themeColors.text }]}
            >
              Best Products
            </Text>
            <TouchableOpacity onPress={onSeeMore}>
              <Text style={[styles.seeMoreText, { color: Colors.sky }]}>
                See More
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bestProductsGrid}
          >
            {bestSellerProducts.map((item) => renderFeaturedItem(item))}
          </ScrollView>
        </View>
      )}

    </View>
  )
}
