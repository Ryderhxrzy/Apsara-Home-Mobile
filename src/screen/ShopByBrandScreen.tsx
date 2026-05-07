import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Pressable,
  TouchableOpacity,
  Image,
  Animated,
  BackHandler,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { productService, Product } from '../services/productService';
import ItemCard from '../components/Items/ItemCard';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { Skeleton } from '../components/SkeletonLoader/SkeletonLoader';

const { width } = Dimensions.get('window');

const ROOMS = [
  { room_id: 1, slug: 'bedroom', room_name: 'Bedroom' },
  { room_id: 2, slug: 'kitchen', room_name: 'Kitchen' },
  { room_id: 3, slug: 'living-room', room_name: 'Living Room' },
  { room_id: 4, slug: 'outdoor', room_name: 'Outdoor' },
  { room_id: 5, slug: 'study-office-room', room_name: 'Study & Office' },
  { room_id: 6, slug: 'dining-room', room_name: 'Dining Room' },
  { room_id: 7, slug: 'laundry-room', room_name: 'Laundry Room' },
  { room_id: 8, slug: 'bathroom', room_name: 'Bathroom' },
];

interface BrandInfo {
  id: number;
  name: string;
  logo?: string;
  brand_image?: string;
  image?: string;
  total_products?: number;
  supplier_name?: string;
  tagline?: string;
}

interface ShopByBrandScreenProps {
  token?: string | null;
  user?: any;
  cartCount?: number;
  brandId?: number;
  brand?: BrandInfo;
  categories?: any[];
  onBack?: () => void;
  onProductPress?: (id: number) => void;
  onCartPress?: () => void;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
  isDarkMode?: boolean;
}

export default function ShopByBrandScreen({
  token,
  user,
  cartCount = 0,
  brandId,
  brand,
  categories = [],
  onBack = () => {},
  onProductPress = () => {},
  onCartPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
  isDarkMode = false,
}: ShopByBrandScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const perPage = 20;
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const selectedRoom = useMemo(
    () => selectedRoomId ? ROOMS.find(r => r.room_id === selectedRoomId) : null,
    [selectedRoomId]
  );

  const masonryColumns = useMemo(() => {
    const leftColumn: Product[] = [];
    const rightColumn: Product[] = [];

    products.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });

    return { leftColumn, rightColumn };
  }, [products]);

  const featuredProducts = useMemo(() => {
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 4);
  }, [products]);

  const fetchProducts = useCallback(async (page: number = 1) => {
    if (!token || !brandId) return;

    try {
      setLoading(page === 1);
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${API_CONFIG.BASE_URL}/products?status=1&page=${page}&per_page=${perPage}&brand_type=${brandId}`;
      if (selectedRoomId) url += `&room_type=${selectedRoomId}`;
      if (selectedCategoryId) url += `&cat_id=${selectedCategoryId}`;
      if (searchQuery.trim()) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await axios.get(url, { headers });

      let data = response.data?.data || response.data?.products || [];
      if (!Array.isArray(data)) {
        data = [];
      }

      const total = response.data?.meta?.total || response.data?.total || response.data?.pagination?.total || data.length;
      const pages = Math.ceil(total / perPage);

      setProducts(data);
      setTotalProducts(total);
      setTotalPages(pages);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load products',
        text2: error.message || 'Please try again',
      });
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, brandId, selectedRoomId, selectedCategoryId, searchQuery, perPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [selectedRoomId, selectedCategoryId, searchQuery, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(currentPage);
  };

  const handleRoomSelect = (roomId: number | null) => {
    setSelectedRoomId(roomId);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      fetchProducts(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      fetchProducts(currentPage - 1);
    }
  };

  const renderItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find(w => w.product.id === item.id);
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
      badges: {
        musthave: item.musthave,
        bestseller: item.bestseller,
        salespromo: item.salespromo,
      },
    };

    return (
      <View key={`product-${item.id}`} style={styles.masonryItem}>
        <ItemCard
          product={productCard}
          token={token}
          isDarkMode={isDarkMode}
          onPress={(product) => onProductPress(product.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={onWishlistChange}
        />
      </View>
    );
  };

  const renderFeaturedItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find(w => w.product.id === item.id);
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
      badges: {
        musthave: item.musthave,
        bestseller: item.bestseller,
        salespromo: item.salespromo,
      },
    };

    return (
      <View key={`featured-${item.id}`} style={styles.featuredItemWrap}>
        <ItemCard
          product={productCard}
          token={token}
          isDarkMode={isDarkMode}
          onPress={(product) => onProductPress(product.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={onWishlistChange}
        />
      </View>
    );
  };

  const getBrandLogo = () => {
    if (brand?.logo) return brand.logo;
    if (brand?.brand_image) return brand.brand_image;
    if (brand?.image) return brand.image;
    return null;
  };

  const getBrandInitial = () => {
    return brand?.name?.trim()?.charAt(0)?.toUpperCase() || '?';
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => sub.remove();
  }, [onBack]);

  const themeColors = {
    containerBg: isDarkMode ? '#0f172a' : '#f8fbff',
    headerBg: isDarkMode ? '#1e293b' : Colors.white,
    headerBorder: isDarkMode ? '#334155' : '#e0f2fe',
    text: isDarkMode ? '#f1f5f9' : Colors.text,
    textSecondary: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    cardBg: isDarkMode ? '#1e293b' : Colors.white,
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    buttonBg: isDarkMode ? '#334155' : '#f1f5f9',
    buttonBorder: isDarkMode ? '#475569' : '#e5e7eb',
    searchBg: isDarkMode ? '#1e293b' : Colors.white,
    searchBorder: isDarkMode ? '#334155' : '#e5e7eb',
    paginationBg: isDarkMode ? '#0f172a' : '#f8fbff',
    paginationBorder: isDarkMode ? '#334155' : '#e5e7eb',
    divider: isDarkMode ? '#334155' : '#eef2f7',
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.containerBg }]}>
      {/* Custom Header with Brand Info */}
      <LinearGradient
        colors={isDarkMode ? ['rgba(30,41,59,0.5)', 'rgba(15,23,42,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.customHeader, { paddingTop: insets.top, backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.headerBorder }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={[styles.backIconButton, { backgroundColor: themeColors.buttonBg, borderColor: themeColors.buttonBorder }]}>
            <Ionicons name="chevron-back" size={24} color={themeColors.text} />
          </TouchableOpacity>

          <View style={styles.brandHeaderContent}>
            <View style={[styles.brandLogoHeader, { borderColor: Colors.sky }]}>
              {getBrandLogo() ? (
                <Image source={{ uri: getBrandLogo() }} style={styles.brandLogoImageHeader} />
              ) : (
                <View style={styles.brandLogoFallbackHeader}>
                  <Text style={styles.brandInitialHeader}>{getBrandInitial()}</Text>
                </View>
              )}
            </View>
            <View style={styles.brandHeaderText}>
              <Text style={styles.brandHeaderLabel} numberOfLines={1}>Official Brand Store</Text>
              <Text style={[styles.brandHeaderName, { color: themeColors.text }]} numberOfLines={1}>{brand?.name || 'Brand'}</Text>
              {brand?.supplier_name ? (
                <Text style={[styles.brandHeaderSupplier, { color: themeColors.textSecondary }]} numberOfLines={1}>{brand.supplier_name}</Text>
              ) : null}
              {brand?.tagline ? (
                <Text style={[styles.brandHeaderTagline, { color: themeColors.textSecondary }]} numberOfLines={1}>{brand.tagline}</Text>
              ) : null}
              <View style={styles.brandMetaRow}>
                {brand?.total_products !== undefined ? (
                  <Text style={[styles.brandHeaderProducts, { color: themeColors.textSecondary }]} numberOfLines={1}>{brand.total_products} listed</Text>
                ) : null}
                <Text style={[styles.brandMetaDot, { color: themeColors.textSecondary }]}>•</Text>
                <Text style={[styles.brandHeaderProducts, { color: themeColors.textSecondary }]} numberOfLines={1}>{totalProducts} matched</Text>
                {brandId ? (
                  <>
                    <Text style={[styles.brandMetaDot, { color: themeColors.textSecondary }]}>•</Text>
                    <Text style={[styles.brandHeaderProducts, { color: themeColors.textSecondary }]} numberOfLines={1}>ID #{brandId}</Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onCartPress} style={[styles.cartIconButton, { backgroundColor: themeColors.buttonBg, borderColor: themeColors.buttonBorder }]}>
            <Ionicons name="cart-outline" size={22} color={themeColors.text} />
            {cartCount > 0 && (
              <View style={styles.cartBadgeHeader}>
                <Text style={styles.cartBadgeTextHeader}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchWrapper, { backgroundColor: themeColors.searchBg, borderColor: themeColors.searchBorder }]}>
            <Ionicons name="search-outline" size={16} color={themeColors.textSecondary} style={styles.searchIconLeft} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search products in this brand"
              placeholderTextColor={themeColors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close-circle" size={16} color={themeColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity style={[styles.filterIconButton, { backgroundColor: themeColors.buttonBg, borderColor: themeColors.buttonBorder }]} activeOpacity={0.7}>
            <Ionicons name="options-outline" size={20} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {featuredProducts.length > 0 && (
          <View style={[styles.featuredSection, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
            <View style={[styles.featuredHeaderRow, { borderBottomColor: themeColors.divider }]}>
              <Text style={[styles.featuredTitle, { color: themeColors.text }]}>Featured Products</Text>
              <Text style={[styles.featuredSubtitle, { color: themeColors.textSecondary }]}>Top picks from this brand</Text>
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

        {/* Products Grid */}
        {loading && !refreshing ? (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              <Skeleton width="100%" height={220} borderRadius={8} />
              <Skeleton width="100%" height={260} borderRadius={8} style={{ marginTop: 8 }} />
              <Skeleton width="100%" height={240} borderRadius={8} style={{ marginTop: 8 }} />
            </View>
            <View style={styles.masonryColumn}>
              <Skeleton width="100%" height={260} borderRadius={8} />
              <Skeleton width="100%" height={220} borderRadius={8} style={{ marginTop: 8 }} />
              <Skeleton width="100%" height={250} borderRadius={8} style={{ marginTop: 8 }} />
            </View>
          </View>
        ) : products.length > 0 ? (
          <View style={styles.masonryGrid}>
            <View style={styles.masonryColumn}>
              {masonryColumns.leftColumn.map((product) => renderItem(product))}
            </View>
            <View style={styles.masonryColumn}>
              {masonryColumns.rightColumn.map((product) => renderItem(product))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={themeColors.textSecondary} />
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>No products found</Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={[styles.paginationContainer, { backgroundColor: themeColors.paginationBg, borderTopColor: themeColors.paginationBorder }]}>
            <Pressable
              onPress={handlePreviousPage}
              disabled={currentPage === 1}
              style={[styles.paginationButton, { backgroundColor: currentPage === 1 ? themeColors.buttonBg : isDarkMode ? '#0e4a6b' : '#f0f9ff', borderColor: currentPage === 1 ? themeColors.buttonBorder : Colors.sky }, currentPage === 1 && styles.paginationButtonDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 1 ? themeColors.textSecondary : Colors.sky}
              />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </Pressable>

            <View style={styles.pageInfo}>
              <Text style={[styles.pageNumber, { color: themeColors.text }]}>
                Page {currentPage} of {totalPages}
              </Text>
            </View>

            <Pressable
              onPress={handleNextPage}
              disabled={currentPage >= totalPages}
              style={[styles.paginationButton, { backgroundColor: currentPage >= totalPages ? themeColors.buttonBg : isDarkMode ? '#0e4a6b' : '#f0f9ff', borderColor: currentPage >= totalPages ? themeColors.buttonBorder : Colors.sky }, currentPage >= totalPages && styles.paginationButtonDisabled]}
            >
              <Text style={[styles.paginationButtonText, currentPage >= totalPages && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage >= totalPages ? themeColors.textSecondary : Colors.sky}
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    marginTop: 10,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    marginLeft: 6,
  },
  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  brandHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 8,
  },
  brandLogoHeader: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
  },
  brandLogoImageHeader: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  brandLogoFallbackHeader: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitialHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  brandHeaderText: {
    flex: 1,
  },
  brandHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sky,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  brandHeaderName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 14,
  },
  brandHeaderSupplier: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 12,
  },
  brandHeaderTagline: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 12,
    fontStyle: 'italic',
  },
  brandMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  brandMetaDot: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  brandHeaderProducts: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 0,
    lineHeight: 12,
  },
  cartIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  cartBadgeHeader: {
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
  cartBadgeTextHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  featuredSection: {
    marginHorizontal: 8,
    marginTop: 16,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  featuredHeaderRow: {
    paddingHorizontal: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  featuredSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featuredGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingTop: 2,
    paddingRight: 4,
  },
  featuredItemWrap: {
    width: width * 0.46,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: '100%',
  },
  emptyContainer: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    marginTop: 16,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  paginationButtonDisabled: {
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sky,
  },
  paginationButtonTextDisabled: {
    color: Colors.textSecondary,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
});
