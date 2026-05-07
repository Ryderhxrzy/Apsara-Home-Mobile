import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, Pressable,
  StyleSheet, Modal, PanResponder, Animated, BackHandler, Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { Colors } from '../constants/colors';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import type { ProductCard } from '../services/productService';
import AppHeader from '../components/AppHeader/AppHeader';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import SearchScreen from '../screen/SearchScreen';
import ProductsScreen from '../screen/ProductsScreen';
import SearchResultScreen from '../screen/SearchResultScreen';
import SettingsScreen from '../screen/SettingsScreen';
import ProductDetailScreen from '../screen/ProductDetailScreen';
import WishlistScreen from '../screen/WishlistScreen';
import CartScreen from '../screen/CartScreen';
import ProfileDetailsScreen from '../screen/ProfileDetailsScreen';
import ShopScreen from '../screen/ShopScreen';
import ShopByBrandScreen from '../screen/ShopByBrandScreen';
import NotificationsScreen from '../screen/NotificationsScreen';
import LoadingScreen from '../screen/LoadingScreen';
import { orderService } from '../services/orderService';

type TabKey = 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings';

const TABS: TabKey[] = ['home', 'wishlist', 'shop', 'notification', 'profile'];
const SLIDE_DISTANCE = 30;
const OUT_DURATION = 0;
const IN_DURATION = 0;

let screenTapTime = 0;

// Cache utilities using expo-file-system
const CACHE_DIR = FileSystem.cacheDirectory + 'apsara_cache/';
const cacheUtils = {
  async init() {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
      console.log('✅ Cache directory ready:', CACHE_DIR);
    } catch (error) {
      console.log('❌ Cache init error:', error);
    }
  },
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const filePath = CACHE_DIR + key;
      const file = await FileSystem.readAsStringAsync(filePath);
      const parsed = JSON.parse(file);
      console.log(`✅ Cache READ SUCCESS [${key}]:`, parsed);
      return parsed;
    } catch (error) {
      console.log(`⚠️ Cache READ FAILED [${key}]:`, error);
      return null;
    }
  },
  async set(key: string, data: any) {
    try {
      const filePath = CACHE_DIR + key;
      const jsonData = JSON.stringify(data);
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      console.log(`✅ Cache WRITE SUCCESS [${key}]:`, data);
      // Verify the write by reading it back
      const verified = await FileSystem.readAsStringAsync(filePath);
      console.log(`✅ Cache WRITE VERIFIED [${key}]:`, JSON.parse(verified));
    } catch (error) {
      console.log(`❌ Cache WRITE FAILED [${key}]:`, error);
    }
  },
};

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  monthly_activation?: {
    current_month_pv: number;
    threshold_pv: number;
    remaining_pv: number;
  };
}

function extractCount(data: any): number {
  if (typeof data?.total_items === 'number') return data.total_items;
  if (typeof data?.total === 'number') return data.total;
  if (typeof data?.count === 'number') return data.count;
  if (Array.isArray(data?.cart_items)) return data.cart_items.length;
  if (Array.isArray(data?.wishlist_items)) return data.wishlist_items.length;
  if (Array.isArray(data?.data)) return data.data.length;
  if (Array.isArray(data?.items)) return data.items.length;
  if (Array.isArray(data)) return data.length;
  return 0;
}

interface CategoryItem {
  id: number;
  name: string;
  image?: string | null;
}

interface BrandItem {
  id: number;
  name: string;
  image?: string | null;
  brand_image?: string;
  total_products?: number;
}


interface RoomType {
  room_id: number;
  room_name: string;
  images: string[];
  count: number;
}

export default function AppNavigator({ user, token, onLogout }: { user?: User | null; token?: string | null; onLogout?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [profileDetailsFromTab, setProfileDetailsFromTab] = useState(false);
  const [referralNetworkFromTab, setReferralNetworkFromTab] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [previousTab, setPreviousTab] = useState<TabKey>('home');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [previousSearchQuery, setPreviousSearchQuery] = useState<string | null>(null);
  const [searchSourceProductId, setSearchSourceProductId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandItem | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationTotalCount, setNotificationTotalCount] = useState(0);
  // const [deviceToken, setDeviceToken] = useState<string | null>(null);
  // const [showTokenModal, setShowTokenModal] = useState(false);

  // Home screen data - persists across navigation
  const [homeCategories, setHomeCategories] = useState<CategoryItem[]>([]);
  const [homeBrands, setHomeBrands] = useState<BrandItem[]>([]);
  const [homeFeaturedProducts, setHomeFeaturedProducts] = useState<ProductCard[]>([]);
  const [homeRoomTypes, setHomeRoomTypes] = useState<RoomType[]>([]);
  const [homeLoadingFeatured, setHomeLoadingFeatured] = useState(false);
  const [isInitialHomeDataReady, setIsInitialHomeDataReady] = useState(false);
  const homeInitialFetchRef = useRef(false);

  // Wishlist data - persists across navigation
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistRefreshing, setWishlistRefreshing] = useState(false);
  const wishlistInitialFetchRef = useRef(false);

  const { authService } = require('../services/authService');
  const { productService } = require('../services/productService');

  // Initialize cache and preload data on mount
  useEffect(() => {
    const init = async () => {
      console.log('🚀 APP NAVIGATOR MOUNTING - INITIALIZING CACHE...');
      await cacheUtils.init();
      // Preload cached home data and dark mode preference immediately
      try {
        console.log('📂 READING CACHE FILES...');
        const [cachedCats, cachedBrands, cachedRooms, cachedProducts, cachedDarkMode] = await Promise.all([
          cacheUtils.get<CategoryItem[]>('home_categories'),
          cacheUtils.get<BrandItem[]>('home_brands'),
          cacheUtils.get<RoomType[]>('home_rooms'),
          cacheUtils.get<ProductCard[]>('home_featured_products'),
          cacheUtils.get<boolean>('dark_mode_pref'),
        ]);
        console.log('📍 CACHE READ RESULTS:', {
          cachedDarkMode,
          isDarkModeType: typeof cachedDarkMode,
          isNull: cachedDarkMode === null,
          cachedProductsCount: cachedProducts?.length || 0,
        });
        if (cachedCats?.length) setHomeCategories(cachedCats);
        if (cachedBrands?.length) setHomeBrands(cachedBrands);
        if (cachedRooms?.length) setHomeRoomTypes(cachedRooms);
        if (cachedProducts?.length) setHomeFeaturedProducts(cachedProducts);
        if (cachedDarkMode !== null && typeof cachedDarkMode === 'boolean') {
          console.log('✅ LOADING DARK MODE FROM CACHE:', cachedDarkMode);
          setIsDarkMode(cachedDarkMode);
        } else {
          console.log('⚠️ NO VALID CACHED DARK MODE FOUND - USING DEFAULT FALSE');
        }
        console.log('✅ PRELOADED CACHE ON APP START');
      } catch (error) {
        console.log('❌ Preload error:', error);
      }
    };
    init();
  }, []);

  // Setup push notifications
  // useEffect(() => {
  //   const setupNotifications = async () => {
  //     try {
  //       // Request permissions
  //       const { status } = await Notifications.requestPermissionsAsync();
  //       console.log('Notification permission status:', status);

  //       // Get device push token
  //       const pushToken = await Notifications.getExpoPushTokenAsync();
  //       setDeviceToken(pushToken.data);
  //       console.log('📱 DEVICE TOKEN:', pushToken.data);

  //       // Set notification handler
  //       Notifications.setNotificationHandler({
  //         handleNotification: async () => ({
  //           shouldShowAlert: true,
  //           shouldPlaySound: true,
  //           shouldSetBadge: true,
  //         }),
  //       });

  //       // Listen for notifications
  //       const subscription = Notifications.addNotificationResponseListener(({ notification }) => {
  //         console.log('Notification received:', notification);
  //       });

  //       return () => subscription.remove();
  //     } catch (error) {
  //       console.log('Notification setup error:', error);
  //     }
  //   };

  //   setupNotifications();
  // }, []);

  // Save dark mode preference to cache whenever it changes
  useEffect(() => {
    const saveDarkMode = async () => {
      console.log('💾 ATTEMPTING TO SAVE DARK MODE:', isDarkMode);
      try {
        await cacheUtils.init();
        await cacheUtils.set('dark_mode_pref', isDarkMode);
        console.log('✅ DARK MODE SAVED SUCCESSFULLY:', isDarkMode);
      } catch (error) {
        console.log('❌ Error saving dark mode:', error);
      }
    };
    saveDarkMode();
  }, [isDarkMode]);

  // Double-check dark mode from cache periodically (helps with hot reload issues)
  useEffect(() => {
    const checkDarkModeCache = async () => {
      try {
        await cacheUtils.init();
        const cachedDarkMode = await cacheUtils.get<boolean>('dark_mode_pref');
        if (cachedDarkMode !== null && typeof cachedDarkMode === 'boolean' && cachedDarkMode !== isDarkMode) {
          console.log('🔄 SYNCING DARK MODE FROM CACHE (hot reload detected):', cachedDarkMode);
          setIsDarkMode(cachedDarkMode);
        }
      } catch (error) {
        console.log('❌ Error checking dark mode cache:', error);
      }
    };

    // Check on mount and every 2 seconds to catch hot reloads
    checkDarkModeCache();
    const interval = setInterval(checkDarkModeCache, 2000);
    return () => clearInterval(interval);
  }, [isDarkMode]);

  useEffect(() => {
    if (screenTapTime) {
      const elapsed = Date.now() - screenTapTime;
      console.log(`✅ [RENDER] ${labelMap[activeTab]} screen displayed in ${elapsed}ms`);
      screenTapTime = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    if (!token) return;

    // Fetch cart count
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API_CONFIG.BASE_URL}/cart`, { headers })
      .then(cartRes => setCartCount(extractCount(cartRes.data)))
      .catch(() => {});

    // Fetch notifications
    orderService.getNotifications(token)
      .then(data => {
        setNotificationUnreadCount(data.unread_count || 0);
        setNotificationTotalCount(data.items?.length || 0);
      })
      .catch(() => {});

    // Fetch home screen data ONCE when token becomes available
    if (!homeInitialFetchRef.current) {
      homeInitialFetchRef.current = true;
      fetchHomeData();
    }

    // Fetch wishlist data ONCE when token becomes available
    if (!wishlistInitialFetchRef.current) {
      wishlistInitialFetchRef.current = true;
      fetchWishlistData();
    }
  }, [token]);

  const fetchHomeData = async () => {
    if (!token) return;

    try {
      setHomeLoadingFeatured(true);
      const totalStart = performance.now();
      console.log('🔄 FETCHING INITIAL DATA (FAST)...');

      // STEP 1: Fetch only categories first (fast, ~200ms)
      const categoryStart = performance.now();
      const categoryData = await authService.getCategories(token);
      const sortedCategories = categoryData.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      console.log(`⚡ CATEGORIES FETCHED: ${Math.round(performance.now() - categoryStart)}ms`);

      // Update state immediately with categories
      setHomeCategories(sortedCategories);
      await cacheUtils.set('home_categories', sortedCategories);

      // Ready to show home screen with at least categories
      console.log(`✅ HOME READY FOR DISPLAY: ${Math.round(performance.now() - totalStart)}ms`);
      setIsInitialHomeDataReady(true);

      // STEP 2: Lazy load brands, rooms, and featured products in background
      console.log('🔄 LAZY LOADING OTHER DATA...');
      const lazyStart = performance.now();
      const [brandData, roomData, productData] = await Promise.all([
        authService.getBrandsWithProducts(token, 50),
        axios.get(`${API_CONFIG.BASE_URL}/room-types`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.data?.data || []).catch(() => []),
        productService.getProductCards(token).catch(() => []),
      ]);
      console.log(`📡 LAZY LOAD COMPLETE: ${Math.round(performance.now() - lazyStart)}ms`);

      // Filter for affordahome brand products
      const affordahomeProducts = Array.isArray(productData)
        ? productData.filter(p => p.brandName?.toLowerCase() === 'affordahome')
        : [];

      console.log('🏠 AFFORDAHOME PRODUCTS:', affordahomeProducts.length);

      // Update state with lazy-loaded data
      setHomeBrands(brandData || []);
      setHomeRoomTypes(roomData || []);
      setHomeFeaturedProducts(affordahomeProducts.slice(0, 10));

      // Update cache
      await Promise.all([
        cacheUtils.set('home_brands', brandData || []),
        cacheUtils.set('home_rooms', roomData || []),
        cacheUtils.set('home_featured_products', affordahomeProducts.slice(0, 10)),
      ]);

      console.log(`⏱️ ALL DATA READY: ${Math.round(performance.now() - totalStart)}ms`);
    } catch (error: any) {
      console.error('❌ Home data fetch error:', error?.message);
      setIsInitialHomeDataReady(true);
    } finally {
      setHomeLoadingFeatured(false);
    }
  };

  const fetchWishlistData = async (isRefreshing = false) => {
    if (!token) return;

    const setLoading = isRefreshing ? setWishlistRefreshing : setWishlistLoading;

    // Load from cache first if not refreshing
    if (!isRefreshing) {
      try {
        const cachedWishlist = await cacheUtils.get<any[]>('wishlist_items');
        if (cachedWishlist) {
          setWishlistItems(cachedWishlist);
          setWishlistCount(cachedWishlist.length);
          console.log('💾 LOADED CACHED WISHLIST');
        }
      } catch (error) {
        console.log('Wishlist cache load error:', error);
      }
    }

    // Fetch fresh data in background
    try {
      setLoading(true);
      const data = await productService.getWishlist(token);
      setWishlistItems(data);
      setWishlistCount(data.length);

      // Cache the fresh data
      await cacheUtils.set('wishlist_items', data);
    } catch (error: any) {
      console.error('Wishlist fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchVisible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSearchVisible(false);
      // If search was opened from ProductDetailScreen, restore it
      if (searchSourceProductId !== null) {
        setSelectedProductId(searchSourceProductId);
        setSearchSourceProductId(null);
      } else {
        // Otherwise restore the previous tab
        setActiveTab(previousTab);
        activeTabRef.current = previousTab;
      }
      return true;
    });
    return () => sub.remove();
  }, [searchVisible, previousTab, searchSourceProductId]);

  useEffect(() => {
    if (selectedProductId === null) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedProductId(null);
      // If product was opened from search, restore search query
      if (previousSearchQuery) {
        setSearchQuery(previousSearchQuery);
        setPreviousSearchQuery(null);
      } else {
        // Otherwise restore the previous tab
        setActiveTab(previousTab);
        activeTabRef.current = previousTab;
      }
      return true;
    });
    return () => sub.remove();
  }, [selectedProductId, previousTab, previousSearchQuery]);

  // Global back button handler for exit confirmation on main screens
  useEffect(() => {
    if (selectedProductId !== null || searchVisible || searchQuery) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowExitConfirm(true);
      return true;
    });
    return () => sub.remove();
  }, [selectedProductId, searchVisible, searchQuery]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const activeTabRef = useRef<TabKey>('home');

  function navigateTo(key: TabKey) {
    if (key === activeTabRef.current) return;

    screenTapTime = Date.now();
    console.log(`⏱️ [TAP] ${labelMap[key]} screen tapped`);

    setPreviousTab(activeTabRef.current);
    activeTabRef.current = key;
    setActiveTab(key);
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        // Disable swipe navigation on Wishlist screen to allow item swiping
        if (activeTabRef.current === 'wishlist') return false;
        // Disable swipe navigation while Shop By Brand is open
        if (activeTabRef.current === 'shop' && selectedBrandId !== null && selectedBrand !== null) return false;
        return Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 12;
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -50) {
          const i = TABS.indexOf(activeTabRef.current);
          if (i < TABS.length - 1) navigateTo(TABS[i + 1]);
        } else if (g.dx > 50) {
          const i = TABS.indexOf(activeTabRef.current);
          if (i > 0) navigateTo(TABS[i - 1]);
        }
      },
    })
  ).current;

  const labelMap: Record<TabKey, string> = {
    home: 'Home',
    wishlist: 'Wishlist',
    shop: 'Shop',
    notification: 'Notifications',
    profile: 'Me',
    settings: 'Settings',
  };

  const iconActive: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    home: 'home',
    wishlist: 'heart',
    shop: 'storefront',
    notification: 'notifications',
    profile: 'person',
    settings: 'settings',
  };

  const iconInactive: Record<TabKey, keyof typeof Ionicons.glyphMap> = {
    home: 'home-outline',
    wishlist: 'heart-outline',
    shop: 'storefront-outline',
    notification: 'notifications-outline',
    profile: 'person-outline',
    settings: 'settings-outline',
  };

  const badgeCount: Partial<Record<TabKey, number>> = {
    notification: notificationTotalCount,
    wishlist: wishlistCount,
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.body} {...panResponder.panHandlers}>
          {selectedProductId !== null ? (
            <ProductDetailScreen
              productId={selectedProductId}
              token={token}
              user={user}
              cartCount={cartCount}
              wishlistItems={wishlistItems}
              onBack={() => setSelectedProductId(null)}
              onProductPress={(id) => {
                setPreviousSearchQuery(null);
                setSelectedProductId(id);
              }}
              onSearch={() => {
                setSearchSourceProductId(selectedProductId);
                setSelectedProductId(null);
                setPreviousTab(activeTabRef.current);
                setSearchVisible(true);
              }}
              onCartUpdate={async () => {
                const headers = { Authorization: `Bearer ${token}` };
                try {
                  const cartRes = await axios.get(`${API_CONFIG.BASE_URL}/cart`, { headers });
                  setCartCount(extractCount(cartRes.data));
                } catch (error) {
                  console.error('Failed to update cart count:', error);
                }
              }}
              onWishlistToggle={(productId, isWishlisted) => {
                if (isWishlisted) {
                  // Product added to wishlist - add it to the list
                  setWishlistItems(prev => {
                    const exists = prev.some(item => item.product_id === productId);
                    if (exists) return prev;
                    return [...prev, { wishlist_id: Date.now(), product_id: productId, date_added: new Date().toISOString() }];
                  });
                } else {
                  // Product removed from wishlist - remove it from the list
                  setWishlistItems(prev => prev.filter(item => item.product_id !== productId));
                }
              }}
              isDarkMode={isDarkMode}
            />
          ) : searchQuery ? (
            <SearchResultScreen
              token={token}
              query={searchQuery}
              isDarkMode={isDarkMode}
              onBack={() => {
                setSearchQuery(null);
                setSearchVisible(true);
              }}
              onProductPress={(product) => {
                setPreviousSearchQuery(searchQuery);
                setSelectedProductId(product.id);
              }}
            />
          ) : activeTab === 'notification' ? (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                isDarkMode={isDarkMode}
                onCartPress={() => setShowCart(true)}
                onCameraPress={() => {
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
                onProfilePress={() => setShowProfileDetails(true)}
                onLogout={onLogout}
              />
              <NotificationsScreen
                token={token}
                isDarkMode={isDarkMode}
              />
            </>

          ) : activeTab === 'settings' ? (
            <SettingsScreen
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              onBack={() => navigateTo('profile')}
            />
          ) : activeTab === 'wishlist' ? (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                isDarkMode={isDarkMode}
                onCartPress={() => setShowCart(true)}
                onCameraPress={() => {
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
                onProfilePress={() => setShowProfileDetails(true)}
                onLogout={onLogout}
              />
              <WishlistScreen
                token={token}
                wishlistItems={wishlistItems}
                loading={wishlistLoading}
                refreshing={wishlistRefreshing}
                isDarkMode={isDarkMode}
                onRefresh={() => fetchWishlistData(true)}
                onProductPress={(id: number) => {
                  setPreviousSearchQuery(null);
                  setPreviousTab(activeTabRef.current);
                  setSelectedProductId(id);
                }}
                onCartUpdate={async () => {
                  const headers = { Authorization: `Bearer ${token}` };
                  try {
                    const cartRes = await axios.get(`${API_CONFIG.BASE_URL}/cart`, { headers });
                    setCartCount(extractCount(cartRes.data));
                  } catch (error) {
                    console.error('Failed to update cart count:', error);
                  }
                }}
              />
            </>
          ) : activeTab === 'profile' ? (
            <ProfileScreen
              user={user}
              token={token}
              onLogout={onLogout}
              onNavigateSettings={() => navigateTo('settings')}
              onCartPress={() => setShowCart(true)}
              cartCount={cartCount}
              isDarkMode={isDarkMode}
              onShowProfileDetails={(show) => setProfileDetailsFromTab(show)}
              onShowReferralNetwork={(show) => setReferralNetworkFromTab(show)}
            />
          ) : activeTab === 'shop' ? (
            selectedBrandId && selectedBrand ? (
              <ShopByBrandScreen
                token={token}
                user={user}
                cartCount={cartCount}
                brandId={selectedBrandId}
                brand={selectedBrand}
                categories={homeCategories}
                onBack={() => {
                  setSelectedBrandId(null);
                  setSelectedBrand(null);
                  setActiveTab(previousTab);
                  activeTabRef.current = previousTab;
                }}
                onProductPress={(id) => {
                  setPreviousSearchQuery(null);
                  setPreviousTab(activeTabRef.current);
                  setSelectedProductId(id);
                }}
                onCartPress={() => setShowCart(true)}
                wishlistItems={wishlistItems}
                isDarkMode={isDarkMode}
                onWishlistChange={() => fetchWishlistData()}
              />
            ) : (
              <ShopScreen
                token={token}
                user={user}
                cartCount={cartCount}
                roomId={selectedRoomId}
                categoryId={selectedCategoryId}
                brandId={selectedBrandId}
                categories={homeCategories}
                brands={homeBrands}
                onBack={() => {
                  setSelectedRoomId(null);
                  setSelectedCategoryId(null);
                  setSelectedBrandId(null);
                  navigateTo(previousTab);
                }}
                onProductPress={(id) => {
                  setPreviousSearchQuery(null);
                  setSelectedProductId(id);
                }}
                onCartPress={() => setShowCart(true)}
                onOpenSearch={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
                wishlistItems={wishlistItems}
                isDarkMode={isDarkMode}
                onWishlistChange={() => fetchWishlistData()}
              />
            )
          ) : activeTab === 'home' ? (
            !isInitialHomeDataReady ? (
              <LoadingScreen />
            ) : (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                isDarkMode={isDarkMode}
                onCartPress={() => setShowCart(true)}
                onCameraPress={() => {
                  // TODO: Implement camera functionality
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
                onProfilePress={() => setShowProfileDetails(true)}
                onLogout={onLogout}
              />
              <HomeScreen
                token={token}
                user={user}
                isDarkMode={isDarkMode}
                onProductPress={(id: number) => {
                  setPreviousSearchQuery(null);
                  setPreviousTab(activeTabRef.current);
                  setSelectedProductId(id);
                }}
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
                onWishlistChange={() => fetchWishlistData()}
                onShopByRoomPress={(roomId: number) => {
                  setPreviousTab(activeTabRef.current);
                  setSelectedRoomId(roomId);
                  setSelectedCategoryId(null);
                  activeTabRef.current = 'shop';
                  setActiveTab('shop');
                }}
                onShopByCategoryPress={(categoryId: number) => {
                  setPreviousTab(activeTabRef.current);
                  setSelectedCategoryId(categoryId);
                  setSelectedRoomId(null);
                  activeTabRef.current = 'shop';
                  setActiveTab('shop');
                }}
                onShopByBrandPress={(brandId: number) => {
                  const brand = homeBrands.find(b => b.id === brandId);
                  setPreviousTab(activeTabRef.current);
                  setSelectedBrandId(brandId);
                  setSelectedBrand(brand || null);
                  setSelectedRoomId(null);
                  setSelectedCategoryId(null);
                  activeTabRef.current = 'shop';
                  setActiveTab('shop');
                }}
              />
            </>
            )
          ) : (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                isDarkMode={isDarkMode}
                onCartPress={() => setShowCart(true)}
                onCameraPress={() => {
                  // TODO: Implement camera functionality
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
                onProfilePress={() => setShowProfileDetails(true)}
                onLogout={onLogout}
              />
              <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <Text style={styles.h1}>{labelMap[activeTab]}</Text>
                <Text style={styles.bodyText}>This is the {labelMap[activeTab].toLowerCase()} page.</Text>
              </Animated.View>
            </>
          )}
        </View>

        {!searchQuery && activeTab !== 'settings' && selectedProductId === null && !profileDetailsFromTab && !referralNetworkFromTab && !(activeTab === 'shop' && selectedBrandId !== null && selectedBrand !== null) && (activeTab !== 'home' || isInitialHomeDataReady) && (
          <SafeAreaView edges={['bottom']} style={[styles.navBarContainer, isDarkMode && styles.navBarContainerDark]}>
            <View style={[styles.navBar, isDarkMode && styles.navBarDark]}>
              {TABS.map(key => {
              const active = activeTab === key;

            if (key === 'home') {
              return (
                <Pressable key={key} style={styles.navItem} onPress={() => navigateTo(key)}>
                  <View style={styles.indicator}>
                    {active && <View style={styles.indicatorLine} />}
                  </View>
                  <View style={[styles.iconWrap, { alignItems: 'center', justifyContent: 'center' }]}>
                    <Image
                      source={require('../../assets/home_logo.png')}
                      style={[
                        styles.homeLogoImage,
                        {
                          opacity: active ? 1 : 0.6,
                          tintColor: active ? (isDarkMode ? '#38bdf8' : Colors.sky) : (isDarkMode ? '#d1d5db' : Colors.textSecondary),
                        }
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.navLabel,
                    active && styles.navLabelActive,
                    isDarkMode && styles.navLabelDark,
                    isDarkMode && active && styles.navLabelActiveDark,
                  ]}>
                    {labelMap[key]}
                  </Text>
                </Pressable>
              );
            }

            if (key === 'shop') {
              return (
                <Pressable key={key} style={styles.shopItem} onPress={() => {
                  setSelectedRoomId(null);
                  setSelectedCategoryId(null);
                  setSelectedBrandId(null);
                  setSelectedBrand(null);
                  navigateTo(key);
                }}>
                  <View style={styles.shopSlot}>
                    <View style={[styles.shopDiamond, active && styles.shopDiamondActive]}>
                      <View style={styles.shopDiamondInner}>
                        <Ionicons
                          name={active ? iconActive[key] : iconInactive[key]}
                          size={22}
                          color={Colors.white}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            }

            if (key === 'profile') {
              const photoUrl = user?.avatar_url ?? null;
              const initial = user?.name ? user.name.charAt(0).toUpperCase() : null;
              return (
                <Pressable key={key} style={styles.navItem} onPress={() => navigateTo(key)}>
                  <View style={styles.indicator}>
                    {active && <View style={styles.indicatorLine} />}
                  </View>
                  <View style={[styles.avatar, active && styles.avatarActive]}>
                    {photoUrl ? (
                      <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
                    ) : initial ? (
                      <Text style={[styles.avatarInitial, active && styles.avatarInitialActive]}>
                        {initial}
                      </Text>
                    ) : (
                      <Ionicons name="person" size={14} color={active ? Colors.sky : Colors.textSecondary} />
                    )}
                  </View>
                  <Text style={[
                    styles.navLabel,
                    active && styles.navLabelActive,
                    isDarkMode && styles.navLabelDark,
                    isDarkMode && active && styles.navLabelActiveDark,
                  ]}>
                    {labelMap[key]}
                  </Text>
                </Pressable>
              );
            }

            const count = badgeCount[key] ?? 0;
            return (
              <Pressable
                key={key}
                style={styles.navItem}
                onPress={() => navigateTo(key)}
                // onLongPress={() => key === 'notification' && deviceToken && setShowTokenModal(true)}
              >
                <View style={styles.indicator}>
                  {active && <View style={styles.indicatorLine} />}
                </View>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={active ? iconActive[key] : iconInactive[key]}
                    size={24}
                    color={active ? (isDarkMode ? '#38bdf8' : Colors.sky) : (isDarkMode ? '#d1d5db' : Colors.textSecondary)}
                  />
                  {count > 0 && (
                    <View style={[styles.badge, isDarkMode && styles.badgeDark]}>
                      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.navLabel,
                  active && styles.navLabelActive,
                  isDarkMode && styles.navLabelDark,
                  isDarkMode && active && styles.navLabelActiveDark,
                ]}>
                  {labelMap[key]}
                </Text>
              </Pressable>
            );
          })}
            </View>
          </SafeAreaView>
        )}

        <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
            <View style={styles.menuPanel}>
              <Text style={styles.menuTitle}>Menu</Text>
              {TABS.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.menuItem}
                  onPress={() => {
                    navigateTo(item);
                    setMenuVisible(false);
                  }}
                >
                  <Text style={styles.menuText}>{labelMap[item]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* <Modal visible={showTokenModal} transparent animationType="fade" onRequestClose={() => setShowTokenModal(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTokenModal(false)}>
            <View style={styles.tokenModal}>
              <Text style={styles.tokenTitle}>Push Notification Token</Text>
              <Text style={styles.tokenSubtitle}>Long-press notification icon to copy</Text>
              <View style={styles.tokenBox}>
                <Text style={styles.tokenText} selectable>{deviceToken}</Text>
              </View>
              <TouchableOpacity
                style={styles.tokenCopyBtn}
                onPress={() => {
                  if (deviceToken) {
                    Clipboard.setString(deviceToken);
                    setShowTokenModal(false);
                  }
                }}
              >
                <Ionicons name="copy" size={18} color={Colors.white} />
                <Text style={styles.tokenCopyText}>Copy Token</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tokenCloseBtn} onPress={() => setShowTokenModal(false)}>
                <Text style={styles.tokenCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal> */}
      </SafeAreaView>

      {searchVisible && (
        <SearchScreen
          token={token}
          isDarkMode={isDarkMode}
          onBack={() => {
            setSearchVisible(false);
            setActiveTab(previousTab);
            activeTabRef.current = previousTab;
          }}
          onSearchSubmit={(query) => {
            setSearchQuery(query);
            setSearchVisible(false);
          }}
        />
      )}

      {showCart && (
        <View style={styles.cartScreenOverlay}>
          <CartScreen
            token={token}
            user={user}
            wishlistCount={wishlistCount}
            isDarkMode={isDarkMode}
            onBack={() => setShowCart(false)}
            onProfilePress={() => {
              setShowCart(false);
              navigateTo('profile');
            }}
            onProductPress={(productId) => {
              setShowCart(false);
              setPreviousSearchQuery(null);
              setPreviousTab(activeTabRef.current);
              setSelectedProductId(productId);
            }}
            onCheckout={() => {
              setShowCart(false);
              // Navigate to checkout
            }}
          />
        </View>
      )}

      {showProfileDetails && (
        <View style={styles.cartScreenOverlay}>
          <ProfileDetailsScreen
            token={token}
            cartCount={cartCount}
            onClose={() => setShowProfileDetails(false)}
            onCartPress={() => {
              setShowProfileDetails(false);
              setShowCart(true);
            }}
          />
        </View>
      )}

      {/* Exit Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <Pressable style={styles.exitModalOverlay} onPress={() => setShowExitConfirm(false)} activeOpacity={1}>
          <View style={styles.exitModalContent}>
            <Text style={styles.exitModalTitle}>Close App</Text>
            <Text style={styles.exitModalMessage}>Do you want to close the application?</Text>

            <View style={styles.exitModalButtons}>
              <Pressable
                style={[styles.exitModalButton, styles.exitModalButtonCancel]}
                onPress={() => setShowExitConfirm(false)}
              >
                <Text style={styles.exitModalButtonCancelText}>Continue</Text>
              </Pressable>

              <Pressable
                style={[styles.exitModalButton, styles.exitModalButtonClose]}
                onPress={() => BackHandler.exitApp()}
              >
                <Text style={styles.exitModalButtonCloseText}>Close App</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fbff' },
  safe: { flex: 1, backgroundColor: Colors.white },
  body: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  h1: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  navBarContainer: {
    backgroundColor: Colors.white,
  },
  navBarContainerDark: {
    backgroundColor: '#1f2937',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    overflow: 'visible',
  },
  navBarDark: {
    backgroundColor: '#1f2937',
    borderTopColor: '#374151',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingVertical: 6,
  },
  indicator: {
    height: 3,
    width: '100%',
    alignItems: 'center',
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
    position: 'relative',
  },
  homeLogoImage: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeDark: {
    borderColor: '#111827',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 11,
  },
  navLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  navLabelActive: {
    color: Colors.sky,
    fontWeight: '700',
  },
  navLabelDark: {
    color: '#d1d5db',
  },
  navLabelActiveDark: {
    color: '#38bdf8',
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarActive: {
    borderColor: Colors.sky,
    backgroundColor: '#e0f2fe',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  avatarInitialActive: {
    color: Colors.sky,
  },
  shopItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    paddingBottom: 4,
  },
  shopSlot: {
    height: 37,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  shopDiamond: {
    width: 48,
    height: 48,
    backgroundColor: Colors.sky,
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
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
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
  },
  menuPanel: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    padding: 18,
    paddingTop: 36,
    borderBottomRightRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '100%',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.white,
    marginBottom: 12,
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2b2f38',
  },
  menuText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  tokenModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 380,
  },
  tokenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  tokenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  tokenBox: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenText: {
    fontSize: 11,
    color: Colors.text,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  tokenCopyBtn: {
    backgroundColor: Colors.sky,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  tokenCopyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  tokenCloseBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tokenCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  cartScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: Colors.white,
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  exitModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 12,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  exitModalMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  exitModalButtons: {
    width: '100%',
    gap: 10,
  },
  exitModalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitModalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exitModalButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  exitModalButtonClose: {
    backgroundColor: Colors.error,
  },
  exitModalButtonCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
