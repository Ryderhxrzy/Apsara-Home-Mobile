import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { productService, Product } from '../services/productService';
import ItemCard from '../components/Items/ItemCard';
import AppHeader from '../components/AppHeader/AppHeader';
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

interface ShopScreenProps {
  token?: string | null;
  user?: any;
  cartCount?: number;
  roomId?: number | null;
  categoryId?: number | null;
  brandId?: number | null;
  categories?: any[];
  brands?: any[];
  onBack?: () => void;
  onProductPress?: (id: number) => void;
  onCartPress?: () => void;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
}

export default function ShopScreen({
  token,
  user,
  cartCount = 0,
  roomId = null,
  categoryId = null,
  brandId = null,
  categories = [],
  brands = [],
  onBack = () => {},
  onProductPress = () => {},
  onCartPress = () => {},
  wishlistItems = [],
  onWishlistChange = () => {},
}: ShopScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(roomId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(categoryId);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(brandId);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const perPage = 20;
  const scrollViewRef = useRef<ScrollView>(null);

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

  const fetchProducts = useCallback(async (page: number = 1) => {
    if (!token) return;

    try {
      setLoading(page === 1);
      const headers = { Authorization: `Bearer ${token}` };

      let url = `${API_CONFIG.BASE_URL}/products?status=1&page=${page}&per_page=${perPage}`;
      if (selectedRoomId) url += `&room_type=${selectedRoomId}`;
      if (selectedCategoryId) url += `&cat_id=${selectedCategoryId}`;
      if (selectedBrandId) url += `&brand_type=${selectedBrandId}`;

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
  }, [token, selectedRoomId, selectedCategoryId, selectedBrandId, perPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [selectedRoomId, selectedCategoryId, selectedBrandId, fetchProducts]);

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
          onPress={(product) => onProductPress(product.id)}
          isWishlisted={!!wishlistItem}
          wishlistId={wishlistItem?.wishlist_id}
          onWishlistToggle={onWishlistChange}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AppHeader
        user={user}
        cartCount={cartCount}
        onCartPress={onCartPress}
        onCameraPress={() => console.log('Camera pressed')}
        onSearchPress={() => console.log('Search pressed')}
        onProfilePress={() => console.log('Profile pressed')}
        showRoomFilter={true}
        selectedRoom={selectedRoom?.room_name || 'All Room Types'}
        showCategoryFilter={true}
        selectedCategory={selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'All Categories'}
        categories={categories}
        showBrandFilter={true}
        selectedBrand={selectedBrandId ? brands.find(b => b.id === selectedBrandId)?.name : 'All Brands'}
        brands={brands}
        onRoomFilterChange={(filterType, value) => {
          if (filterType === 'room') handleRoomSelect(value === 'All Room Types' ? null : ROOMS.find(r => r.room_name === value)?.room_id || null);
          if (filterType === 'category') setSelectedCategoryId(value || null);
          if (filterType === 'brand') setSelectedBrandId(value || null);
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Info Section - Scrolls with content */}
        <View style={styles.filterInfoContainer}>
          <View style={styles.viewToggleWrapper}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewType === 'grid' && styles.viewToggleButtonActive,
              ]}
              onPress={() => setViewType('grid')}
            >
              <Ionicons
                name="apps-outline"
                size={14}
                color={viewType === 'grid' ? Colors.white : Colors.text}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  viewType === 'grid' && styles.viewToggleTextActive,
                ]}
              >
                Card
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                styles.viewToggleButtonLast,
                viewType === 'list' && styles.viewToggleButtonActive,
              ]}
              onPress={() => setViewType('list')}
            >
              <Ionicons
                name="reader-outline"
                size={14}
                color={viewType === 'list' ? Colors.white : Colors.text}
              />
              <Text
                style={[
                  styles.viewToggleText,
                  viewType === 'list' && styles.viewToggleTextActive,
                ]}
              >
                List
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.productCountInfo}>
            {(currentPage - 1) * perPage + 1} - {Math.min(currentPage * perPage, totalProducts)} of {totalProducts} products
          </Text>
        </View>

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
            <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <Pressable
              onPress={handlePreviousPage}
              disabled={currentPage === 1}
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentPage === 1 ? Colors.textSecondary : Colors.sky}
              />
              <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </Pressable>

            <View style={styles.pageInfo}>
              <Text style={styles.pageNumber}>
                Page {currentPage} of {totalPages}
              </Text>
              <Text style={styles.pageDetails}>
                {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, totalProducts)} of {totalProducts}
              </Text>
            </View>

            <Pressable
              onPress={handleNextPage}
              disabled={currentPage >= totalPages}
              style={[styles.paginationButton, currentPage >= totalPages && styles.paginationButtonDisabled]}
            >
              <Text style={[styles.paginationButtonText, currentPage >= totalPages && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentPage >= totalPages ? Colors.textSecondary : Colors.sky}
              />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  filterInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  viewToggleWrapper: {
    flexDirection: 'row',
    gap: 0,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    backgroundColor: Colors.white,
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.sky,
    borderRightColor: Colors.sky,
  },
  viewToggleButtonLast: {
    borderRightWidth: 0,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  viewToggleTextActive: {
    color: Colors.white,
  },
  productCountInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 16,
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
    color: Colors.textSecondary,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fbff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
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
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: Colors.sky,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
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
    color: Colors.text,
  },
  pageDetails: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
