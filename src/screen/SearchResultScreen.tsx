import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import ItemCard from '../components/Items/ItemCard';
import Toast from 'react-native-toast-message';
import type { ProductCard } from '../services/productService';

const { width } = Dimensions.get('window');

interface SearchResultScreenProps {
  token?: string | null;
  query: string;
  onBack?: () => void;
  onProductPress?: (product: ProductCard) => void;
}

export default function SearchResultScreen({
  token,
  query,
  onBack,
  onProductPress,
}: SearchResultScreenProps) {
  const [products, setProducts] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchResults = useCallback(async () => {
    if (!token || !query.trim()) {
      setProducts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_CONFIG.BASE_URL}/search/live`, {
        params: { q: query.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data?.success && Array.isArray(res.data?.data)) {
        const mapped: ProductCard[] = res.data.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          image: item.image || '',
          soldCount: 0,
          originalPrice: item.original_price,
          memberPrice: item.discounted_price,
          pv: item.pv,
          brandName: item.brand_name || '',
          variantCount: item.badges?.variant_count ?? 0,
          badges: {
            musthave: item.badges?.musthave ?? false,
            bestseller: item.badges?.bestseller ?? false,
            salespromo: item.has_discount ?? false,
          },
        }));
        console.log('🔍 Search Results:', {
          count: mapped.length,
          firstItem: mapped[0] && { id: mapped[0].id, name: mapped[0].name, hasImage: !!mapped[0].image, imageLength: mapped[0].image?.length },
        });
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Search Failed',
        text2: error.message || 'Unable to load search results',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, query]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  useEffect(() => {
    const onBackPress = () => {
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [onBack]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchResults();
  };

  const masonryColumns = useMemo(() => {
    const leftColumn: ProductCard[] = [];
    const rightColumn: ProductCard[] = [];
    
    products.forEach((product, index) => {
      if (index % 2 === 0) {
        leftColumn.push(product);
      } else {
        rightColumn.push(product);
      }
    });
    
    return { leftColumn, rightColumn };
  }, [products]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Search Results</Text>
            <Text style={styles.headerQuery}>"{query}"</Text>
          </View>
        </View>
        <Text style={styles.headerCount}>{products.length} items</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>No results found for "{query}"</Text>
            </View>
          ) : (
            <View style={styles.masonryGrid}>
              <View style={styles.masonryColumn}>
                {masonryColumns.leftColumn.map((product) => (
                  <View key={`search-${product.id}`} style={styles.productItem}>
                    <ItemCard product={product} onPress={onProductPress} token={token} />
                  </View>
                ))}
              </View>
              <View style={styles.masonryColumn}>
                {masonryColumns.rightColumn.map((product) => (
                  <View key={`search-${product.id}`} style={styles.productItem}>
                    <ItemCard product={product} onPress={onProductPress} token={token} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerQuery: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  masonryGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  productItem: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
