// @ts-nocheck
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Text,
  ScrollView,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import DailyCheckin from '../components/DailyCheckin/DailyCheckin';
import MissionTasks from '../components/MissionTasks/MissionTasks';
import ItemCard from '../components/Items/ItemCard';
import { useOptimizedProducts } from '../hooks/useOptimizedProducts';
import { Product } from '../services/productService';

interface PVEarnerScreenProps {
  isDarkMode: boolean;
  onBack: () => void;
  onDailyCheckin?: () => void;
  token?: string | null;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
  onProductPress?: (id: number) => void;
  onShopPress?: () => void;
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
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(1);
  const [localWishlistItems, setLocalWishlistItems] = useState(wishlistItems);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useOptimizedProducts({
    token,
  });

  const currentPageProducts = useMemo(() => {
    let products: Product[] = [];
    if (data?.pages) {
      for (let i = 0; i < currentPage && i < data.pages.length; i++) {
        products = [...products, ...(data.pages[i]?.products || [])];
      }
    }
    // Limit to 20 products
    return products.slice(0, 20);
  }, [data?.pages, currentPage]);

  const masonryData = useMemo(() => {
    const leftColumn: Product[] = [];
    const rightColumn: Product[] = [];

    currentPageProducts.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });

    return { leftColumn, rightColumn };
  }, [currentPageProducts]);

  const renderItem = useCallback((item: Product) => {
    const wishlistItem = localWishlistItems?.find(w => w.product.id === item.id);
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
    };

    const handleWishlistToggle = (productId: number, isWishlisted: boolean) => {
      if (isWishlisted) {
        setLocalWishlistItems([...localWishlistItems, { product: { id: productId }, wishlist_id: 0 }]);
      } else {
        setLocalWishlistItems(localWishlistItems.filter(w => w.product.id !== productId));
      }
      onWishlistChange?.();
    };

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
    );
  }, [localWishlistItems, token, isDarkMode, onProductPress, onWishlistChange]);

  const renderLoadingPlaceholders = () => {
    const dummyProducts = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      name: 'Loading...',
      image: undefined,
      soldCount: 0,
      priceSrp: 0,
      priceMember: 0,
      prodpv: 0,
      brand: 'Brand',
      variants: [],
      musthave: false,
      bestseller: false,
      salespromo: false,
    }));

    const leftColumn = dummyProducts.filter((_, i) => i % 2 === 0);
    const rightColumn = dummyProducts.filter((_, i) => i % 2 !== 0);

    const renderDummyCard = (item: any) => (
      <View key={`loading-${item.id}`} style={styles.masonryItem}>
        <View style={[styles.dummyCard, { backgroundColor: colors.containerBg, borderColor: colors.border }]}>
          <View style={[styles.dummyImageContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
            <Image
              source={require('../../assets/af_home_logo.png')}
              style={styles.dummyImage}
              resizeMode="contain"
              tintColor={isDarkMode ? '#cbd5e1' : '#4b5563'}
            />
          </View>
          <View style={styles.dummyContent}>
            <View style={[styles.dummyLine, { backgroundColor: isDarkMode ? '#334155' : '#e5e7eb' }]} />
            <View style={[styles.dummyLine, { backgroundColor: isDarkMode ? '#334155' : '#e5e7eb', width: '70%' }]} />
            <View style={[styles.dummyLine, { backgroundColor: isDarkMode ? '#334155' : '#e5e7eb', width: '50%', marginTop: 8 }]} />
          </View>
        </View>
      </View>
    );

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {leftColumn.map(item => renderDummyCard(item))}
        </View>
        <View style={styles.masonryColumn}>
          {rightColumn.map(item => renderDummyCard(item))}
        </View>
      </View>
    );
  };

  const renderProductsContent = () => {
    if (currentPageProducts.length === 0 && isLoading) {
      return renderLoadingPlaceholders();
    }

    if (currentPageProducts.length === 0) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
          <Ionicons name="cube-outline" size={48} color={colors.textSec} />
          <Text style={[styles.emptyText, { color: colors.textSec }]}>No products found</Text>
        </View>
      );
    }

    return (
      <View style={styles.masonryGrid}>
        <View style={styles.masonryColumn}>
          {masonryData.leftColumn.map((product, index) => (
            <View key={`left-${product.id}-${index}`} style={styles.masonryItem}>
              {renderItem(product)}
            </View>
          ))}
        </View>
        <View style={styles.masonryColumn}>
          {masonryData.rightColumn.map((product, index) => (
            <View key={`right-${product.id}-${index}`} style={styles.masonryItem}>
              {renderItem(product)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['left', 'right', 'bottom']}>
      {/* Header with Background Image */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Image
          source={require('../../assets/pv_earner_bg.png')}
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: Colors.white }]}>PV Earner</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Daily Check-In and Missions */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <DailyCheckin
          isDarkMode={isDarkMode}
          onViewMore={onBack}
        />
        <MissionTasks isDarkMode={isDarkMode} />

        {/* Products Section */}
        <View style={styles.productsSection}>
          <Text style={[styles.productsSectionTitle, { color: colors.text }]}>Explore Products</Text>
          {renderProductsContent()}
        </View>

        {/* Shop More Button */}
        <TouchableOpacity
          style={[styles.shopMoreButton, { marginHorizontal: 8 }]}
          activeOpacity={0.85}
          onPress={onShopPress}
        >
          <LinearGradient
            colors={['#0284c7', '#0ea5e9']}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 90,
    borderBottomWidth: 1,
  },
  headerBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },
  productsSection: {
    gap: 0,
    marginHorizontal: -8,
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 8,
    marginTop: 0,
    textAlign: 'left',
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: '100%',
  },
  dummyCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  dummyImageContainer: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dummyImage: {
    width: '60%',
    height: '60%',
  },
  dummyContent: {
    padding: 12,
    gap: 6,
  },
  dummyLine: {
    height: 8,
    borderRadius: 4,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
  shopMoreButton: {
    marginTop: 20,
    marginBottom: 28,
    borderRadius: 12,
    overflow: 'hidden',
  },
  shopMoreGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shopMoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
});
