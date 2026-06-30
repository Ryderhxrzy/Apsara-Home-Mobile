// @ts-nocheck
import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageSourcePropType,
  Animated,
} from "react-native"
import { Image } from "expo-image"
import Ionicons from "../ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../../constants/colors"
import type { ProductCard } from "../../services/productService"
import { userBehaviorService } from "../../services/userBehaviorService"
import axios from "axios"
import { API_CONFIG } from "../../config/api"
import Toast from "react-native-toast-message"

interface ItemCardProps {
  product: ProductCard
  onPress?: (product: ProductCard) => void
  token?: string | null
  isWishlisted?: boolean
  wishlistId?: number
  onWishlistToggle?: (productId: number, isWishlisted: boolean) => void
  isDarkMode?: boolean
  /** Image height; defaults to 200 (grid). Rails pass a smaller value to keep
   *  the horizontal card compact. */
  imageHeight?: number
  /** Reserve fixed space for the name (2 lines) + badges (2 rows) so prices line
   *  up across cards. Used by the horizontal home rails; the grid stays organic. */
  uniformHeight?: boolean
}

const BADGE_CONFIG = [
  {
    key: "musthave",
    label: "Must Have",
    bg: ["#f97316", "#ea580c"] as const,
    icon: "heart" as const,
  },
  {
    key: "bestseller",
    label: "Bestseller",
    bg: ["#d4a017", "#b8860b"] as const,
    icon: "flame" as const,
  },
  {
    key: "salespromo",
    label: "On Sale",
    bg: [Colors.forest, "#1e4236"] as const,
    icon: "flash" as const,
  },
] as const

const getValidImageUrl = (
  imageUrl: string | undefined
): ImageSourcePropType | null => {
  if (!imageUrl || imageUrl.trim() === "") {
    return null
  }

  // Ensure the URL is absolute
  let url = imageUrl.trim()
  if (!url.startsWith("http") && !url.startsWith("file://")) {
    // Try to make it absolute if it's relative
    if (!url.startsWith("/")) {
      url = "/" + url
    }
    url = "https://backend.afhome.ph/api" + url
  }

  return { uri: url }
}

function ItemCard({
  product,
  onPress,
  token,
  isWishlisted = false,
  wishlistId,
  onWishlistToggle,
  onAddToCart,
  onHideItem,
  onReportItem,
  isDarkMode = false,
  imageHeight = 200,
  uniformHeight = false,
}: ItemCardProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const menuScaleAnim = useState(() => new Animated.Value(0))[0]
  const lastClickTimeRef = useRef(0)
  // Synchronous in-flight guard — state updates are async, so rapid taps would
  // slip past an `isTogglingWishlist` state check and fire duplicate requests.
  const togglingRef = useRef(false)

  // Sync incoming isWishlisted prop, but only if user didn't just click (avoid override)
  useEffect(() => {
    const now = Date.now()
    if (now - lastClickTimeRef.current > 100) {
      setWishlisted(isWishlisted)
    }
  }, [isWishlisted])

  // FlashList/FlatList recycle ItemCard instances. Without resetting, a card
  // that errored on a previous product would keep showing the placeholder logo
  // after it's reused for a different product. Reset whenever the image changes.
  useEffect(() => {
    setImageError(false)
  }, [product.image])

  useEffect(() => {
    if (showMenu) {
      Animated.spring(menuScaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 100,
        useNativeDriver: true,
      }).start()
    } else {
      Animated.timing(menuScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start()
    }
  }, [showMenu, menuScaleAnim])

  const colors = {
    bg: isDarkMode ? "#1e293b" : "#f8f9fa",
    border: isDarkMode ? "#334155" : "#e5e7eb",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    imageBg: isDarkMode ? "#0f172a" : "#f1f5f9",
  }

  // Memoize price calculations
  const priceData = useMemo(() => {
    const displayPrice = product.memberPrice || product.originalPrice
    const hasDiscount = displayPrice < product.originalPrice
    const discountPct = hasDiscount
      ? Math.round(
          (((product.originalPrice || 0) - displayPrice) /
            (product.originalPrice || 0)) *
            100
        )
      : 0
    return { displayPrice, hasDiscount, discountPct }
  }, [product.memberPrice, product.originalPrice])

  const { displayPrice, hasDiscount, discountPct } = priceData

  // Memoize badge filtering
  const activeBadges = useMemo(
    () => BADGE_CONFIG.filter((b) => product.badges[b.key]),
    [product.badges]
  )

  const handleWishlistToggle = useCallback(async () => {
    if (!token || togglingRef.current || isTogglingWishlist) {
      if (!token) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Please log in to add items to wishlist",
        })
      }
      return
    }

    // Block re-entry synchronously (before any await/re-render).
    togglingRef.current = true

    const previousWishlistState = wishlisted
    const newWishlistedState = !wishlisted

    // Optimistic update - update immediately before anything else
    lastClickTimeRef.current = Date.now()
    setWishlisted(newWishlistedState)
    setIsTogglingWishlist(true)

    // Call callback after state update
    onWishlistToggle?.(product.id, newWishlistedState, product)

    // API call happens in background without blocking UI
    try {
      if (previousWishlistState) {
        await axios.delete(`${API_CONFIG.BASE_URL}/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await axios.post(
          `${API_CONFIG.BASE_URL}/wishlist`,
          { product_id: product.id },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      // Track wishlist behavior
      const behaviorType = newWishlistedState
        ? "wishlist_add"
        : "wishlist_remove"
      console.log("📊 Tracking behavior:", {
        behaviorType,
        productId: product.id,
        categoryId: product.categoryId,
        brandId: product.brandId,
      })
      userBehaviorService
        .trackBehavior(
          token,
          behaviorType,
          product.id,
          product.categoryId,
          product.brandId
        )
        .catch((err) => {
          console.error("❌ Behavior tracking failed:", err)
        })
    } catch (error: any) {
      console.error("Error toggling wishlist:", error)
      // Revert optimistic update on error
      setWishlisted(previousWishlistState)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: previousWishlistState
          ? "Failed to remove from wishlist"
          : "Failed to add to wishlist",
      })
    } finally {
      togglingRef.current = false
      setIsTogglingWishlist(false)
    }
  }, [token, product, wishlisted, onWishlistToggle, isTogglingWishlist])

  const handlePress = () => {
    console.log(`👆 ItemCard pressed: ${product.name} (ID: ${product.id})`)
    onPress?.(product)
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
      onPress={handlePress}
      onLongPress={() => setShowMenu(true)}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {imageError || !product.image ? (
          <Image
            source={{
              uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png",
            }}
            style={[
              styles.productImage,
              styles.imagePlaceholder,
              { tintColor: isDarkMode ? "#cbd5e1" : "#4b5563" },
            ]}
            contentFit="contain"
            transition={200}
          />
        ) : (
          <Image
            source={
              getValidImageUrl(product.image) || {
                uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969765/af_home_logo_hh2qjv.png",
              }
            }
            style={styles.productImage}
            contentFit="cover"
            transition={200}
            recyclingKey={String(product.id)}
            onError={() => {
              setImageError(true)
              console.warn(
                `Failed to load image for product ${product.id}: ${product.image}`
              )
            }}
          />
        )}

        {/* Top-left: Enjoy X% ribbon */}
        {hasDiscount && (
          <View style={styles.enjoyBadge}>
            <Ionicons name="pricetag" size={10} color={Colors.white} />
            <Text style={styles.enjoyBadgeText}>Enjoy {discountPct}% OFF</Text>
          </View>
        )}

        {/* Top-right: Heart icon for wishlist */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlistToggle}
          disabled={isTogglingWishlist}
          activeOpacity={0.7}
        >
          <Ionicons
            name={wishlisted ? "heart" : "heart-outline"}
            size={18}
            color={wishlisted ? "#ef4444" : Colors.white}
          />
        </TouchableOpacity>

        {/* Bottom-left: Product badges (Must Have, Bestseller, On Sale) +
            the Save amount badge, grouped together. */}
        {(activeBadges.length > 0 || hasDiscount) && (
          <View style={styles.imageBottomBadges}>
            {activeBadges.map((b) => (
              <LinearGradient
                key={b.key}
                colors={b.bg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageBadge}
              >
                <Ionicons name={b.icon} size={9} color={Colors.white} />
                <Text style={styles.imageBadgeLabel}>{b.label}</Text>
              </LinearGradient>
            ))}
            {hasDiscount && (
              <LinearGradient
                colors={["#ef4444", "#dc2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageBadge}
              >
                <Ionicons name="pricetag" size={9} color={Colors.white} />
                <Text style={styles.imageBadgeLabel}>
                  Save ₱
                  {(
                    (product.originalPrice || 0) - displayPrice
                  ).toLocaleString()}
                </Text>
              </LinearGradient>
            )}
          </View>
        )}
      </View>

      {/* Border Below Image */}
      <View style={[styles.imageBorder, { backgroundColor: colors.border }]} />

      {/* Info */}
      <View style={styles.infoContainer}>
        {hasDiscount && (
          <LinearGradient
            colors={["transparent", Colors.sky + "20"]}
            style={styles.detailsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}

        {/* Brand + Sold Count */}
        <View style={styles.brandRow}>
          <Text
            style={[styles.brandText, { color: colors.textSec }]}
            numberOfLines={1}
          >
            {product.brandName}
          </Text>
          {product.soldCount > 0 && (
            <View style={styles.soldRow}>
              <Ionicons
                name="bag-check-outline"
                size={10}
                color={colors.textSec}
              />
              <Text style={[styles.soldCountText, { color: colors.textSec }]}>
                {product.soldCount} sold
              </Text>
            </View>
          )}
        </View>

        {/* Product Name */}
        <Text
          style={[
            styles.productName,
            { color: colors.text },
            uniformHeight && styles.productNameUniform,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {product.name}
        </Text>

        {/* Badges Row */}
        <View
          style={[styles.badgesRow, uniformHeight && styles.badgesRowUniform]}
        >
          {/* PV badge — only when the product carries PV (recommendation feeds
              may omit it; "PV 0" would be misleading) */}
          {Number(product.pv) > 0 && (
            <LinearGradient
              colors={[Colors.sky, Colors.skyDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="trending-up" size={9} color={Colors.white} />
              <Text style={styles.badgeLabel}>PV {product.pv}</Text>
            </LinearGradient>
          )}

          {/* Variants badge */}
          {product.variantCount > 0 && (
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="layers" size={9} color={Colors.white} />
              <Text style={styles.badgeLabel}>
                {product.variantCount} variants
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.currentPrice, { color: Colors.sky }]}>
            ₱{displayPrice.toLocaleString()}
          </Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textSec }]}>
              ₱{(product.originalPrice || 0).toLocaleString()}
            </Text>
          )}
        </View>
      </View>

      {/* Options Menu Overlay - On Image Section */}
      {showMenu && (
        <TouchableOpacity
          style={[styles.imageMenuOverlay, { height: imageHeight }]}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              {
                backgroundColor: isDarkMode ? "#1e293b" : Colors.white,
                transform: [
                  {
                    scale: menuScaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: menuScaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          >
            {/* Add to Wishlist */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false)
                handleWishlistToggle()
              }}
            >
              <Ionicons
                name={wishlisted ? "heart" : "heart-outline"}
                size={18}
                color={
                  wishlisted ? "#ef4444" : isDarkMode ? "#0ea5e9" : Colors.sky
                }
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              </Text>
            </TouchableOpacity>

            {/* Add to Cart */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false)
                onAddToCart?.(product.id)
              }}
            >
              <Ionicons
                name="cart-outline"
                size={18}
                color={isDarkMode ? "#0ea5e9" : Colors.sky}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Add to Cart
              </Text>
            </TouchableOpacity>

            {/* Hide Item */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowMenu(false)
                onHideItem?.(product.id)
              }}
            >
              <Ionicons
                name="eye-off-outline"
                size={18}
                color={isDarkMode ? "#0ea5e9" : Colors.sky}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Hide Item
              </Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.menuItem,
                styles.closeMenuItem,
                { borderTopColor: isDarkMode ? "#334155" : "#e5e7eb" },
              ]}
              onPress={() => setShowMenu(false)}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDarkMode ? "#94a3b8" : "#6b7280"}
              />
              <Text
                style={[
                  styles.menuItemText,
                  { color: isDarkMode ? "#94a3b8" : "#6b7280" },
                ]}
              >
                Close
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

export default React.memo(ItemCard)

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    width: "100%",
    alignSelf: "flex-start",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  enjoyBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.9,
  },
  enjoyBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  imageSaveBadge: {
    position: "absolute",
    top: 30,
    left: 8,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  imageSaveBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 16,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBottomBadges: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    maxWidth: "80%",
  },
  imageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageBadgeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.2,
  },
  imageBorder: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  infoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 6,
  },
  detailsGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  soldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  soldCountText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
    flexShrink: 1,
  },
  // Reserve two lines so single-line names don't shift the rows below them up.
  productNameUniform: {
    minHeight: 36,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  // Reserve two badge rows so cards with/without a variants badge stay aligned.
  badgesRowUniform: {
    minHeight: 48,
    alignItems: "flex-start",
    alignContent: "flex-start",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.sky,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  saveBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  saveBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
  imageMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: "hidden",
    minWidth: 200,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  closeMenuItem: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 4,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
})
