import React, { useEffect, useState } from 'react';
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
  variant_status: number | null;
}

interface CartScreenProps {
  token?: string | null;
  user?: {
    name: string;
    username?: string;
    avatar_url?: string;
    badge_name?: string;
  } | null;
  onCheckout?: () => void;
  onBack?: () => void;
  onProductPress?: (productId: number) => void;
  onProfilePress?: () => void;
  wishlistCount?: number;
  isDarkMode?: boolean;
}

export default function CartScreen({ token, user, onCheckout, onBack, onProductPress, onProfilePress, wishlistCount = 0, isDarkMode = false }: CartScreenProps) {
  const insets = useSafeAreaInsets();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [updatingQuantity, setUpdatingQuantity] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'new' | 'old'>('new');
  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f8fbff',
    containerBg: isDarkMode ? '#111827' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#1f2937' : '#e5e7eb',
    borderLight: isDarkMode ? '#374151' : '#f1f5f9',
    cardBg: isDarkMode ? '#1f2937' : '#f8fafc',
    hint: isDarkMode ? '#1e293b' : '#f9fafb',
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack?.();
      return true;
    });

    return () => sub.remove();
  }, [onBack]);

  const fetchCart = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const cartItems = response.data.cart_items || [];
      setCartItems(cartItems);
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
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
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

    try {
      setUpdatingQuantity(crtId);
      await axios.patch(
        `${API_CONFIG.BASE_URL}/cart/${crtId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(cartItems.map(item =>
        item.crt_id === crtId
          ? {
              ...item,
              crt_quantity: newQuantity,
              crt_total_price: (parseFloat(item.crt_unit_price) * newQuantity).toString(),
            }
          : item
      ));
    } catch (error: any) {
      console.error('Error updating quantity:', error);
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

    console.log('Delete pressed for:', crtId, productName);
    setItemToDelete({ id: crtId, name: productName });
    setConfirmDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    const { id: crtId, name: productName } = itemToDelete;

    try {
      setRemovingItem(crtId);
      setConfirmDeleteModal(false);

      await axios.delete(`${API_CONFIG.BASE_URL}/cart/${crtId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCartItems(cartItems.filter(item => item.crt_id !== crtId));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(crtId);
        return newSet;
      });

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

  const getSortedCartItems = () => {
    // Sort by creation date
    return cartItems.sort((a, b) => {
      const dateA = new Date(a.crt_created_at).getTime();
      const dateB = new Date(b.crt_created_at).getTime();
      return sortOrder === 'new' ? dateB - dateA : dateA - dateB;
    });
  };

  const getSelectedTotal = () => {
    return Array.from(selectedItems).reduce((total, crtId) => {
      const item = cartItems.find(c => c.crt_id === crtId);
      return total + (item ? parseFloat(item.crt_total_price) : 0);
    }, 0);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const scaleAnim = new Animated.Value(1);
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
          { backgroundColor: colors.containerBg, borderBottomColor: colors.border },
          selectedItems.has(item.crt_id) && { backgroundColor: isDarkMode ? '#1e293b' : '#f0f7ff' },
        ]}>
        {discount > 0 && (
          <LinearGradient
            colors={['transparent', Colors.sky + '15']}
            style={styles.containerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => handleSelectItem(item.crt_id)}
          activeOpacity={0.7}
        >
          <Animated.View style={[styles.checkboxBox, { borderColor: colors.border }, selectedItems.has(item.crt_id) && styles.checkboxBoxChecked, { transform: [{ scale: scaleAnim }] }]}>
            {selectedItems.has(item.crt_id) && <Ionicons name="checkmark" size={14} color={Colors.white} />}
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contentWrapper}
          onPress={() => onProductPress?.(item.crt_product_id)}
          activeOpacity={0.7}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.product_image }}
              style={styles.productImage}
              resizeMode="cover"
            />
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            )}
          </View>

          {/* Details Container */}
          <View style={styles.detailsContainer}>
            {/* Brand & Name */}
            <View>
              <Text style={[styles.brand, { color: colors.textSec }]} numberOfLines={1}>{item.brand_name}</Text>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>{item.product_name}</Text>
            </View>

            {/* Variants Display */}
            {hasVariants && (
              <View style={styles.variantContainer}>
                {/* Display variant color from new API fields */}
                {item.variant_color && (
                  <Text style={styles.variantText}>
                    <Ionicons name="color-palette" size={10} color={Colors.sky} /> {item.variant_color}
                  </Text>
                )}
                {/* Fallback to old fields for compatibility */}
                {!item.variant_color && item.crt_selected_color && (
                  <Text style={styles.variantText}>
                    <Ionicons name="color-palette" size={10} color={Colors.sky} /> {item.crt_selected_color}
                  </Text>
                )}
                
                {/* Display variant size from new API fields */}
                {item.variant_size && (
                  <Text style={styles.variantText}>
                    <Ionicons name="resize" size={10} color={Colors.sky} /> {item.variant_size}
                  </Text>
                )}
                {/* Fallback to old fields for compatibility */}
                {!item.variant_size && item.crt_selected_size && (
                  <Text style={styles.variantText}>
                    <Ionicons name="resize" size={10} color={Colors.sky} /> {item.crt_selected_size}
                  </Text>
                )}
                
                {/* Display variant name from new API fields */}
                {item.variant_name && (
                  <Text style={styles.variantText}>
                    <Ionicons name="cube" size={10} color={Colors.sky} /> {item.variant_name}
                  </Text>
                )}
                {/* Fallback to old fields for compatibility */}
                {!item.variant_name && item.crt_selected_type && (
                  <Text style={styles.variantText}>
                    <Ionicons name="cube" size={10} color={Colors.sky} /> {item.crt_selected_type}
                  </Text>
                )}
              </View>
            )}

            {/* Price Row */}
            <View style={styles.priceRow}>
              <Text style={[styles.memberPrice, { color: colors.text }]}>₱{parseFloat(item.crt_unit_price).toLocaleString()}</Text>
              {parseFloat(item.product_price_srp) > parseFloat(item.crt_unit_price) && (
                <Text style={[styles.srpPrice, { color: colors.textSec }]}>₱{parseFloat(item.product_price_srp).toLocaleString()}</Text>
              )}
            </View>

            {/* Badge Row */}
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
            </View>

            {/* Quantity & Total */}
            <View style={styles.quantityTotalRow}>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={[styles.quantityBtn, { borderColor: colors.border, backgroundColor: colors.bg }, updatingQuantity === item.crt_id && { opacity: 0.6 }]}
                  onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity - 1)}
                  disabled={updatingQuantity === item.crt_id}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={12} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.quantityText, { color: colors.text }]}>{item.crt_quantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityBtn, { borderColor: colors.border, backgroundColor: colors.bg }, updatingQuantity === item.crt_id && { opacity: 0.6 }]}
                  onPress={() => handleUpdateQuantity(item.crt_id, item.crt_quantity + 1)}
                  disabled={updatingQuantity === item.crt_id}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={12} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.itemPrice, { color: Colors.sky }]}>₱{parseFloat(item.crt_total_price).toLocaleString()}</Text>

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
        </TouchableOpacity>
        </View>
    );
  };

  const renderHiddenItem = (data: { item: CartItem }) => {
    const item = data.item;
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backLeftBtn, styles.backLeftBtnLeft]}
          onPress={() => handleRemoveItem(item.crt_id)}
          disabled={removingItem === item.crt_id}
        >
          <View style={styles.deleteActionInner}>
            <Ionicons name="trash-outline" size={20} color={Colors.white} />
            <Text style={styles.backTextWhite}>Delete</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => {
            handleSelectItem(item.crt_id);
            onCheckout?.();
          }}
        >
          <View style={styles.cartActionInner}>
            <Ionicons name="card-outline" size={20} color={Colors.white} />
            <Text style={styles.backTextWhite}>Checkout</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header with Gradient extending to top */}
        <LinearGradient
          colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top, backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerIcon, isDarkMode ? { backgroundColor: '#374151', borderColor: '#4b5563' } : { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>

            {/* Wishlist Icon */}
            <TouchableOpacity
              style={[styles.headerIcon, { backgroundColor: isDarkMode ? '#374151' : '#f1f5f9', borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {

              }}
            >
              <Ionicons name="heart-outline" size={20} color={colors.text} />
              {wishlistCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                  <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Loading Content */}
        <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
          <ActivityIndicator size="large" color={Colors.sky} />
        </View>
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header with Gradient extending to top */}
        <LinearGradient
          colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top, backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.headerIcon, isDarkMode ? { backgroundColor: '#374151', borderColor: '#4b5563' } : { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>

            {/* Wishlist Icon */}
            <TouchableOpacity
              style={[styles.headerIcon, { backgroundColor: isDarkMode ? '#374151' : '#f1f5f9', borderColor: colors.border }]}
              activeOpacity={0.7}
              onPress={() => {

              }}
            >
              <Ionicons name="heart-outline" size={20} color={colors.text} />
              {wishlistCount > 0 && (
                <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                  <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Empty State Content */}
        <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
          <Ionicons name="cart-outline" size={64} color={isDarkMode ? '#64748b' : Colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSec }]}>Add items to get started shopping</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: 'relative' }}>
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with Gradient extending to top */}
      <LinearGradient
        colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top, backgroundColor: colors.containerBg, borderBottomColor: colors.border }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.headerIcon, isDarkMode ? { backgroundColor: '#374151', borderColor: '#4b5563' } : { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Cart</Text>

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={[styles.headerIcon, isDarkMode ? { backgroundColor: '#374151', borderColor: '#4b5563' } : { backgroundColor: '#f1f5f9', borderColor: '#e5e7eb' }]}
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to wishlist - you'll need to implement this navigation

            }}
          >
            <Ionicons name="heart-outline" size={20} color={colors.text} />
            {wishlistCount > 0 && (
              <View style={[styles.badge, { borderColor: colors.containerBg }]}>
                <Text style={styles.badgeText}>{wishlistCount > 99 ? '99+' : wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Select All */}
      <View style={[styles.selectAllContainer, { backgroundColor: colors.containerBg, borderBottomColor: colors.borderLight }]}>
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

        <View style={styles.filterSection}>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: sortOrder === 'new' ? Colors.sky : (isDarkMode ? '#374151' : '#f3f4f6') }]}
            onPress={() => setSortOrder('new')}
          >
            <Text style={[styles.filterText, sortOrder === 'new' && styles.filterTextActive, sortOrder !== 'new' && { color: colors.text }]}>New</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, { backgroundColor: sortOrder === 'old' ? Colors.sky : (isDarkMode ? '#374151' : '#f3f4f6') }]}
            onPress={() => setSortOrder('old')}
          >
            <Text style={[styles.filterText, sortOrder === 'old' && styles.filterTextActive, sortOrder !== 'old' && { color: colors.text }]}>Old</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipe Hint */}
      <View style={[styles.swipeHint, { backgroundColor: colors.hint, borderBottomColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textSec} />
        <Text style={[styles.swipeHintText, { color: colors.textSec }]}>
          Swipe <Text style={{ color: Colors.sky, fontWeight: '800' }}>right</Text> to checkout, <Text style={{ color: '#ef4444', fontWeight: '800' }}>left</Text> to delete
        </Text>
      </View>

      {/* Cart Items */}
      <SwipeListView
        data={getSortedCartItems()}
        renderItem={renderCartItem}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={90}
        rightOpenValue={-90}
        swipeToOpenPercent={30}
        swipeToClosePercent={30}
        useNativeDriver={false}
        keyExtractor={(item) => item.crt_id.toString()}
        contentContainerStyle={[styles.listContent, { backgroundColor: colors.bg }]}
        scrollEnabled={true}
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
      {selectedItems.size > 0 && (
        <View style={[styles.footer, { backgroundColor: colors.containerBg, borderTopColor: colors.border, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.totalSection}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.textSec }]}>Total ({selectedItems.size}):</Text>
              <Text style={[styles.totalPrice, { color: colors.text }]}>₱{getSelectedTotal().toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={onCheckout}
            activeOpacity={0.7}
          >
            <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
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

    {/* Chat Bot Icon */}
    <ChatBotIcon position="bottom-right" visible={true} isDarkMode={isDarkMode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbff',
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
    paddingHorizontal: 16,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  selectAllContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectAllCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
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
  filterSection: {
    flexDirection: 'row',
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 0,
  },
  filterBtnActive: {
    backgroundColor: Colors.sky,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  listContent: {
    backgroundColor: '#f8fbff',
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
    borderBottomWidth: 1,
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
  productName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 16,
  },
  variantContainer: {
    gap: 2,
    marginTop: 2,
  },
  variantText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.sky,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 2,
    flexWrap: 'wrap',
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
  quantityTotalRow: {
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
    gap: 10,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    lineHeight: 12,
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
});
