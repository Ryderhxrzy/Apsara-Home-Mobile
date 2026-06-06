// @ts-nocheck
import React, { useMemo, useState, useRef } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Pressable,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import FeaturedItems from '../../components/Items/FeaturedItems';
import ItemCard from '../../components/Items/ItemCard';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const BANNER_IMAGES = [
  'https://t3.ftcdn.net/jpg/04/65/46/52/360_F_465465254_1pN9MGrA831idD6zIBL7q8rnZZpUCQTy.jpg',
  'https://t3.ftcdn.net/jpg/04/65/46/52/360_F_465465254_1pN9MGrA831idD6zIBL7q8rnZZpUCQTy.jpg',
];

const STATIC_VOUCHERS = [
  {
    id: 1,
    discount: '30%',
    description: 'Discount on all products',
    code: 'SAVE30',
    minSpend: '₱500',
    validity: 'Until Dec 31',
  },
  {
    id: 2,
    discount: '₱200',
    description: 'Off on purchases',
    code: 'BRAND200',
    minSpend: '₱1000',
    validity: 'Until Dec 31',
  },
  {
    id: 3,
    discount: '25%',
    description: 'Special discount',
    code: 'SPECIAL25',
    minSpend: '₱750',
    validity: 'Until Dec 31',
  },
  {
    id: 4,
    discount: '₱500',
    description: 'Limited time offer',
    code: 'LUCKY500',
    minSpend: '₱2000',
    validity: 'Until Dec 31',
  },
];

interface Product {
  id: number;
  name: string;
  image: string;
  price?: string;
  priceMember?: string;
  priceDp?: string;
  prodpv?: string;
  pv?: string;
  original_price?: string;
  discounted_price?: string;
  musthave?: boolean;
  bestseller?: boolean;
  salespromo?: boolean;
  priceSrp?: number;
  soldCount?: number;
  brand?: string;
  variants?: any[];
}

interface ShopByBrandHomeScreenProps {
  products: Product[];
  token?: string | null;
  isDarkMode?: boolean;
  onProductPress?: (id: number) => void;
  wishlistItems?: any[];
  onWishlistChange?: () => void;
  loading?: boolean;
  onSeeMore?: () => void;
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    Toast.show({
      type: 'success',
      text1: 'Copied!',
      text2: `Voucher code ${code} copied to clipboard`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleBannerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (width * 0.9));
    setCurrentBannerIndex(index);
  };

  const themeColors = {
    containerBg: isDarkMode ? '#0f172a' : '#f5f5f5',
    text: isDarkMode ? '#f1f5f9' : Colors.text,
    textSecondary: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    cardBg: isDarkMode ? '#1e293b' : Colors.white,
    cardBorder: isDarkMode ? '#334155' : '#e2e8f0',
    divider: isDarkMode ? '#334155' : '#eef2f7',
  };

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

  const renderFeaturedItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find(w => w.product.id === item.id);

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
    );
  };

  const renderItem = (item: Product) => {
    const wishlistItem = wishlistItems?.find(w => w.product.id === item.id);
    const productCard = {
      id: item.id,
      name: item.name,
      image: item.image,
      soldCount: item.soldCount || 0,
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

  const renderLoadingPlaceholders = () => {
    const dummyProducts = Array.from({ length: 6 }, (_, i) => ({ id: i }));
    const leftColumn = dummyProducts.filter((_, i) => i % 2 === 0);
    const rightColumn = dummyProducts.filter((_, i) => i % 2 !== 0);

    const renderDummyCard = (item: any) => (
      <View key={`loading-${item.id}`} style={styles.masonryItem}>
        <View style={[styles.dummyCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.cardBorder }]}>
          <View style={[styles.dummyImageContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
            <Image
              source={require('../../../assets/af_home_logo.png')}
              style={{ width: 40, height: 40 }}
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

  return (
    <View style={{ flex: 1 }}>
      {/* Voucher Section */}
      <View style={[styles.voucherSectionContainer, { backgroundColor: isDarkMode ? '#1e293b' : Colors.white, borderColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }]}>
        <View style={styles.voucherHeader}>
          <View style={styles.voucherContent}>
            <Text style={[styles.voucherTitle, { color: themeColors.text }]}>Special Offers</Text>
            <Text style={[styles.voucherSubtitle, { color: themeColors.textSecondary }]}>Check out available vouchers</Text>
          </View>
          <Ionicons name="ticket-outline" size={24} color={Colors.sky} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vouchersGrid}
        >
          {STATIC_VOUCHERS.map((voucher) => (
            <View key={voucher.id} style={[styles.voucherCard, { backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb' }]}>
              <View style={styles.voucherCardLeft}>
                <View style={styles.discountBox}>
                  <Text style={styles.discountText}>{voucher.discount}</Text>
                  <Text style={styles.discountLabel}>OFF</Text>
                </View>
              </View>

              <View style={styles.voucherCardDivider} />

              <View style={styles.voucherCardRight}>
                <Text style={[styles.voucherCardDesc, { color: themeColors.text }]} numberOfLines={1}>
                  {voucher.description}
                </Text>
                <Text style={[styles.voucherCardCode, { color: themeColors.textSecondary }]}>
                  {voucher.code}
                </Text>
                <Text style={[styles.voucherCardMinSpend, { color: themeColors.textSecondary }]}>
                  Min. {voucher.minSpend}
                </Text>
                <Pressable
                  style={[styles.copyButton, { backgroundColor: copiedCode === voucher.code ? '#dcfce7' : '#e0f2fe' }]}
                  onPress={() => handleCopyCode(voucher.code)}
                >
                  <Ionicons
                    name={copiedCode === voucher.code ? 'checkmark' : 'copy'}
                    size={14}
                    color={copiedCode === voucher.code ? '#16a34a' : Colors.sky}
                  />
                  <Text style={[styles.copyButtonText, { color: copiedCode === voucher.code ? '#16a34a' : Colors.sky }]}>
                    {copiedCode === voucher.code ? 'Copied' : 'Copy'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {featuredProducts.length > 0 && (
        <View style={[styles.featuredSection, { backgroundColor: isDarkMode ? '#1e293b' : Colors.white, borderColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }]}>
          <View style={[styles.featuredHeaderRow, { borderBottomColor: isDarkMode ? '#334155' : '#eef2f7' }]}>
            <View>
              <Text style={[styles.featuredTitle, { color: themeColors.text }]}>Featured Products</Text>
            </View>
            <TouchableOpacity onPress={onSeeMore}>
              <Text style={[styles.seeMoreText, { color: Colors.sky }]}>See More</Text>
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
              resizeMode="cover"
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
                  backgroundColor: currentBannerIndex === index ? Colors.sky : '#cbd5e1',
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Best Products Section */}
      {products.length > 0 && (
        <View style={[styles.bestProductsSection, { backgroundColor: isDarkMode ? '#1e293b' : Colors.white, borderColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }]}>
          <View style={[styles.bestProductsHeader, { borderBottomColor: isDarkMode ? '#334155' : '#eef2f7' }]}>
            <Text style={[styles.bestProductsTitle, { color: themeColors.text }]}>Best Products</Text>
            <TouchableOpacity onPress={onSeeMore}>
              <Text style={[styles.seeMoreText, { color: Colors.sky }]}>See More</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bestProductsGrid}
          >
            {products.slice(0, 4).map((item) => renderFeaturedItem(item))}
          </ScrollView>
        </View>
      )}

      {/* Best Products Banner */}
      <Image
        source={{ uri: 'https://img.pikbest.com/origin/10/01/82/867pIkbEsTAIq.png!w700wp' }}
        style={[styles.bestProductsBanner, { marginBottom: 8, borderRadius: 8 }]}
        resizeMode="cover"
      />

      <View style={[styles.productsSection, { backgroundColor: isDarkMode ? '#1e293b' : Colors.white, borderColor: isDarkMode ? '#334155' : '#e2e8f0', marginBottom: 8 }]}>
        {loading ? (
          renderLoadingPlaceholders()
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  voucherSectionContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  voucherHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voucherContent: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  voucherSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  vouchersGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  voucherCard: {
    width: width * 0.7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sky,
    flexDirection: 'row',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  voucherCardLeft: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBox: {
    alignItems: 'center',
  },
  discountText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.sky,
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.sky,
  },
  voucherCardDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.sky,
    opacity: 0.3,
  },
  voucherCardRight: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  voucherCardDesc: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  voucherCardCode: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  voucherCardMinSpend: {
    fontSize: 10,
    fontWeight: '400',
    marginBottom: 6,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  featuredSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  featuredHeaderRow: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  featuredGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  featuredItemWrap: {
    width: width * 0.46,
  },
  productsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: 'hidden',
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
  dummyContent: {
    padding: 12,
    gap: 6,
  },
  dummyLine: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  dummyImage: {
    width: 40,
    height: 40,
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
  bannerContainer: {
    height: 180,
    overflow: 'hidden',
    borderRadius: 8,
  },
  carouselContent: {
    alignItems: 'center',
  },
  bannerImage: {
    width: width,
    height: 180,
  },
  carouselIndicators: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bestProductsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bestProductsHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bestProductsTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bestProductsGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'stretch',
  },
  bestProductsItemWrap: {
    width: width * 0.46,
  },
  bestProductsBanner: {
    width: '100%',
    height: 150,
  },
});
