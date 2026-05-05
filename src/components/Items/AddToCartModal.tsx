import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Image, StyleSheet, Dimensions,
  ActivityIndicator, TextInput, BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Product {
  id: number;
  name: string;
  image?: string;
  images?: string[];
  priceMember?: number;
  priceSrp?: number;
  prodpv?: number;
  soldCount: number;
  qty: number;
  variants?: Array<{
    id: number;
    color?: string;
    name?: string;
    colorHex?: string;
    images?: string[];
    priceMember?: number;
    priceSrp?: number;
    qty: number;
  }>;
}

interface AddToCartModalProps {
  visible: boolean;
  product: Product | null;
  images: string[];
  selectedVariant: number | null;
  quantity: number;
  onClose: () => void;
  onSelectVariant: (variantId: number) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: (data: {
    product_id: number;
    variant_id?: number;
    quantity: number;
  }) => Promise<void>;
  onCheckout?: () => void;
  loading?: boolean;
}

export default function AddToCartModal({
  visible,
  product,
  images,
  selectedVariant,
  quantity,
  onClose,
  onSelectVariant,
  onQuantityChange,
  onAddToCart,
  onCheckout,
  loading = false,
}: AddToCartModalProps) {
  const insets = useSafeAreaInsets();
  const scrollStartY = React.useRef(0);
  const hasScrolledDown = React.useRef(false);

  useEffect(() => {
    if (!visible) return;

    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => sub.remove();
  }, [visible, onClose]);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;

    if (currentScrollY === 0) {
      scrollStartY.current = 0;
      hasScrolledDown.current = false;
    } else if (currentScrollY > 50 && !hasScrolledDown.current) {
      hasScrolledDown.current = true;
      onClose();
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    await onAddToCart({
      product_id: product.id,
      variant_id: selectedVariant || undefined,
      quantity,
    });
  };

  if (!visible || !product) return null;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={[styles.shopeeModal, { paddingBottom: insets.bottom || 16 }]}>
        {/* Header */}
        <View style={styles.shopeeModalHeader}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={28} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.shopeeModalHeaderText}>Save to Cart</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.shopeeModalContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Product Card */}
          <View style={styles.shopeeProductCard}>
            {/* Image */}
            <View style={styles.shopeeProductImage}>
              <Image
                source={{
                  uri: selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.images?.[0] || images[0] || product.image)
                    : (images[0] || product.image)
                }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            {/* Product Info */}
            <View style={styles.shopeeProductInfo}>
              <Text style={styles.shopeeProductName} numberOfLines={2}>
                {product.name}
              </Text>

              {/* Rating and PV */}
              <View style={styles.shopeeRatingRow}>
                <View style={styles.shopeeStars}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= 4 ? 'star' : 'star-outline'}
                      size={14}
                      color="#fbbf24"
                    />
                  ))}
                </View>
                <Text style={styles.shopeeRatingText}>({product.soldCount} sold)</Text>
              </View>

              {/* PV Badge */}
              <View style={styles.pvBadgeRow}>
                <Ionicons name="trending-up" size={12} color={Colors.white} />
                <Text style={styles.pvBadgeText}>{product.prodpv || 0} PV</Text>
              </View>

              {/* Price Section */}
              <View style={styles.shopeePriceSection}>
                <View>
                  <Text style={styles.shopeePriceLabel}>Price</Text>
                  <View style={styles.shopeePriceRow}>
                    <Text style={styles.shopeePrice}>
                      ₱{(selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                        : product.priceMember).toLocaleString()}
                    </Text>
                    {(selectedVariant
                      ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                      : product.priceSrp) > (selectedVariant
                        ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? 0)
                        : product.priceMember) && (
                      <Text style={styles.shopeeOriginalPrice}>
                        ₱{(selectedVariant
                          ? (product.variants?.find(v => v.id === selectedVariant)?.priceSrp ?? 0)
                          : product.priceSrp).toLocaleString()}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.shopeeDivider} />

          {/* Variant Selection */}
          {(product.variants?.length ?? 0) > 0 && (
            <View style={styles.shopeeSection}>
              <View style={styles.shopeeSectionHeader}>
                <Text style={styles.shopeeSectionTitle}>Variant</Text>
                <Text style={styles.shopeeSectionRequired}>Required</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.shopeeVariantScroll}
              >
                <View style={styles.shopeeVariantRow}>
                  {product.variants.map((variant, index) => (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        styles.shopeeVariantOption,
                        selectedVariant === variant.id && styles.shopeeVariantOptionSelected
                      ]}
                      onPress={() => onSelectVariant(variant.id)}
                      activeOpacity={0.6}
                    >
                      {variant.images && variant.images.length > 0 ? (
                        <Image
                          source={{ uri: variant.images[0] }}
                          style={styles.shopeeVariantOptionImage}
                          resizeMode="cover"
                        />
                      ) : variant.colorHex ? (
                        <View style={[
                          styles.shopeeVariantOptionColor,
                          { backgroundColor: variant.colorHex }
                        ]} />
                      ) : null}
                      <Text
                        style={styles.shopeeVariantOptionText}
                        numberOfLines={2}
                      >
                        {variant.color || variant.name || `Var ${index + 1}`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Quantity Selection */}
          <View style={styles.shopeeSection}>
            <View style={styles.shopeeSectionHeader}>
              <Text style={styles.shopeeSectionTitle}>Quantity</Text>
            </View>
            <View style={styles.shopeeQuantityControl}>
              <TouchableOpacity
                style={styles.shopeeQuantityBtn}
                onPress={() => quantity > 1 && onQuantityChange(quantity - 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={18} color={Colors.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.shopeeQuantityInput}
                value={quantity.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text) || 1;
                  const maxQty = selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.qty ?? product.qty)
                    : product.qty;
                  if (num > 0 && num <= maxQty) {
                    onQuantityChange(num);
                  }
                }}
                keyboardType="number-pad"
                editable={false}
              />
              <TouchableOpacity
                style={styles.shopeeQuantityBtn}
                onPress={() => {
                  const maxQty = selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.qty ?? product.qty)
                    : product.qty;
                  if (quantity < maxQty) {
                    onQuantityChange(quantity + 1);
                  }
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={18} color={Colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Price Summary */}
          <View style={styles.shopeePriceSummary}>
            {/* Subtotal */}
            <View style={[styles.shopeePriceSummaryRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTopY: 8, marginTopY: 8 }]}>
              <Text style={styles.shopeePriceSummaryLabel}>Subtotal</Text>
              <Text style={styles.shopeePriceSummaryValue}>
                ₱{(
                  quantity * (selectedVariant
                    ? (product.variants?.find(v => v.id === selectedVariant)?.priceMember ?? product.priceMember)
                    : product.priceMember)
                ).toLocaleString()}
              </Text>
            </View>

            <View style={styles.shopeePriceSummaryRow}>
              <Text style={styles.shopeePriceSummaryLabel}>Shipping</Text>
              <Text style={styles.shopeeShippingText}>See at checkout</Text>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={[styles.shopeeCheckoutFooterGradient, { paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom }]}>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.checkoutBtn, loading && { opacity: 0.6 }]}
              onPress={() => {
                handleAddToCart().then(() => {
                  onCheckout?.();
                });
              }}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="flash" size={20} color={Colors.white} />
                  <Text style={styles.checkoutBtnText}>Proceed to{'\n'}Checkout</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addToCartBtn, loading && { opacity: 0.6 }]}
              onPress={handleAddToCart}
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={18} color={Colors.white} />
                  <Text style={styles.addToCartBtnText}>Save to Cart</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  shopeeModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  shopeeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopeeModalHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  shopeeModalContent: {
    paddingHorizontal: 16,
  },
  shopeeProductCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  shopeeProductImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  shopeeProductInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  shopeeProductName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 16,
  },
  shopeeRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  shopeeStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  shopeeRatingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  pvBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  pvBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  shopeePriceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  shopeePriceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  shopeePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  shopeePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.sky,
  },
  shopeeOriginalPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  shopeeDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  shopeeSection: {
    paddingHorizontal: 0,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  shopeeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopeeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeeSectionRequired: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '500',
  },
  shopeeVariantScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  shopeeVariantRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shopeeVariantOption: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    minWidth: 75,
  },
  shopeeVariantOptionImage: {
    width: 55,
    height: 55,
    borderRadius: 6,
  },
  shopeeVariantOptionColor: {
    width: 55,
    height: 55,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  shopeeVariantOptionSelected: {
    borderColor: Colors.sky,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
  },
  shopeeVariantOptionText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  shopeeQuantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  shopeeQuantityBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  shopeeQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    paddingHorizontal: 12,
    height: 36,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  shopeePriceSummary: {
    paddingVertical: 12,
  },
  shopeePriceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  shopeePriceSummaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  shopeePriceSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  shopeeShippingText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  shopeeCheckoutFooterGradient: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: Colors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 0,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f97316',
    height: 52,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addToCartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  checkoutBtn: {
    flex: 0.4,
    flexDirection: 'column',
    backgroundColor: Colors.sky,
    height: 52,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  checkoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 13,
  },
});
