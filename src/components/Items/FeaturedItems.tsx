// @ts-nocheck
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { API_CONFIG } from '../../config/api';

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
  badges?: {
    musthave?: boolean;
    bestseller?: boolean;
  };
  musthave?: boolean;
  bestseller?: boolean;
  salespromo?: boolean;
}

interface FeaturedItemsProps {
  product: Product;
  token?: string | null;
  isDarkMode?: boolean;
  onPress?: (id: number) => void;
  isWishlisted?: boolean;
  wishlistId?: number;
  onWishlistToggle?: () => void;
}

const BADGE_CONFIG = [
  { key: 'musthave', label: 'Must Have', bg: ['#f97316', '#ea580c'] as const, icon: 'heart' as const },
  { key: 'bestseller', label: 'Bestseller', bg: ['#d4a017', '#b8860b'] as const, icon: 'flame' as const },
  { key: 'salespromo', label: 'On Sale', bg: [Colors.forest, '#1e4236'] as const, icon: 'flash' as const },
] as const;

export default function FeaturedItems({
  product,
  token,
  isDarkMode = false,
  onPress,
  isWishlisted = false,
  wishlistId,
  onWishlistToggle,
}: FeaturedItemsProps) {
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [imageError, setImageError] = useState(false);

  const colors = {
    bg: isDarkMode ? '#1e293b' : '#f8f9fa',
    border: isDarkMode ? '#334155' : '#e5e7eb',
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    imageBg: isDarkMode ? '#0f172a' : '#f1f5f9',
  };

  const displayPrice = product.priceMember || product.priceDp || product.price || 0;
  const originalPrice = product.original_price || product.price || 0;
  const hasDiscount = displayPrice < originalPrice;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice || 0) - displayPrice) / (originalPrice || 0) * 100)
    : 0;
  const pv = parseFloat(String(product.prodpv || product.pv || 0));

  const activeBadges = BADGE_CONFIG.filter(b =>
    (b.key === 'musthave' && product.musthave) ||
    (b.key === 'bestseller' && product.bestseller) ||
    (b.key === 'salespromo' && product.salespromo)
  );

  const handleWishlistToggle = useCallback(async () => {
    if (!token) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please log in to add items to wishlist',
      });
      return;
    }

    try {
      setIsTogglingWishlist(true);

      if (wishlisted) {
        await axios.delete(`${API_CONFIG.BASE_URL}/wishlist/${product.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `${API_CONFIG.BASE_URL}/wishlist`,
          { product_id: product.id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setWishlisted(!wishlisted);
      onWishlistToggle?.();

      Toast.show({
        type: 'success',
        text1: wishlisted ? 'Removed from wishlist' : 'Added to wishlist',
        text2: wishlisted ? 'Item removed from your wishlist' : 'Item added to your wishlist',
      });
    } catch (error: any) {
      console.error('Error toggling wishlist:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: wishlisted ? 'Failed to remove from wishlist' : 'Failed to add to wishlist',
      });
    } finally {
      setIsTogglingWishlist(false);
    }
  }, [token, product.id, wishlisted, onWishlistToggle]);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={() => onPress?.(product.id)}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={[styles.imageContainer, { backgroundColor: colors.imageBg }]}>
        {imageError || !product.image ? (
          <Image
            source={require('../../../assets/af_home_logo.png')}
            style={[styles.productImage, { tintColor: isDarkMode ? '#cbd5e1' : '#4b5563' }]}
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: product.image }}
            style={styles.productImage}
            resizeMode="cover"
            onError={() => {
              setImageError(true);
            }}
          />
        )}

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.enjoyBadge}>
            <Ionicons name="pricetag" size={10} color={Colors.white} />
            <Text style={styles.enjoyBadgeText}>Enjoy {discountPct}% OFF</Text>
          </View>
        )}

        {/* Wishlist Button */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleWishlistToggle}
          disabled={isTogglingWishlist}
          activeOpacity={0.7}
        >
          {isTogglingWishlist ? (
            <ActivityIndicator size={16} color="#ef4444" />
          ) : (
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={18}
              color={wishlisted ? '#ef4444' : Colors.white}
            />
          )}
        </TouchableOpacity>

        {/* Badges */}
        {activeBadges.length > 0 && (
          <View style={styles.imageBottomBadges}>
            {activeBadges.map(b => (
              <LinearGradient
                key={b.key}
                colors={b.bg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.imageBadge}
              >
                <Ionicons name={b.icon} size={9} color={Colors.white} />
                <Text style={styles.imageBadgeLabel}>{b.label}</Text>
              </LinearGradient>
            ))}
          </View>
        )}
      </View>

      {/* Border Below Image */}
      <View style={[styles.imageBorder, { backgroundColor: colors.border }]} />

      {/* Info */}
      <View style={styles.infoContainer}>
        {/* Product Name */}
        <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
          {product.name}
        </Text>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          {/* PV badge */}
          <LinearGradient
            colors={[Colors.sky, Colors.skyDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.badge}
          >
            <Ionicons name="trending-up" size={9} color={Colors.white} />
            <Text style={styles.badgeLabel} numberOfLines={1} ellipsizeMode="tail">PV {pv}</Text>
          </LinearGradient>

          {/* Save amount badge */}
          {hasDiscount && (
            <LinearGradient
              colors={['#ef4444', '#dc2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badge}
            >
              <Ionicons name="pricetag" size={9} color={Colors.white} />
              <Text style={styles.badgeLabel} numberOfLines={1} ellipsizeMode="tail">Save ₱{(originalPrice - displayPrice).toLocaleString()}</Text>
            </LinearGradient>
          )}
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={[styles.currentPrice, { color: Colors.sky }]} numberOfLines={1} ellipsizeMode="tail">₱{displayPrice.toLocaleString()}</Text>
          {hasDiscount && (
            <Text style={[styles.originalPrice, { color: colors.textSec }]} numberOfLines={1} ellipsizeMode="tail">₱{originalPrice.toLocaleString()}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    width: '100%',
    height: 320,
    alignSelf: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  enjoyBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.9,
  },
  enjoyBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBottomBadges: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    maxWidth: '80%',
  },
  imageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  imageBadgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  imageBorder: {
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  infoContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 18,
    flexShrink: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.sky,
  },
  originalPrice: {
    fontSize: 13,
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
