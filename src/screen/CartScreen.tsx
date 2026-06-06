import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  Animated,
  BackHandler,
  Modal,
  Pressable,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { ChatBotIcon } from '../components/ChatBot';
import ConfirmationModal from '../components/ConfirmationModal/ConfirmationModal';
import { Colors } from '../constants/colors';
import Toast from 'react-native-toast-message';
import { userBehaviorService } from '../services/userBehaviorService';
import { productService } from '../services/productService';

interface CartItem {
  crt_id: number;
  crt_customer_id: number;
  crt_product_id: number;
  crt_variant_id: number | null;
  crt_quantity: number;
  crt_selected_color: string | null;
  crt_selected_size: string | null;
  crt_selected_type: string | null;
  crt_unit_price: string;
  crt_total_price: string;
  crt_status: string;
  crt_created_at: string;
  crt_updated_at: string;
  product_name: string;
  product_image: string;
  product_price_srp: string;
  product_price_dp: string;
  product_price_member: string;
  product_prodpv: string;
  brand_name: string;
  // New variant fields from API
  variant_id: number | null;
  variant_name: string | null;
  variant_price: string | null;
  variant_price_dp: string | null;
  variant_price_member: string | null;
  variant_prodpv: string | null;
  variant_color: string | null;
  variant_size: string | null;
  variant_image: string | null;
  variant_status: number | null;
}

const hashBrandName = (brandName: string): number => {
  let hash = 0;
  for (let i = 0; i < brandName.length; i++) {
    const char = brandName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const getBrandLogo = (brandName: string, brands: BrandItem[]): string | null => {
  const brand = brands.find(b => b.name === brandName);
  if (!brand) return null;
  return brand.logo || (brand as any).brand_image || (brand as any).image || null;
};

interface BrandItem {
  id: number;
  name: string;
  logo: string;
}

interface CartVariant {
  id: number;
  name: string;
  color?: string;
  size?: string;
  price: string;
  price_dp?: string;
  price_member?: string;
  prodpv?: string;
  image?: string;
  colorHex?: string;
}

interface CartScreenProps {
  token?: string | null;
  user?: {
    name: string;
    username?: string;
    avatar_url?: string;
    badge_name?: string;
  } | null;
  onCheckout?: (selectedItems: CartItem[]) => void;
  onBack?: () => void;
  onProductPress?: (productId: number) => void;
  onProfilePress?: () => void;
  onWishlistPress?: () => void;
  onShopNavigate?: (brandId: number, shopName: string) => void;
  brands?: BrandItem[];
  wishlistCount?: number;
  isDarkMode?: boolean;
  refreshTrigger?: number;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const VARIANT_MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

export default function CartScreen({ token, user, onCheckout, onBack, onProductPress, onProfilePress, onWishlistPress, onShopNavigate, brands = [], wishlistCount = 0, isDarkMode = false, refreshTrigger = 0 }: CartScreenProps) {
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [updatingQuantity, setUpdatingQuantity] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<number | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string; productId: number } | null>(null);

  // Variant modal state
  const [variantModalOpen, setVariantModalOpen] = useState<number | null>(null);
  const [variantsList, setVariantsList] = useState<CartVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [updatingVariant, setUpdatingVariant] = useState<number | null>(null);
  const [variantImageCache, setVariantImageCache] = useState<{ [key: number]: { [key: number]: string } }>({});
  const cartOrderRef = useRef<Record<number, number>>({});
  const variantModalTranslateY = useRef(new Animated.Value(VARIANT_MODAL_HEIGHT)).current;
  const variantPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) {
          variantModalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(variantModalTranslateY, {
            toValue: VARIANT_MODAL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setVariantModalOpen(null));
        } else {
          Animated.spring(variantModalTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f5f5f5',
    containerBg: isDarkMode ? '#111827' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#374151' : '#f1f5f9',
    cardBg: isDarkMode ? '#1f2937' : '#f8fafc',
    hint: isDarkMode ? '#1e293b' : '#f9fafb',
  };

  const openProductDetails = (productId: number) => {
    onProductPress?.(productId);
  };

  const getCartItemActivityTime = (item: CartItem) => {
    const updatedAt = new Date(item.crt_updated_at || item.crt_created_at).getTime();
    const createdAt = new Date(item.crt_created_at).getTime();
    return Number.isNaN(updatedAt) ? createdAt : updatedAt;
  };

  const updateCartItemInState = (crtId: number, updater: (item: CartItem) => CartItem) => {
    setCartItems(prevItems => prevItems.map(item => (item.crt_id === crtId ? updater(item) : item)));
  };

  const getOrderedCartItems = (items: CartItem[]) => {
    const sortedItems = [...items].sort((a, b) => {
      const timeB = getCartItemActivityTime(b);
      const timeA = getCartItemActivityTime(a);
      if (timeB !== timeA) return timeB - timeA;
      return b.crt_id - a.crt_id;
    });

    cartOrderRef.current = sortedItems.reduce<Record<number, number>>((orderMap, item, index) => {
      orderMap[item.crt_id] = index;
      return orderMap;
    }, {});

    return sortedItems;
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('[CartScreen] Refresh triggered, fetching cart...');
      fetchCart();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack?.();
      return true;
    });

    return () => sub.remove();
  }, [onBack]);

  useEffect(() => {
    if (variantModalOpen !== null) {
      // Animate modal into view
      Animated.spring(variantModalTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset modal position when closing
      variantModalTranslateY.setValue(VARIANT_MODAL_HEIGHT);
    }
  }, [variantModalOpen, variantModalTranslateY]);

  const fetchVariantImagesForCart = async (items: CartItem[]) => {
    try {
      const uniqueProductIds = new Set<number>();
      items.forEach(item => {
        if (item.crt_variant_id && !item.variant_image && item.crt_product_id) {
          uniqueProductIds.add(item.crt_product_id);
        }
      });

      if (uniqueProductIds.size === 0) return;

      const newImageCache = { ...variantImageCache };

      for (const productId of uniqueProductIds) {
        if (newImageCache[productId]) continue;

        try {
          const product = await productService.getProductById(productId, token ?? undefined);
          const variants = product.variants || [];
          const imageCache: { [key: number]: string } = {};

          variants.forEach((v: any) => {
            if (v.id && (v.images?.[0] || v.image)) {
              imageCache[v.id] = v.images?.[0] || v.image;
            }
          });

          if (Object.keys(imageCache).length > 0) {
            newImageCache[productId] = imageCache;
          }
        } catch (error) {
          console.error(`Error fetching variants for product ${productId}:`, error);
        }
      }

      if (Object.keys(newImageCache).length > 0) {
        setVariantImageCache(newImageCache);
      }
    } catch (error) {
      console.error('Error fetching variant images:', error);
    }
  };

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextCartItems = getOrderedCartItems(response.data.cart_items || []);
      setCartItems(nextCartItems);
      setSelectedItems(prevSelected => {
        const nextIds = new Set(nextCartItems.map(item => item.crt_id));
        return new Set([...prevSelected].filter(id => nextIds.has(id)));
      });

      // Fetch variant images for items that have variant_id but missing variant_image
      await fetchVariantImagesForCart(nextCartItems);
    } catch (error: any) {
      console.error('Error fetching cart:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load cart',
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await fetchCart();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectItem = (crtId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(crtId)) {
      newSelected.delete(crtId);
    } else {
      newSelected.add(crtId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(cartItems.map(item => item.crt_id));
      setSelectedItems(allIds);
    }
  };

  const handleUpdateQuantity = async (crtId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    let snapshot: CartItem | null = null;
    try {
      setUpdatingQuantity(crtId);
      const cartItem = cartItems.find(item => item.crt_id === crtId);

      if (!cartItem) return;

      snapshot = { ...cartItem };
      updateCartItemInState(crtId, item => ({
        ...item,
        crt_quantity: newQuantity,
        crt_total_price: (parseFloat(item.crt_unit_price) * newQuantity).toString(),
        crt_updated_at: new Date().toISOString(),
      }));

      // Use the new variant update endpoint
      await axios.put(
        `${API_CONFIG.BASE_URL}/cart/${crtId}/variant`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      if (snapshot) {
        updateCartItemInState(crtId, () => snapshot as CartItem);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update quantity',
      });
    } finally {
      setUpdatingQuantity(null);
    }
  };

  const handleRemoveItem = (crtId: number) => {
    const item = cartItems.find(c => c.crt_id === crtId);
    const productName = item?.product_name || 'this item';

    setItemToDelete({ id: crtId, name: productName, productId: item?.crt_product_id || 0 });
    setConfirmDeleteModal(true);
  };

  const fetchProductVariants = async (productId: number) => {
    try {
      setLoadingVariants(true);
      const product = await productService.getProductById(productId, token ?? undefined);
      const variants = product.variants || [];

      // Transform product variants to CartVariant format and cache images
      const formattedVariants: CartVariant[] = variants.map((v: any) => ({
        id: v.id,
        name: v.name || v.variant_name || '',
        color: v.color || v.variant_color,
        size: v.size || v.variant_size,
        price: v.priceMember || v.price || '0',
        price_dp: v.priceDp || v.price_dp,
        price_member: v.priceMember || v.price_member,
        prodpv: v.prodpv,
        image: v.images?.[0] || v.image,
        colorHex: v.colorHex || v.color_hex,
      }));

      // Cache variant images
      const imageCache: { [key: number]: string } = {};
      variants.forEach((v: any) => {
        if (v.id && (v.images?.[0] || v.image)) {
          imageCache[v.id] = v.images?.[0] || v.image;
        }
      });

      setVariantImageCache(prev => ({
        ...prev,
        [productId]: imageCache,
      }));

      setVariantsList(formattedVariants);
    } catch (error: any) {
      console.error('Error fetching variants:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load variants',
      });
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleVariantPress = (crtId: number, productId: number) => {
    setVariantModalOpen(crtId);
    fetchProductVariants(productId);
  };

  const handleVariantSelect = async (crtId: number, variantId: number) => {
    if (!token) return;

    let snapshot: CartItem | null = null;
    try {
      setUpdatingVariant(crtId);
      const cartItem = cartItems.find(item => item.crt_id === crtId);

      if (!cartItem) return;

      snapshot = { ...cartItem };

      // Use the new variant update endpoint
      const updatePayload: any = {
        variant_id: variantId,
      };

      const selectedVariant = variantsList.find(v => v.id === variantId);
      if (selectedVariant) {
        updateCartItemInState(crtId, item => ({
          ...item,
          crt_variant_id: variantId,
          crt_unit_price: selectedVariant.price_member || selectedVariant.price_dp || selectedVariant.price,
          crt_total_price: (parseFloat(selectedVariant.price_member || selectedVariant.price_dp || selectedVariant.price) * item.crt_quantity).toString(),
          crt_updated_at: new Date().toISOString(),
          variant_id: variantId,
          variant_name: selectedVariant.name,
          variant_color: selectedVariant.color,
          variant_size: selectedVariant.size,
          variant_image: selectedVariant.image,
        }));
      }

      await axios.put(
        `${API_CONFIG.BASE_URL}/cart/${crtId}/variant`,
        updatePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVariantModalOpen(null);

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Variant updated',
      });
    } catch (error: any) {
      console.error('Error updating variant:', error);
      if (snapshot) {
        updateCartItemInState(crtId, () => snapshot as CartItem);
      }
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update variant',
      });
    } finally {
      setUpdatingVariant(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { id: crtId, name: productName, productId } = itemToDelete;

    try {
      setRemovingItem(crtId);
      setConfirmDeleteModal(false);

      await axios.delete(`${API_CONFIG.BASE_URL}/cart/${crtId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems(cartItems.filter(item => item.crt_id !== crtId));
      delete cartOrderRef.current[crtId];
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(crtId);
        return newSet;
      });

      // Track cart remove behavior
      if (token && productId) {
        userBehaviorService.trackBehavior(token, 'cart_remove', productId).catch(() => {});
      }

      Toast.show({
        type: 'success',
        text1: 'Removed',
        text2: 'Item removed from cart',
      });
    } catch (error: any) {
      console.error('Error removing item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
      });
    } finally {
      setRemovingItem(null);
      setItemToDelete(null);
    }
  };

  const getGroupedCartItems = useMemo(() => {
    // Group items by brand
    const grouped: { [key: string]: CartItem[] } = {};
    cartItems.forEach(item => {
      const brand = item.brand_name || 'Unknown Brand';
      if (!grouped[brand]) {
        grouped[brand] = [];
      }
      grouped[brand].push(item);
    });

    // Sort items within each group by latest cart activity
    Object.keys(grouped).forEach(brand => {
      grouped[brand].sort((a, b) => {
        const timeB = getCartItemActivityTime(b);
        const timeA = getCartItemActivityTime(a);
        if (timeB !== timeA) return timeB - timeA;
        return b.crt_id - a.crt_id;
      });
    });

    // Sort brands by the most recently active item in the group
    const sortedBrands = Object.keys(grouped).sort((brandA, brandB) => {
      const brandATime = grouped[brandA].reduce((max, item) => {
        const time = getCartItemActivityTime(item);
        return Math.max(max, time);
      }, 0);
      const brandBTime = grouped[brandB].reduce((max, item) => {
        const time = getCartItemActivityTime(item);
        return Math.max(max, time);
      }, 0);
      return brandBTime - brandATime;
    });

    // Rebuild grouped object with sorted brands
    const sortedGrouped: { [key: string]: CartItem[] } = {};
    sortedBrands.forEach(brand => {
      sortedGrouped[brand] = grouped[brand];
    });

    return sortedGrouped;
  }, [cartItems]);

  const getSortedCartItems = useMemo(() => {
    const flattened: CartItem[] = [];
    Object.keys(getGroupedCartItems).forEach(brand => {
      flattened.push(...getGroupedCartItems[brand]);
    });
    return flattened;
  }, [getGroupedCartItems]);

  const getSelectedTotal = useMemo(() => {
    return Array.from(selectedItems).reduce((total, crtId) => {
      const item = cartItems.find(c => c.crt_id === crtId);
      return total + (item ? parseFloat(item.crt_total_price) : 0);
    }, 0);
  }, [selectedItems, cartItems]);

  const getCartItemsWithBrandHeaders = useMemo(() => {
    const itemsWithHeaders: (CartItem & { isBrandHeader?: boolean })[] = [];
    let headerIndex = 0;

    Object.keys(getGroupedCartItems).forEach(brand => {
      // Add brand header with stable key
      itemsWithHeaders.push({
        crt_id: -1 - headerIndex++,
        brand_name: brand,
        isBrandHeader: true,
      } as CartItem & { isBrandHeader: boolean });

      // Add items in this group
      itemsWithHeaders.push(...getGroupedCartItems[brand]);
    });

    return itemsWithHeaders;
  }, [getGroupedCartItems]);

  const brandItemsMap = useMemo(() => {
    const map = new Map<string, number[]>();
    cartItems.forEach(item => {
      const brand = item.brand_name || 'Unknown Brand';
      if (!map.has(brand)) {
        map.set(brand, []);
      }
      map.get(brand)!.push(item.crt_id);
    });
    return map;
  }, [cartItems]);

  const handleBrandSelectAll = (brandName: string) => {
    const brandItemIds = brandItemsMap.get(brandName);
    if (!brandItemIds) return;

    const newSelected = new Set(selectedItems);
    const allSelected = brandItemIds.every(id => newSelected.has(id));

    if (allSelected) {
      brandItemIds.forEach(id => newSelected.delete(id));
    } else {
      brandItemIds.forEach(id => newSelected.add(id));
    }

    setSelectedItems(newSelected);
  };

  const isBrandFullySelected = (brandName: string) => {
    const brandItemIds = brandItemsMap.get(brandName);
    return brandItemIds ? brandItemIds.length > 0 && brandItemIds.every(id => selectedItems.has(id)) : false;
  };

  const renderCartItem = ({ item, index }: { item: CartItem & { isBrandHeader?: boolean }, index?: number }) => {
    if (item.isBrandHeader) {
      const isSelected = isBrandFullySelected(item.brand_name || '');
      const isFirstBrand = index === 0;
      return (
        <View style={[styles.brandHeader, { backgroundColor: colors.containerBg, borderBottomColor: colors.border, marginTop: isFirstBrand ? 0 : 12 }]}>
          <TouchableOpacity
            style={styles.brandCheckbox}
            onPress={() => handleBrandSelectAll(item.brand_name || '')}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.checkboxBox, { borderColor: colors.border }, isSelected && styles.checkboxBoxChecked]}>
              {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.brandHeaderContent}
            onPress={() => {
              if (onShopNavigate) {
                const brandName = item.brand_name || '';
                const brandItems = cartItems.filter(c => c.brand_name === brandName);

                // Try multiple sources for brand ID
                let brandId = (brandItems[0] as any)?.brand_id;
                if (!brandId) {
                  const brand = brands.find(b => b.name === brandName);
                  brandId = brand?.id;
                }
                if (!brandId) {
                  brandId = Math.abs(hashBrandName(brandName));
                }

                console.log('[CartScreen] Brand clicked:', { brandName, brandId, fromItem: (brandItems[0] as any)?.brand_id, fromBrandsArray: brands.find(b => b.name === brandName)?.id, availableBrands: brands.length });
                onShopNavigate(brandId, brandName);
              }
            }}
            activeOpacity={0.7}
          >
            {(() => {
              const logoUrl = getBrandLogo(item.brand_name || '', brands);
              return logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border }}
                />
              ) : (
                <Ionicons name="storefront" size={16} color={Colors.sky} />
              );
            })()}
            <Text style={[styles.brandHeaderText, { color: colors.text }]}>{item.brand_name}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSec} />
          </TouchableOpacity>
        </View>
      );
    }
    const discount = Math.round(
      ((parseFloat(item.product_price_srp) - parseFloat(item.crt_unit_price)) / parseFloat(item.product_price_srp)) * 100
    );
    
    // Check both old and new variant fields for compatibility
    const hasVariants = !!(
      item.crt_selected_color || 
      item.crt_selected_size || 
      item.crt_selected_type ||
      item.variant_color || 
      item.variant_size || 
      item.variant_name
    );

    return (
        <View style={[
          styles.cartItemContainer,
          { backgroundColor: colors.containerBg },
          selectedItems.has(item.crt_id) && { backgroundColor: isDarkMode ? '#1e293b' : '#f0f7ff' },
        ]}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.crt_id)}
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.checkboxBox, { borderColor: colors.border }, selectedItems.has(item.crt_id) && styles.checkboxBoxChecked]}>
            {selectedItems.has(item.crt_id) && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </Animated.View>
        </TouchableOpacity>

        <View
          style={styles.contentWrapper}
        >
          {/* Image Container */}
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => openProductDetails(item.crt_product_id)}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: (() => {
                  if (item.variant_image && item.variant_image.trim()) {
                    return item.variant_image;
                  }
                  const variantId = item.crt_variant_id || item.variant_id;
                  if (variantId && variantImageCache[item.crt_product_id]?.[variantId]) {
                    return variantImageCache[item.crt_product_id][variantId];
                  }
                  return item.product_image;
                })()
              }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Details Container */}
          <View style={styles.detailsContainer}>
            {/* Brand & Name with Total Price */}
            <View style={styles.brandNameRow}>
              <Text style={[styles.brand, { color: colors.textSec }]} numberOfLines={1}>{item.brand_name}</Text>
              {item.crt_quantity > 1 && (
                <Text style={[styles.itemPrice, { color: Colors.sky }]}>₱{parseFloat(item.crt_total_price).toLocaleString()}</Text>
              )}
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => openProductDetails(item.crt_product_id)}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.product_name}</Text>
            </TouchableOpacity>

            {/* Variants Display with Quantity */}
            {hasVariants && (
              <View style={styles.variantQuantityRow}>
                <TouchableOpacity
                  style={[styles.variantDropdown, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1 }]}
                  onPress={() => handleVariantPress(item.crt_id, item.crt_product_id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.variantDropdownContent}>
                    {/* Display variant color from new API fields */}
                    {item.variant_color && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="color-palette" size={11} color={Colors.sky} /> {item.variant_color}
                      </Text>
                    )}
                    {/* Fallback to old fields for compatibility */}
                    {!item.variant_color && item.crt_selected_color && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="color-palette" size={11} color={Colors.sky} /> {item.crt_selected_color}
                      </Text>
                    )}

                    {/* Display variant size from new API fields */}
                    {item.variant_size && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="resize" size={11} color={Colors.sky} /> {item.variant_size}
                      </Text>
                    )}
                    {/* Fallback to old fields for compatibility */}
                    {!item.variant_size && item.crt_selected_size && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="resize" size={11} color={Colors.sky} /> {item.crt_selected_size}
                      </Text>
                    )}

                    {/* Display variant name from new API fields */}
                    {item.variant_name && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="cube" size={11} color={Colors.sky} /> {item.variant_name}
                      </Text>
                    )}
                    {/* Fallback to old fields for compatibility */}
                    {!item.variant_name && item.crt_selected_type && (
                      <Text style={styles.variantDropdownText}>
                        <Ionicons name="cube" size={11} color={Colors.sky} /> {item.crt_selected_type}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={14} color={Colors.sky} />
                </TouchableOpacity>

                {/* Quantity Control */}
                <View style={styles.quantityControlCompact}>
                  <TouchableOpacity
                    style={[styles.quantityBtnSmall, { borderColor: colors.border, backgroundColor: colors.bg }]}
                    onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity - 1)}
                    disabled={updatingQuantity === item.crt_id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={10} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityTextCompact, { color: colors.text }]}>{item.crt_quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityBtnSmall, { borderColor: colors.border, backgroundColor: colors.bg }]}
                    onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity + 1)}
                    disabled={updatingQuantity === item.crt_id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={10} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Price Row for Variant Items */}
            {hasVariants && (
              <View style={styles.priceRow}>
                <Text style={[styles.memberPrice, { color: colors.text }]}>₱{parseFloat(item.crt_unit_price).toLocaleString()}</Text>
                {discount > 0 && item.product_price_srp && (
                  <Text style={[styles.srpPrice, { color: colors.textSec }]}>₱{parseFloat(item.product_price_srp).toLocaleString()}</Text>
                )}
              </View>
            )}

            {/* Price and Quantity Row - Only show if no variants */}
            {!hasVariants && (
              <View style={styles.priceQuantityRow}>
                <View style={[styles.priceRow, { flex: 1 }]}>
                  <Text style={[styles.memberPrice, { color: colors.text }]}>₱{parseFloat(item.crt_unit_price).toLocaleString()}</Text>
                  {discount > 0 && item.product_price_srp && (
                    <Text style={[styles.srpPrice, { color: colors.textSec }]}>₱{parseFloat(item.product_price_srp).toLocaleString()}</Text>
                  )}
                </View>

                {/* Quantity Control for items without variants */}
                <View style={[styles.quantityControlCompact, { marginLeft: 8 }]}>
                  <TouchableOpacity
                    style={[styles.quantityBtnSmall, { borderColor: colors.border, backgroundColor: colors.bg }]}
                    onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity - 1)}
                    disabled={updatingQuantity === item.crt_id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={10} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.quantityTextCompact, { color: colors.text }]}>{item.crt_quantity}</Text>
                  <TouchableOpacity
                    style={[styles.quantityBtnSmall, { borderColor: colors.border, backgroundColor: colors.bg }]}
                    onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity + 1)}
                    disabled={updatingQuantity === item.crt_id}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={10} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Badge Row with Remove Button */}
            <View style={styles.badgeRow}>
              <LinearGradient
                colors={[Colors.sky, Colors.skyDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pvBadge}
              >
                <Ionicons name="trending-up" size={9} color={Colors.white} />
                <Text style={styles.pvText}>{parseFloat(item.product_prodpv).toLocaleString()} PV</Text>
              </LinearGradient>

              {/* Remove Button */}
              <TouchableOpacity
                style={[styles.removeBtn, removingItem === item.crt_id && { opacity: 0.6 }]}
                onPress={() => handleRemoveItem(item.crt_id)}
                disabled={removingItem === item.crt_id}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={14} color={colors.textSec} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </View>
    );
  };

  const renderHiddenItem = (data: { item: CartItem & { isBrandHeader?: boolean } }) => {
    const item = data.item;
    if (item.isBrandHeader) return <View />;
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backLeftBtn, styles.backLeftBtnLeft]}
          onPress={() => {
            onCheckout?.([item]);
          }}
        >
          <View style={styles.cartActionInner}>
            <Ionicons name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.backTextWhite}>Checkout</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => handleRemoveItem(item.crt_id)}
          disabled={removingItem === item.crt_id}
        >
          <View style={styles.deleteActionInner}>
            <Ionicons name="trash-outline" size={20} color={Colors.white} />
            <Text style={styles.backTextWhite}>Delete</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, position: 'relative' }}>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header with Background Image */}
        <View style={[styles.headerBackground, { borderBottomColor: colors.border }]}>
          <Image
            source={require('../../assets/cart_bg.png')}
            style={styles.headerBackgroundImage}
            resizeMode="cover"
          />
          <View style={[styles.headerContent, { paddingTop: insets.top }]}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: Colors.white }]}>My Cart</Text>

            {/* Wishlist Icon */}
            <TouchableOpacity
              style={styles.headerIcon}
              activeOpacity={0.7}
              onPress={onWishlistPress}
            >
              <Ionicons name="heart-outline" size={20} color={Colors.white} />
              {wishlistCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                  <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Content */}
        <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      </View>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={{ flex: 1, position: 'relative' }}>
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
          {/* Header with Background Image */}
          <View style={[styles.headerBackground, { borderBottomColor: colors.border }]}>
            <Image
              source={require('../../assets/cart_bg.png')}
              style={styles.headerBackgroundImage}
              resizeMode="cover"
            />
            <View style={[styles.headerContent, { paddingTop: insets.top }]}>
              <TouchableOpacity
                style={styles.headerIcon}
                onPress={onBack}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back-outline" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: Colors.white }]}>My Cart</Text>

              {/* Wishlist Icon */}
              <TouchableOpacity
                style={styles.headerIcon}
                activeOpacity={0.7}
                onPress={onWishlistPress}
              >
                <Ionicons name="heart-outline" size={20} color={Colors.white} />
                {wishlistCount > 0 && (
                  <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                    <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Empty State Content */}
          <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
            <Ionicons name="cart-outline" size={64} color={isDarkMode ? '#64748b' : Colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>Add items to get started shopping</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with Background Image */}
      <View style={[styles.headerBackground, { borderBottomColor: colors.border }]}>
        <Image
          source={require('../../assets/cart_bg.png')}
          style={styles.headerBackgroundImage}
          resizeMode="cover"
        />
        <View style={[styles.headerContent, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: Colors.white }]}>My Cart</Text>

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={styles.headerIcon}
            activeOpacity={0.7}
            onPress={onWishlistPress}
          >
            <Ionicons name="heart-outline" size={20} color={Colors.white} />
            {wishlistCount > 0 && (
              <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>


      {/* Cart Items */}
      <SwipeListView
        data={getCartItemsWithBrandHeaders}
        renderItem={renderCartItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={0}
        rightOpenValue={0}
        disableLeftSwipe={true}
        disableRightSwipe={true}
        useNativeDriver={false}
        keyExtractor={(item) => item.isBrandHeader ? `brand-${item.brand_name}` : item.crt_id.toString()}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.bg }]}
        scrollEnabled={true}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        updateCellsBatchingPeriod={50}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.sky]}
            tintColor={Colors.sky}
          />
        }
      />

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.containerBg, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.footerLeft}>
          <TouchableOpacity
            style={styles.selectAllBtn}
            onPress={handleSelectAll}
            activeOpacity={0.7}
          >
            <View style={[styles.selectAllCheckbox, { borderColor: colors.border }, selectedItems.size > 0 && styles.selectAllCheckboxChecked]}>
              {selectedItems.size > 0 && (
                <Ionicons name="checkmark" size={14} color={Colors.white} />
              )}
            </View>
            <Text style={[styles.selectAllText, selectedItems.size > 0 && styles.selectAllTextActive, { color: colors.text }]}>
              {selectedItems.size > 0 ? `${selectedItems.size} selected` : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerRight}>
          <Text style={[styles.totalPrice, selectedItems.size > 0 ? { color: colors.text } : { color: colors.textSec }]}>
            ₱{selectedItems.size > 0 ? getSelectedTotal.toLocaleString() : '0'}
          </Text>
          <TouchableOpacity
            style={[styles.checkoutBtn, selectedItems.size === 0 && { opacity: 0.5 }]}
            onPress={() => {
              console.log('[CartScreen] ===== CHECKOUT BUTTON PRESSED =====');
              console.log('[CartScreen] selectedItems.size:', selectedItems.size);
              console.log('[CartScreen] cartItems.length:', cartItems.length);

              if (selectedItems.size === 0) {
                console.log('[CartScreen] No items selected, returning early');
                return;
              }

              console.log('[CartScreen] Starting to map selected items...');
              const selectedItemsList = Array.from(selectedItems).map((crtId, index) => {
                console.log(`[CartScreen] Processing selected item ${index}, crtId:`, crtId);
                const cartItem = cartItems.find(item => item.crt_id === crtId);

                if (!cartItem) {
                  console.warn('[CartScreen] Cart item not found for crtId:', crtId);
                  return null;
                }

                console.log(`[CartScreen] Found cart item ${index}:`, {
                  crt_id: cartItem.crt_id,
                  crt_product_id: cartItem.crt_product_id,
                  product_name: cartItem.product_name,
                  crt_quantity: cartItem.crt_quantity,
                });

                // Validate required fields
                if (!cartItem.crt_product_id || !cartItem.product_name) {
                  console.warn('[CartScreen] Skipping invalid cart item:', { crtId, crt_product_id: cartItem.crt_product_id, product_name: cartItem.product_name });
                  return null;
                }

                // Get variant image from cache if available
                const variantId = cartItem.crt_variant_id || cartItem.variant_id;
                const cachedVariantImage = variantImageCache[cartItem.crt_product_id]?.[variantId];

                const formattedItem = {
                  product_id: cartItem.crt_product_id,
                  product_name: cartItem.product_name,
                  product_image: cartItem.product_image || '',
                  product_price_member: parseFloat(cartItem.product_price_member) || 0,
                  product_price_srp: parseFloat(cartItem.product_price_srp) || 0,
                  quantity: cartItem.crt_quantity || 1,
                  variant_color: cartItem.variant_color || undefined,
                  variant_size: cartItem.variant_size || undefined,
                  variant_image: cartItem.variant_image || cachedVariantImage || undefined,
                  brand_name: cartItem.brand_name || 'Unknown Brand',
                };

                console.log(`[CartScreen] Formatted item ${index}:`, formattedItem);
                return formattedItem;
              }).filter((item): item is any => {
                const isValid = item !== null;
                console.log('[CartScreen] Filter check - item valid:', isValid, 'item:', item);
                return isValid;
              });

              console.log('[CartScreen] Final selectedItemsList length:', selectedItemsList.length);
              console.log('[CartScreen] Final selectedItemsList:', JSON.stringify(selectedItemsList, null, 2));
              console.log('[CartScreen] Calling onCheckout with items...');
              onCheckout?.(selectedItemsList as any);
              console.log('[CartScreen] onCheckout called');
            }}
            disabled={selectedItems.size === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.checkoutBtnText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Variant Selection Modal */}
      <Modal
        visible={variantModalOpen !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVariantModalOpen(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setVariantModalOpen(null)}
          />
          <Animated.View
            style={[
              styles.variantModal,
              { backgroundColor: colors.containerBg },
              {
                transform: [{ translateY: variantModalTranslateY }],
              },
            ]}
            {...variantPanResponder.panHandlers}
          >
            <View style={styles.variantModalHandleContainer}>
              <View style={[styles.variantModalHandle, { backgroundColor: isDarkMode ? '#475569' : '#cbd5e1' }]} />
            </View>
            <View style={[styles.variantModalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.variantModalTitle, { color: colors.text }]}>Choose Variant</Text>
            </View>

            {loadingVariants ? (
              <View style={styles.variantLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.sky} />
              </View>
            ) : (
              <ScrollView style={styles.variantList} showsVerticalScrollIndicator={false}>
                {variantsList.map((variant, index) => {
                  const currentItem = cartItems.find(c => c.crt_id === variantModalOpen);
                  const isCurrentVariant =
                    (currentItem?.variant_id === variant.id) ||
                    (currentItem?.crt_variant_id === variant.id);

                  return (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.variantItem,
                        { borderBottomColor: colors.border },
                        index === variantsList.length - 1 && styles.variantItemLast,
                        isCurrentVariant && {
                          backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(14, 165, 233, 0.08)',
                        },
                      ]}
                      onPress={() => {
                        if (variantModalOpen !== null && !isCurrentVariant) {
                          handleVariantSelect(variantModalOpen, variant.id);
                        }
                      }}
                      activeOpacity={0.6}
                      disabled={updatingVariant === variantModalOpen}
                    >
                      {/* Variant Image or Color */}
                      <View style={[styles.variantThumbnail, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        {variant.image ? (
                          <Image
                            source={{ uri: variant.image }}
                            style={styles.variantThumbnailImage}
                            resizeMode="cover"
                          />
                        ) : variant.colorHex ? (
                          <View style={[styles.variantColorBox, { backgroundColor: variant.colorHex }]} />
                        ) : (
                          <Ionicons name="image-outline" size={20} color={colors.textSec} />
                        )}
                      </View>

                      <View style={styles.variantItemContent}>
                        <Text style={[styles.variantItemName, isCurrentVariant && { color: Colors.sky, fontWeight: '700' }, { color: colors.text }]}>
                          {variant.name}
                        </Text>
                        {(variant.color || variant.size) && (
                          <Text style={[styles.variantItemDetails, { color: colors.textSec }]}>
                            {[variant.color, variant.size].filter(Boolean).join(' • ')}
                          </Text>
                        )}
                        <Text style={[styles.variantItemPrice, { color: Colors.sky }]}>
                          ₱{parseFloat(variant.price).toLocaleString()}
                        </Text>
                      </View>
                      {isCurrentVariant && (
                        <View style={styles.variantCheckmark}>
                          <Ionicons name="checkmark-circle" size={24} color={Colors.sky} />
                        </View>
                      )}
                      {updatingVariant === variantModalOpen && (
                        <ActivityIndicator size="small" color={Colors.sky} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Confirmation Delete Modal */}
      <ConfirmationModal
        visible={confirmDeleteModal}
        title="Remove from Cart"
        message={`Are you sure you want to remove "${itemToDelete?.name}" from your cart?`}
        confirmText="Remove"
        cancelText="Cancel"
        isDestructive={true}
        isDarkMode={isDarkMode}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmDeleteModal(false);
          setItemToDelete(null);
        }}
      />
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
  },
  headerBackground: {
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    minHeight: 90,
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
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllCheckboxChecked: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectAllTextActive: {
    color: Colors.sky,
    fontWeight: '700',
  },
  listContent: {
    backgroundColor: '#f8fbff',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 16,
    gap: 0,
  },
  rowBack: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  backLeftBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
  },
  backLeftBtnLeft: {
    backgroundColor: Colors.sky,
    left: 0,
  },
  backRightBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 90,
  },
  backRightBtnRight: {
    backgroundColor: '#ef4444',
    right: 0,
  },
  cartActionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteActionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backTextWhite: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cartItemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
    alignItems: 'flex-start',
    position: 'relative',
  },
  swipeRowContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 1,
    width: 132,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 0,
  },
  checkoutSwipeAction: {
    left: 0,
    backgroundColor: '#0ea5e9',
  },
  deleteSwipeAction: {
    right: 0,
    backgroundColor: Colors.error,
  },
  swipeActionText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  containerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  containerSelected: {
    // Will be overridden by inline styles in JSX
  },
  checkbox: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  contentWrapper: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    zIndex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
    flexShrink: 0,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  detailsContainer: {
    flex: 1,
    gap: 5,
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  brandNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
  },
  variantQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  variantDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 8,
  },
  variantDropdownContent: {
    flex: 1,
    gap: 3,
  },
  variantDropdownText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.sky,
    lineHeight: 14,
  },
  quantityControlCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  quantityBtnSmall: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityTextCompact: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  priceQuantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  memberPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  srpPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  pvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pvText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  priceRemoveRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quantityBtn: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.sky,
    minWidth: 60,
    textAlign: 'right',
  },
  removeBtn: {
    padding: 4,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 0,
  },
  footerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalSection: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  checkoutBtn: {
    backgroundColor: Colors.sky,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  swipeHintText: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  brandHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
  },
  brandCheckbox: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalOverlay: {
    flex: 1,
  },
  variantModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: VARIANT_MODAL_HEIGHT,
    width: '100%',
    paddingBottom: 20,
    overflow: 'hidden',
  },
  variantModalHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  variantModalHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
  },
  variantModalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    alignItems: 'flex-start',
  },
  variantModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  variantLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  variantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  variantItemLast: {
    borderBottomWidth: 0,
  },
  variantThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  variantThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  variantColorBox: {
    width: 48,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  variantItemContent: {
    flex: 1,
  },
  variantItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  variantItemDetails: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  variantItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.sky,
  },
  variantCheckmark: {
    marginLeft: 20,
    flexShrink: 0,
  },
});
