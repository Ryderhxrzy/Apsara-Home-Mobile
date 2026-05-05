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
import AppHeader from '../components/AppHeader/AppHeader';
import HomeScreen from '../screen/HomeScreen';
import ProfileScreen from '../screen/ProfileScreen';
import SearchScreen from '../screen/SearchScreen';
import ProductsScreen from '../screen/ProductsScreen';
import SearchResultScreen from '../screen/SearchResultScreen';
import SettingsScreen from '../screen/SettingsScreen';
import ProductDetailScreen from '../screen/ProductDetailScreen';
import WishlistScreen from '../screen/WishlistScreen';

type TabKey = 'home' | 'wishlist' | 'shop' | 'notification' | 'profile' | 'settings';

const TABS: TabKey[] = ['home', 'wishlist', 'shop', 'notification', 'profile'];
const SLIDE_DISTANCE = 30;
const OUT_DURATION = 0;
const IN_DURATION = 0;

// Cache utilities using expo-file-system
const CACHE_DIR = FileSystem.cacheDirectory + 'apsara_cache/';
const cacheUtils = {
  async init() {
    try {
      const info = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    } catch (error) {
      console.log('Cache init error:', error);
    }
  },
  async get(key: string) {
    try {
      const file = await FileSystem.readAsStringAsync(CACHE_DIR + key);
      return JSON.parse(file);
    } catch {
      return null;
    }
  },
  async set(key: string, data: any) {
    try {
      await FileSystem.writeAsStringAsync(CACHE_DIR + key, JSON.stringify(data));
    } catch (error) {
      console.log('Cache write error:', error);
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

interface ProductCard {
  id: number;
  [key: string]: any;
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
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [previousTab, setPreviousTab] = useState<TabKey>('home');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [previousSearchQuery, setPreviousSearchQuery] = useState<string | null>(null);
  const [searchSourceProductId, setSearchSourceProductId] = useState<number | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // Home screen data - persists across navigation
  const [homeCategories, setHomeCategories] = useState<CategoryItem[]>([]);
  const [homeBrands, setHomeBrands] = useState<BrandItem[]>([]);
  const [homeFeaturedProducts, setHomeFeaturedProducts] = useState<ProductCard[]>([]);
  const [homeRoomTypes, setHomeRoomTypes] = useState<RoomType[]>([]);
  const [homeLoadingFeatured, setHomeLoadingFeatured] = useState(false);
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
      await cacheUtils.init();
      // Preload cached home data immediately
      try {
        const [cachedCats, cachedBrands, cachedRooms] = await Promise.all([
          cacheUtils.get('home_categories'),
          cacheUtils.get('home_brands'),
          cacheUtils.get('home_rooms'),
        ]);
        if (cachedCats?.length) setHomeCategories(cachedCats);
        if (cachedBrands?.length) setHomeBrands(cachedBrands);
        if (cachedRooms?.length) setHomeRoomTypes(cachedRooms);
        console.log('✅ PRELOADED CACHE ON APP START');
      } catch (error) {
        console.log('Preload error:', error);
      }
    };
    init();
  }, []);

  // Setup push notifications
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Request permissions
        const { status } = await Notifications.requestPermissionsAsync();
        console.log('Notification permission status:', status);

        // Get device push token
        const pushToken = await Notifications.getExpoPushTokenAsync();
        setDeviceToken(pushToken.data);
        console.log('📱 DEVICE TOKEN:', pushToken.data);

        // Set notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        // Listen for notifications
        const subscription = Notifications.addNotificationResponseListener(({ notification }) => {
          console.log('Notification received:', notification);
        });

        return () => subscription.remove();
      } catch (error) {
        console.log('Notification setup error:', error);
      }
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    if (!token) return;

    // Fetch cart count
    const headers = { Authorization: `Bearer ${token}` };
    axios.get(`${API_CONFIG.BASE_URL}/cart`, { headers })
      .then(cartRes => setCartCount(extractCount(cartRes.data)))
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

    // Fetch fresh data in background (cache already preloaded on app start)
    try {
      setHomeLoadingFeatured(true);
      const totalStart = performance.now();
      console.log('🔄 FETCHING FRESH DATA...');

      const apiStart = performance.now();
      const [categoryData, brandData, roomData] = await Promise.all([
        authService.getCategories(token),
        authService.getBrandsWithProducts(token, 6),
        axios.get(`${API_CONFIG.BASE_URL}/room-types`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then(res => res.data?.data || []).catch(() => []),
      ]);
      console.log(`📡 API CALLS: ${Math.round(performance.now() - apiStart)}ms`);

      const sortStart = performance.now();
      const sortedCategories = categoryData.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
      console.log(`🔄 SORTING: ${Math.round(performance.now() - sortStart)}ms`);

      // Update state with fresh data
      setHomeCategories(sortedCategories);
      setHomeBrands(brandData);
      setHomeRoomTypes(roomData);

      // Update cache with fresh data
      await Promise.all([
        cacheUtils.set('home_categories', sortedCategories),
        cacheUtils.set('home_brands', brandData),
        cacheUtils.set('home_rooms', roomData),
      ]);

      console.log(`⏱️ FRESH DATA READY: ${Math.round(performance.now() - totalStart)}ms`);
    } catch (error: any) {
      console.error('Home data fetch error:', error);
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
        const cachedWishlist = await cacheUtils.get('wishlist_items');
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

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const activeTabRef = useRef<TabKey>('home');

  function navigateTo(key: TabKey) {
    if (key === activeTabRef.current) return;

    setPreviousTab(activeTabRef.current);
    const direction = TABS.indexOf(key) > TABS.indexOf(activeTabRef.current) ? 1 : -1;

    // Update ref immediately so rapid taps don't double-fire
    activeTabRef.current = key;

    // Stop any in-progress animation cleanly
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: OUT_DURATION, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -direction * SLIDE_DISTANCE, duration: OUT_DURATION, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setActiveTab(key);
      slideAnim.setValue(direction * SLIDE_DISTANCE);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: IN_DURATION, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: IN_DURATION, useNativeDriver: true }),
      ]).start();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 12,
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
    notification: cartCount, // Using cartCount for notification count
    wishlist: wishlistCount,
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <View style={styles.body} {...panResponder.panHandlers}>
          {selectedProductId !== null ? (
            <ProductDetailScreen
              productId={selectedProductId}
              token={token}
              user={user}
              cartCount={cartCount}
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
            />
          ) : searchQuery ? (
            <SearchResultScreen
              token={token}
              query={searchQuery}
              onBack={() => setSearchQuery(null)}
              onProductPress={(product) => {
                setPreviousSearchQuery(searchQuery);
                setSelectedProductId(product.id);
              }}
            />
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
                onCartPress={() => navigateTo('notification')}
                onCameraPress={() => {
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
              />
              <WishlistScreen
                token={token}
                wishlistItems={wishlistItems}
                loading={wishlistLoading}
                refreshing={wishlistRefreshing}
                onRefresh={() => fetchWishlistData(true)}
                onProductPress={(id: number) => {
                  setPreviousSearchQuery(null);
                  setPreviousTab(activeTabRef.current);
                  setSelectedProductId(id);
                }}
              />
            </>
          ) : activeTab === 'profile' ? (
            <ProfileScreen
              user={user}
              onLogout={onLogout}
              onNavigateSettings={() => navigateTo('settings')}
            />
          ) : activeTab === 'home' ? (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                onCartPress={() => navigateTo('notification')}
                onCameraPress={() => {
                  // TODO: Implement camera functionality
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
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
              />
            </>
          ) : (
            <>
              <AppHeader
                user={user}
                cartCount={cartCount}
                onCartPress={() => navigateTo('notification')}
                onCameraPress={() => {
                  // TODO: Implement camera functionality
                  console.log('Camera pressed');
                }}
                onSearchPress={() => {
                  setSearchSourceProductId(null);
                  setPreviousTab(activeTabRef.current);
                  setSearchVisible(true);
                }}
              />
              <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
                <Text style={styles.h1}>{labelMap[activeTab]}</Text>
                <Text style={styles.bodyText}>This is the {labelMap[activeTab].toLowerCase()} page.</Text>
              </Animated.View>
            </>
          )}
        </View>

        {!searchQuery && activeTab !== 'settings' && selectedProductId === null && (
          <View style={styles.navBar}>
            {TABS.map(key => {
              const active = activeTab === key;

            if (key === 'shop') {
              return (
                <Pressable key={key} style={styles.shopItem} onPress={() => navigateTo(key)}>
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
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
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
                onLongPress={() => key === 'notification' && deviceToken && setShowTokenModal(true)}
              >
                <View style={styles.indicator}>
                  {active && <View style={styles.indicatorLine} />}
                </View>
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={active ? iconActive[key] : iconInactive[key]}
                    size={24}
                    color={active ? Colors.sky : Colors.textSecondary}
                  />
                  {count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                  {labelMap[key]}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

        <Modal visible={showTokenModal} transparent animationType="fade" onRequestClose={() => setShowTokenModal(false)}>
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
        </Modal>
      </SafeAreaView>

      {searchVisible && (
        <SearchScreen
          token={token}
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 0,
    overflow: 'visible',
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
});
