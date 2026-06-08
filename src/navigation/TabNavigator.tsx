// @ts-nocheck
import React, { useMemo, useCallback } from "react"
import {
  createBottomTabNavigator,
  useBottomTabBarHeight,
} from "@react-navigation/bottom-tabs"
import { useNavigation } from "@react-navigation/native"
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Pressable,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import { useAppContext } from "../context/AppContext"

import AppHeader from "../components/AppHeader/AppHeader"
import HomeScreen from "../screen/HomeScreen"
import WishlistScreen from "../screen/WishlistScreen"
import ShopScreen from "../screen/ShopScreen"
import ShopByBrandScreen from "../screen/ShopByBrandScreen"
import NotificationsScreen from "../screen/NotificationsScreen"
import ProfileScreen from "../screen/ProfileScreen"
import LoadingScreen from "../screen/LoadingScreen"

const Tab = createBottomTabNavigator()

// Home Tab Screen Wrapper
function HomeTabScreen() {
  const navigation = useNavigation()
  const {
    token,
    enrichedUser,
    isDarkMode,
    homeCategories,
    setHomeCategories,
    homeBrands,
    setHomeBrands,
    homeRoomTypes,
    setHomeRoomTypes,
    homeFeaturedProducts,
    setHomeFeaturedProducts,
    homeLoadingFeatured,
    setHomeLoadingFeatured,
    isInitialHomeDataReady,
    homeInitialFetchRef,
    wishlistItems,
    onWishlistChange,
    onProductPress,
    cartCount,
    onCartPress,
    onShopByRoomPress,
    onShopByCategoryPress,
    onShopByBrandPress,
    refreshHomeData,
    onLogout,
    onSearchPress,
    handleOpenAffiliateReferralModal,
    setSelectedRoomId,
    setSelectedCategoryId,
    setSelectedBrandId,
    setSelectedBrand,
    setPreviousTab,
    activeTab,
  } = useAppContext()

  const handleShopByRoom = useCallback(
    (roomId: number) => {
      setPreviousTab(activeTab)
      setSelectedRoomId(roomId)
      setSelectedCategoryId(null as any)
      navigation.navigate("shop" as any)
    },
    [
      navigation,
      activeTab,
      setPreviousTab,
      setSelectedRoomId,
      setSelectedCategoryId,
    ]
  )

  const handleShopByCategory = useCallback(
    (categoryId: number) => {
      setPreviousTab(activeTab)
      setSelectedCategoryId(categoryId)
      setSelectedRoomId(null as any)
      navigation.navigate("shop" as any)
    },
    [
      navigation,
      activeTab,
      setPreviousTab,
      setSelectedCategoryId,
      setSelectedRoomId,
    ]
  )

  const handleShopByBrand = useCallback(
    (brandId: number) => {
      const brand = homeBrands.find((b) => b.id === brandId)
      setPreviousTab(activeTab)
      setSelectedBrandId(brandId)
      setSelectedBrand(brand || null)
      setSelectedRoomId(null as any)
      setSelectedCategoryId(null as any)
      navigation.navigate("shop" as any)
    },
    [
      navigation,
      activeTab,
      homeBrands,
      setPreviousTab,
      setSelectedBrandId,
      setSelectedBrand,
      setSelectedRoomId,
      setSelectedCategoryId,
    ]
  )

  if (!isInitialHomeDataReady) return <LoadingScreen />

  return (
    <>
      <AppHeader
        user={enrichedUser}
        cartCount={cartCount}
        isDarkMode={isDarkMode}
        onCartPress={onCartPress}
        onCameraPress={() => {
          console.log("Camera pressed")
        }}
        onSearchPress={onSearchPress}
        onProfilePress={() => {
          // handled via context
        }}
        onLogout={onLogout}
      />
      <HomeScreen
        token={token}
        user={enrichedUser}
        isDarkMode={isDarkMode}
        onProductPress={onProductPress}
        categories={homeCategories}
        setCategories={setHomeCategories}
        brands={homeBrands}
        setBrands={setHomeBrands}
        featuredProducts={homeFeaturedProducts}
        setFeaturedProducts={setHomeFeaturedProducts}
        roomTypes={homeRoomTypes}
        setRoomTypes={setHomeRoomTypes}
        loadingFeatured={homeLoadingFeatured}
        setLoadingFeatured={setHomeLoadingFeatured}
        dataFetchedRef={homeInitialFetchRef}
        wishlistItems={wishlistItems}
        onWishlistChange={onWishlistChange}
        onShopByRoomPress={handleShopByRoom}
        onShopByCategoryPress={handleShopByCategory}
        onShopByBrandPress={handleShopByBrand}
        onCartPress={onCartPress}
        onReferralPress={handleOpenAffiliateReferralModal}
        onRefresh={refreshHomeData}
      />
    </>
  )
}

// Wishlist Tab Screen Wrapper
function WishlistTabScreen() {
  const {
    token,
    enrichedUser,
    isDarkMode,
    cartCount,
    wishlistItems,
    wishlistLoading,
    wishlistRefreshing,
    invalidateWishlist,
    onProductPress,
    onCartPress,
    onLogout,
    onSearchPress,
    onWishlistChange,
  } = useAppContext()

  return (
    <>
      <AppHeader
        user={enrichedUser}
        cartCount={cartCount}
        isDarkMode={isDarkMode}
        onCartPress={onCartPress}
        onCameraPress={() => {
          console.log("Camera pressed")
        }}
        onSearchPress={onSearchPress}
        onProfilePress={() => {}}
        onLogout={onLogout}
      />
      <WishlistScreen
        token={token}
        wishlistItems={wishlistItems}
        loading={wishlistLoading}
        refreshing={wishlistRefreshing}
        isDarkMode={isDarkMode}
        onRefresh={invalidateWishlist}
        onProductPress={onProductPress}
        onCartUpdate={async () => {
          // cart update is handled by the cart service internally
        }}
        onNavigateToCart={onCartPress}
      />
    </>
  )
}

// Shop Tab Screen Wrapper
function ShopTabScreen() {
  const navigation = useNavigation()
  const {
    token,
    enrichedUser,
    isDarkMode,
    cartCount,
    homeCategories,
    homeBrands,
    wishlistItems,
    onWishlistChange,
    handleOptimisticWishlistToggle,
    selectedBrandId,
    selectedBrand,
    setSelectedBrandId,
    setSelectedBrand,
    selectedRoomId,
    selectedCategoryId,
    setSelectedRoomId,
    setSelectedCategoryId,
    shopSourceIsCart,
    setShopSourceIsCart,
    shopSourceIsCheckout,
    setShopSourceIsCheckout,
    shopSourceProductId,
    setShopSourceProductId,
    setShowShopProductDetail,
    setShopSelectedProductId,
    onCartPress,
    onSearchPress,
    previousTab,
    setActiveTab,
  } = useAppContext()

  const handleShopProductPress = useCallback(
    (id: number) => {
      setShopSelectedProductId(id)
      setShowShopProductDetail(true)
    },
    [setShopSelectedProductId, setShowShopProductDetail]
  )

  return (
    <View style={{ flex: 1 }}>
      {selectedBrandId != null && selectedBrand ? (
        <ShopByBrandScreen
          key={selectedBrandId}
          token={token}
          user={enrichedUser}
          cartCount={cartCount}
          brandId={selectedBrandId}
          brand={selectedBrand as any}
          isZqBrand={(selectedBrand as any)?.isZqBrand === true}
          categories={homeCategories}
          onBack={() => {
            setSelectedBrandId(null)
            setSelectedBrand(null)
            setActiveTab(previousTab)
            if (shopSourceIsCheckout) {
              setShopSourceIsCheckout(false)
            } else if (shopSourceIsCart) {
              setShopSourceIsCart(false)
            } else if (shopSourceProductId !== null) {
              setShopSourceProductId(null)
            }
          }}
          onProductPress={handleShopProductPress}
          onCartPress={onCartPress}
          wishlistItems={wishlistItems}
          isDarkMode={isDarkMode}
          onWishlistChange={onWishlistChange}
        />
      ) : (
        <ShopScreen
          token={token}
          user={enrichedUser}
          cartCount={cartCount}
          roomId={selectedRoomId}
          categoryId={selectedCategoryId}
          brandId={selectedBrandId}
          categories={homeCategories}
          brands={homeBrands}
          onBack={() => {
            setSelectedRoomId(null)
            setSelectedCategoryId(null)
            setSelectedBrandId(null)
          }}
          onProductPress={handleShopProductPress}
          onCartPress={onCartPress}
          onOpenSearch={onSearchPress}
          wishlistItems={wishlistItems}
          isDarkMode={isDarkMode}
          onWishlistChange={onWishlistChange}
          onWishlistToggle={handleOptimisticWishlistToggle}
        />
      )}
    </View>
  )
}

// Notification Tab Screen Wrapper
function NotificationTabScreen() {
  const {
    token,
    enrichedUser,
    isDarkMode,
    cartCount,
    onCartPress,
    onLogout,
    onSearchPress,
    purchasesStatus,
    setPurchasesStatus,
    setPurchasesInitialOrderId,
  } = useAppContext()

  return (
    <>
      <AppHeader
        user={enrichedUser}
        cartCount={cartCount}
        isDarkMode={isDarkMode}
        onCartPress={onCartPress}
        onCameraPress={() => {}}
        onSearchPress={onSearchPress}
        onProfilePress={() => {}}
        onLogout={onLogout}
      />
      <NotificationsScreen
        token={token}
        isDarkMode={isDarkMode}
        onNavigateToPurchases={(status, orderId) => {
          // Normalize purchase status
          const s = String(status || "")
            .trim()
            .toLowerCase()
            .replace(/-/g, "_")
            .replace(/\s+/g, "_")
          let normalized: any = "pending"
          if (s === "to_ship") normalized = "shipped"
          else if (s === "out_for_delivery") normalized = "to_receive"
          else if (
            [
              "pending",
              "paid",
              "processing",
              "shipped",
              "to_receive",
              "delivered",
              "cancelled",
              "return",
            ].includes(s)
          )
            normalized = s
          setPurchasesStatus(normalized)
          setPurchasesInitialOrderId(orderId)
        }}
      />
    </>
  )
}

// Profile Tab Screen Wrapper
function ProfileTabScreen() {
  const ctx = useAppContext()

  return (
    <ProfileScreen
      user={ctx.enrichedUser}
      token={ctx.token}
      onLogout={ctx.onLogout}
      onNavigateSettings={() => {
        ctx.setShowSettings(true)
      }}
      onCartPress={ctx.onCartPress}
      cartCount={ctx.cartCount}
      isDarkMode={ctx.isDarkMode}
      onShowProfileDetails={ctx.onShowProfileDetails}
      onShowReferralNetwork={ctx.onShowReferralNetwork}
      closeReferralNetwork={ctx.closeReferralNetwork}
      onPurchaseItemClick={ctx.onPurchaseItemClick}
      linkedAccountsRefreshTrigger={ctx.linkedAccountsRefreshTrigger}
      onSecuritySettingsPress={ctx.onSecuritySettingsPress}
      setShowLeaderboard={ctx.setShowLeaderboard}
      showLeaderboard={ctx.showLeaderboard}
      onShowAFWalletOverview={ctx.onShowAFWalletOverview}
      onShowAFWalletVoucher={ctx.onShowAFWalletVoucher}
      onShowAFWalletRewards={ctx.onShowAFWalletRewards}
      onShowAFWalletNetwork={ctx.onShowAFWalletNetwork}
      onShowPVEarner={ctx.setShowPVEarnerFromTab}
      showPVEarnerFromTab={ctx.showPVEarnerFromTab}
      wishlistItems={ctx.wishlistItems}
      onWishlistChange={ctx.onWishlistChange}
      onProductPress={ctx.onProductPress}
      onShopNavigate={ctx.onShopNavigate}
    />
  )
}

// Custom Tab Bar - Matches original design exactly
function CustomTabBar({
  state,
  descriptors,
  navigation,
  insets,
  hideTabBar,
}: any) {
  const { isDarkMode, wishlistItems, unreadCount, enrichedUser } =
    useAppContext() as any
  const safeAreaInsets = useSafeAreaInsets()

  if (hideTabBar) {
    return null
  }

  return (
    <View
      style={[styles.navBarContainer, isDarkMode && styles.navBarContainerDark]}
    >
      <View
        style={[
          styles.navBar,
          isDarkMode && styles.navBarDark,
          { paddingBottom: Math.max(8, safeAreaInsets.bottom) },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key]
          const isFocused = state.index === index

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            })

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          // Get badge count
          const badgeCount =
            route.name === "wishlist"
              ? wishlistItems?.length || 0
              : route.name === "notification"
                ? unreadCount || 0
                : 0

          // Render shop tab differently (diamond logo in center)
          if (route.name === "shop") {
            return (
              <Pressable key={index} onPress={onPress} style={styles.shopItem}>
                <View style={styles.indicator}>
                  {isFocused && <View style={styles.indicatorLine} />}
                </View>
                <View style={[styles.shopSlot]}>
                  <View
                    style={[
                      styles.shopDiamond,
                      isFocused && styles.shopDiamondActive,
                    ]}
                  >
                    <View style={styles.shopDiamondInner}>
                      <Image
                        source={require("../../assets/home_logo.png")}
                        style={styles.homeLogoImage}
                        resizeMode="contain"
                        tintColor={Colors.white}
                      />
                    </View>
                  </View>
                </View>
              </Pressable>
            )
          }

          // Render other tabs (home, wishlist, notification, profile)
          return (
            <Pressable key={index} onPress={onPress} style={styles.navItem}>
              <View style={styles.indicator}>
                {isFocused && <View style={styles.indicatorLine} />}
              </View>
              <View style={styles.iconWrap}>
                {route.name === "home" && (
                  <Ionicons
                    name={isFocused ? "home" : "home-outline"}
                    size={26}
                    color={isFocused ? Colors.sky : Colors.textSecondary}
                  />
                )}
                {route.name === "wishlist" && (
                  <Ionicons
                    name={isFocused ? "heart" : "heart-outline"}
                    size={24}
                    color={isFocused ? Colors.sky : Colors.textSecondary}
                  />
                )}
                {route.name === "notification" && (
                  <Ionicons
                    name={isFocused ? "notifications" : "notifications-outline"}
                    size={24}
                    color={isFocused ? Colors.sky : Colors.textSecondary}
                  />
                )}
                {route.name === "profile" && (
                  <View
                    style={[styles.avatar, isFocused && styles.avatarActive]}
                  >
                    {enrichedUser?.avatar_url ? (
                      <Image
                        source={{ uri: enrichedUser.avatar_url }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.avatarInitial,
                          isFocused && styles.avatarInitialActive,
                        ]}
                      >
                        {enrichedUser?.name?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    )}
                  </View>
                )}
                {badgeCount > 0 && (
                  <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.navLabel,
                  isFocused && styles.navLabelActive,
                  isDarkMode && styles.navLabelDark,
                  isDarkMode && isFocused && styles.navLabelActiveDark,
                ]}
              >
                {route.name === "home"
                  ? "Home"
                  : route.name === "wishlist"
                    ? "Wishlist"
                    : route.name === "notification"
                      ? "Notify"
                      : "Profile"}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

// Main TabNavigator Component
export default function TabNavigator({
  hideTabBar = false,
}: {
  hideTabBar?: boolean
}) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        lazy: false, // Pre-mount all screens immediately = instant switching
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <CustomTabBar {...props} hideTabBar={hideTabBar} />}
    >
      <Tab.Screen name="home" component={HomeTabScreen} />
      <Tab.Screen name="wishlist" component={WishlistTabScreen} />
      <Tab.Screen name="shop" component={ShopTabScreen} />
      <Tab.Screen name="notification" component={NotificationTabScreen} />
      <Tab.Screen name="profile" component={ProfileTabScreen} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  navBarContainer: {
    backgroundColor: Colors.white,
  },
  navBarContainerDark: {
    backgroundColor: "#1f2937",
  },
  navBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    overflow: "visible",
    paddingBottom: 8,
  },
  navBarDark: {
    backgroundColor: "#1f2937",
    borderTopColor: "#374151",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 2,
    paddingVertical: 6,
  },
  indicator: {
    height: 3,
    width: "100%",
    alignItems: "center",
    marginBottom: 2,
  },
  indicatorLine: {
    width: 18,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sky,
    marginTop: -1,
  },
  iconWrap: {
    position: "relative",
  },
  homeLogoImage: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeDark: {
    borderColor: "#111827",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 11,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
    lineHeight: 12,
  },
  navLabelActive: {
    color: Colors.sky,
    fontWeight: "700",
  },
  navLabelDark: {
    color: "#d1d5db",
  },
  navLabelActiveDark: {
    color: "#38bdf8",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarActive: {
    borderColor: Colors.sky,
    backgroundColor: "#e0f2fe",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  avatarInitialActive: {
    color: Colors.sky,
  },
  shopItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 0,
    paddingBottom: 0,
    paddingTop: -8,
  },
  shopSlot: {
    height: 37,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "visible",
  },
  shopDiamond: {
    width: 48,
    height: 48,
    backgroundColor: Colors.sky,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    shadowColor: Colors.sky,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  shopDiamondActive: {
    backgroundColor: Colors.skyDark,
  },
  shopDiamondInner: {
    transform: [{ rotate: "-45deg" }],
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    width: "100%",
    height: "100%",
  },
})
