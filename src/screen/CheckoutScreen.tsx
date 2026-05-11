import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
  Image,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { API_CONFIG } from '../config/api';
import Toast from 'react-native-toast-message';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CheckoutItem {
  product_id: number;
  product_name: string;
  product_image: string;
  product_price_member: number;
  product_price_srp?: number;
  brand_name?: string;
  quantity: number;
  variant_color?: string;
  variant_size?: string;
  variant_image?: string;
  brand_id?: number;
}

interface ShippingMethod {
  id: number;
  province: string;
  city: string;
  fee: number;
  status: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

interface UserAddress {
  id: number;
  full_name: string;
  phone: string;
  address: string;
  region: string;
  province: string;
  city: string;
  barangay: string;
  zip_code: string;
  address_type: string;
  notes?: string;
  is_default: boolean;
  full_address: string;
}

interface CheckoutScreenProps {
  item?: CheckoutItem;
  token?: string | null;
  user?: {
    name: string;
    phone?: string;
    email?: string;
    referrer_username?: string;
    referrer_name?: string;
  } | null;
  onBack?: () => void;
  onPlaceOrder?: (orderData: any) => Promise<void>;
  onNavigateToOrderSuccess?: (orderData: any) => void;
  onShopNavigate?: (brandId: number, shopName: string) => void;
  onNavigateToShippingAddress?: (addresses: UserAddress[], selectedAddress: UserAddress | null, onSelect: (address: UserAddress) => void) => void;
  isDarkMode?: boolean;
}

export default function CheckoutScreen({
  item,
  token,
  user,
  onBack,
  onPlaceOrder,
  onNavigateToOrderSuccess,
  onShopNavigate,
  onNavigateToShippingAddress,
  isDarkMode = false,
}: CheckoutScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingShippingRates, setLoadingShippingRates] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<number | null>(null);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);

  const colors = {
    bg: isDarkMode ? '#0f172a' : '#f0f9ff',
    containerBg: isDarkMode ? '#1f2937' : Colors.white,
    text: isDarkMode ? '#f8fafc' : Colors.text,
    textSec: isDarkMode ? '#94a3b8' : Colors.textSecondary,
    border: isDarkMode ? '#374151' : '#e5e7eb',
    borderLight: isDarkMode ? '#475569' : '#f1f5f9',
  };

  const paymentMethods: PaymentMethod[] = [
    { id: 'gcash', name: 'GCash', icon: 'card' },
    { id: 'maya', name: 'PayMaya', icon: 'card' },
    { id: 'card', name: 'Credit/Debit Card', icon: 'card' },
    { id: 'online_banking', name: 'Online Banking', icon: 'checkmark-circle' },
  ];

  const vouchers = [
    { id: 1, code: 'WELCOME20', description: '20% off your first purchase', discount: 0.20 },
    { id: 2, code: 'FREESHIP', description: 'Free shipping on orders above ₱500', discount: 0 },
  ];

  const voucherDiscount = selectedVoucher ? (vouchers.find(v => v.id === selectedVoucher)?.discount || 0) * subtotal : 0;

  // Fetch user addresses
  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_CONFIG.BASE_URL}/auth/addresses`, { headers });
      if (response.data && response.data.addresses) {
        setAddresses(response.data.addresses);
        // Set default address as selected
        const defaultAddr = response.data.addresses.find((a: UserAddress) => a.is_default);
        if (defaultAddr) {
          setSelectedAddress(defaultAddr);
        } else if (response.data.addresses.length > 0) {
          setSelectedAddress(response.data.addresses[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load addresses',
      });
    } finally {
      setLoadingAddresses(false);
    }
  };

  // Fetch shipping rates based on selected address
  const fetchShippingRates = async (address?: UserAddress) => {
    const targetAddress = address || selectedAddress;
    if (!targetAddress) return;

    setLoadingShippingRates(true);
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/shipping-rates`);
      if (response.data && response.data.rates) {
        // Normalize city name (remove "City of" prefix for matching)
        const normalizeCity = (city: string) => {
          return city.toLowerCase().replace(/^city of\s+/, '').trim();
        };

        const normalizedTargetCity = normalizeCity(targetAddress.city);

        // Filter rates by CITY ONLY (most important)
        const filteredRates = response.data.rates.filter(
          (rate: ShippingMethod) => {
            const normalizedRateCity = normalizeCity(rate.city);
            return normalizedRateCity === normalizedTargetCity && rate.status;
          }
        );

        setShippingMethods(filteredRates);

        console.log('Shipping rates fetched:', {
          userCity: targetAddress.city,
          normalizedCity: normalizedTargetCity,
          ratesFound: filteredRates.length,
          rates: filteredRates.map(r => ({ city: r.city, fee: r.fee })),
        });

        // Show warning if no rates found
        if (filteredRates.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No Shipping Available',
            text2: `We don't have shipping rates for ${targetAddress.city} yet.`,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch shipping rates:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load shipping rates',
      });
    } finally {
      setLoadingShippingRates(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await fetchAddresses();
    };
    initialize();
  }, [token]);

  useEffect(() => {
    if (selectedAddress) {
      fetchShippingRates(selectedAddress);
    }
  }, [selectedAddress]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack?.();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  // Calculate totals
  const subtotal = item && item.product_price_srp ? item.product_price_srp * item.quantity : 0;
  const memberTotal = item ? item.product_price_member * item.quantity : 0;
  const shippingCost = shippingMethods.length > 0 ? shippingMethods[0].fee : 0;
  const selectedShippingMethod = shippingMethods.length > 0 ? shippingMethods[0] : null;
  const shopDiscount = item && item.product_price_srp ? (item.product_price_srp - item.product_price_member) * item.quantity : 0;
  const total = memberTotal - voucherDiscount + shippingCost;


  const handlePlaceOrder = async () => {
    console.log('[CheckoutScreen] Place order clicked');

    if (!selectedPaymentMethod) {
      Toast.show({
        type: 'error',
        text1: 'Payment Method Required',
        text2: 'Please select a payment method',
      });
      return;
    }

    if (!item || !user || !selectedAddress || !token) {
      console.log('[CheckoutScreen] Missing required fields:', {
        hasItem: !!item,
        hasUser: !!user,
        hasAddress: !!selectedAddress,
        hasToken: !!token,
      });
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please complete all required fields',
      });
      return;
    }

    setLoading(true);

    try {
      const deviceId = Device.deviceId || 'unknown';
      const appVersion = '1.0.0';
      const platformName = Platform.OS === 'ios' ? 'ios' : 'android';

      // REQUIRED FIELDS
      const paymentPayload: any = {
        amount: Math.round(total * 100) / 100,
        description: `${item.product_name} (${item.quantity} item${item.quantity > 1 ? 's' : ''})`,
        payment_method: selectedPaymentMethod,
        platform: platformName,
        app_version: appVersion,
      };

      // OPTIONAL FIELDS
      paymentPayload.payment_mode = 'test';
      paymentPayload.device_id = deviceId;

      // Customer info (optional)
      if (user?.name || user?.email || user?.phone) {
        paymentPayload.customer = {
          name: user?.name || selectedAddress.full_name,
          email: user?.email,
          phone: user?.phone || selectedAddress.phone,
          address: selectedAddress.full_address || `${selectedAddress.address}, ${selectedAddress.city}, ${selectedAddress.province}`,
          referred_by: user?.referrer_username,
          is_member: false,
        };
      }

      // Order details (optional)
      paymentPayload.order = {
        product_name: item.product_name,
        product_id: item.product_id,
        product_sku: `SKU-${item.product_id}`,
        product_image: item.variant_image || item.product_image,
        quantity: item.quantity,
        subtotal: Math.round(memberTotal * 100) / 100,
        handling_fee: Math.round(shippingCost * 100) / 100,
      };

      // Add optional variant fields if available
      if (item.variant_color) paymentPayload.order.selected_color = item.variant_color;
      if (item.variant_size) paymentPayload.order.selected_size = item.variant_size;

      console.log('[CheckoutScreen] Order object with quantity:', {
        product: paymentPayload.order.product_name,
        quantity: paymentPayload.order.quantity,
        subtotal: paymentPayload.order.subtotal,
      });

      // Voucher (optional)
      if (selectedVoucher) {
        const voucherCode = vouchers.find(v => v.id === selectedVoucher)?.code;
        if (voucherCode) {
          paymentPayload.voucher_code = voucherCode;
        }
      }

      console.log('[CheckoutScreen] Payment payload:', JSON.stringify(paymentPayload, null, 2));
      const apiUrl = `${API_CONFIG.BASE_URL}/mobile/payments/create`;
      console.log('[CheckoutScreen] Calling API:', apiUrl);
      console.log('[CheckoutScreen] Payment method:', selectedPaymentMethod, '-> lowercase:', selectedPaymentMethod.toLowerCase());

      const response = await axios.post(apiUrl, paymentPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('[CheckoutScreen] ✅ API SUCCESS:', {
        status: response.status,
        orderId: response.data?.order_id,
        hasCheckoutUrl: !!response.data?.checkout_url,
      });

      if (response.data?.checkout_url) {
        const orderData = {
          item,
          user,
          selectedAddress,
          selectedPaymentMethod,
          shippingCost,
          voucherDiscount,
          selectedVoucher,
          subtotal,
          shopDiscount,
          total,
          token,
          checkoutUrl: response.data.checkout_url,
          orderId: response.data?.order_id,
        };

        console.log('[CheckoutScreen] Navigating to order success with checkout URL');
        onNavigateToOrderSuccess?.(orderData);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No checkout URL received from server',
        });
      }
    } catch (error: any) {
      console.error('[CheckoutScreen] ❌ API ERROR:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });

      const errorMsg = error.response?.data?.message
        || error.response?.data?.error
        || error.response?.statusText
        || 'Failed to create payment';

      Toast.show({
        type: 'error',
        text1: 'Payment Error',
        text2: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <LinearGradient
          colors={[Colors.forest, Colors.forestDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top, borderBottomColor: '#e5e7eb' }]}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <Ionicons name="chevron-back-outline" size={24} color={Colors.forest} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerGreeting}>Checkout</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSec }]}>No item selected</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDarkMode ? ['rgba(59,130,246,0.15)', 'rgba(31,41,55,0)'] : ['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top, backgroundColor: isDarkMode ? '#1f2937' : Colors.white, borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb' }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back-outline" size={24} color={isDarkMode ? '#e5e7eb' : Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={[styles.headerGreeting, { color: isDarkMode ? '#f8fafc' : Colors.text }]}>
              Checkout
            </Text>
            {user?.name && (
              <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#9ca3af' : Colors.textSecondary }]} numberOfLines={1}>
                {user.name}
              </Text>
            )}
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.content, { backgroundColor: colors.bg }]}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Order Item Section - Shopee Style */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, padding: 0, borderColor: colors.border, borderWidth: 1 }]}>
          {/* Shop Header */}
          {item.brand_name && (
            <TouchableOpacity
              style={[styles.shopHeader, { borderBottomColor: colors.border, backgroundColor: colors.containerBg }]}
              onPress={() => onShopNavigate?.(item.brand_id || 0, item.brand_name || '')}
              activeOpacity={0.7}
            >
              <View style={styles.shopInfo}>
                <Ionicons name="storefront" size={16} color={Colors.sky} />
                <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>
                  {item.brand_name}
                </Text>
              </View>
              <View style={styles.viewBrandContainer}>
                <Text style={[styles.viewBrandText, { color: colors.textSec }]}>View Brand</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.sky} />
              </View>
            </TouchableOpacity>
          )}

          {/* Product Card */}
          <View style={[styles.itemCard, { borderColor: colors.border, backgroundColor: colors.borderLight, marginHorizontal: 12, marginTop: 8, marginBottom: 8 }]}>
            <Image
              source={{ uri: item.variant_image || item.product_image }}
              style={styles.itemImage}
              resizeMode="contain"
            />
            <View style={styles.itemDetails}>
              <View>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.product_name}
                </Text>
                {(item.variant_color || item.variant_size) && (
                  <Text style={[styles.itemVariantInfo, { color: colors.textSec }]}>
                    {item.variant_color && `${item.variant_color}`}
                    {item.variant_color && item.variant_size && ', '}
                    {item.variant_size && `${item.variant_size}`}
                  </Text>
                )}
              </View>
              <View style={styles.itemFooter}>
                <View style={styles.itemPriceContainer}>
                  <Text style={[styles.itemPrice, { color: Colors.sky }]}>
                    ₱{item.product_price_member.toLocaleString()}
                  </Text>
                  {item.product_price_srp && item.product_price_srp > item.product_price_member && (
                    <Text style={[styles.itemPriceSrp, { color: colors.textSec }]}>
                      ₱{item.product_price_srp.toLocaleString()}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemQty, { color: colors.textSec }]}>
                  x{item.quantity}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Shipping Address Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, padding: 0, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={[styles.shippingHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.containerBg }]}>
            <View style={styles.shippingHeaderInfo}>
              <Ionicons name="location" size={16} color={Colors.sky} />
              <Text style={[styles.shippingTitle, { color: colors.text }]}>Shipping To</Text>
            </View>
            {addresses.length > 1 && (
              <TouchableOpacity
                onPress={() => onNavigateToShippingAddress?.(addresses, selectedAddress, setSelectedAddress)}
                activeOpacity={0.7}
              >
                <View style={styles.viewShippingContainer}>
                  <Text style={[styles.viewShippingText, { color: colors.textSec }]}>View Shipping Address</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.sky} />
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.shippingContent, { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }]}>

          {loadingAddresses ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.sky} />
              <Text style={[styles.loadingText, { color: colors.textSec }]}>Loading addresses...</Text>
            </View>
          ) : selectedAddress ? (
            <View>
              <View style={[styles.addressCard, { backgroundColor: colors.borderLight, borderColor: Colors.sky }]}>
                <Text style={[styles.addressType, { color: Colors.forest }]}>
                  {selectedAddress.address_type}
                </Text>
                <Text style={[styles.addressName, { color: colors.text }]} numberOfLines={1}>
                  {selectedAddress.full_name} <Text style={[styles.addressPhone, { color: colors.textSec }]}>({selectedAddress.phone})</Text>
                </Text>
                <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={3}>
                  {selectedAddress.full_address}
                </Text>
                {selectedAddress.notes && (
                  <Text style={[styles.addressNotes, { color: colors.textSec }]}>
                    Notes: {selectedAddress.notes}
                  </Text>
                )}
              </View>

              {/* Shipping Cost Display */}
              {loadingShippingRates ? (
                <View style={styles.shippingInfoContainer}>
                  <ActivityIndicator size="small" color={Colors.sky} />
                  <Text style={[styles.loadingText, { color: colors.textSec }]}>Loading shipping...</Text>
                </View>
              ) : selectedShippingMethod ? (
                <View style={[styles.shippingInfo, { backgroundColor: colors.borderLight, marginTop: 8 }]}>
                  <View style={styles.shippingDetail}>
                    <Ionicons name="car" size={16} color={Colors.sky} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.shippingLabel, { color: colors.textSec }]}>Shipping</Text>
                      <Text style={[styles.shippingCity, { color: colors.text }]}>
                        {selectedShippingMethod.city}, {selectedShippingMethod.province}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.shippingCost, { color: Colors.sky }]}>
                    ₱{shippingCost.toLocaleString()}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSec }]}>No address found</Text>
          )}
          </View>
        </View>

        {/* Referred By Section */}
        {user?.referrer_username && (
          <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, padding: 0, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={[styles.shippingHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.containerBg }]}>
              <View style={styles.shippingHeaderInfo}>
                <Ionicons name="person" size={16} color={Colors.sky} />
                <Text style={[styles.shippingTitle, { color: colors.text }]}>Referred By</Text>
              </View>
            </View>

            <View style={[styles.shippingContent, { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 }]}>
              <View style={[styles.referrerCard, { backgroundColor: colors.borderLight, borderColor: Colors.sky }]}>
                <Ionicons name="person-circle" size={32} color={Colors.sky} />
                <Text style={[styles.referrerUsername, { color: colors.text }]}>
                  @{user.referrer_username}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Shipping Options Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, padding: 0, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={[styles.shippingHeaderRow, { borderBottomColor: colors.border, backgroundColor: colors.containerBg }]}>
            <View style={styles.shippingHeaderInfo}>
              <Ionicons name="layers" size={16} color={Colors.sky} />
              <Text style={[styles.shippingTitle, { color: colors.text }]}>Shipping Options</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <View style={styles.viewShippingContainer}>
                <Text style={[styles.viewShippingText, { color: colors.textSec }]}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.sky} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.shippingContent, { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 }]}>
            <View style={styles.shippingOptionsContainer}>
              {/* AF Home Delivery - Default */}
              <TouchableOpacity style={[styles.shippingOptionCard, { backgroundColor: colors.borderLight, borderColor: Colors.sky }]}>
                <View style={styles.optionContent}>
                  <Text style={[styles.optionName, { color: colors.text }]}>AF Home Delivery</Text>
                  <Text style={[styles.optionDays, { color: colors.textSec }]}>Standard</Text>
                </View>
                <Text style={[styles.optionPrice, { color: Colors.sky }]}>₱{shippingCost.toLocaleString()}</Text>
              </TouchableOpacity>

              {/* Other Shipping Partners */}
              {shippingMethods.slice(0, 2).map((method, index) => (
                <TouchableOpacity key={index} style={[styles.shippingOptionCard, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionName, { color: colors.text }]}>{method.province}</Text>
                    <Text style={[styles.optionDays, { color: colors.textSec }]}>Delivery</Text>
                  </View>
                  <Text style={[styles.optionPrice, { color: Colors.sky }]}>₱{method.fee.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Payment Method Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
            {!selectedPaymentMethod && (
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '500' }}>Required *</Text>
            )}
          </View>

          <View style={styles.paymentList}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentListItem,
                  {
                    backgroundColor: selectedPaymentMethod === method.id ? `${Colors.sky}15` : colors.borderLight,
                    borderColor: selectedPaymentMethod === method.id ? Colors.sky : colors.border,
                  },
                ]}
                onPress={() => setSelectedPaymentMethod(method.id)}
              >
                <View style={styles.paymentListContent}>
                  <Ionicons name={method.icon as any} size={20} color={Colors.sky} />
                  <Text style={[styles.paymentListName, { color: colors.text }]}>
                    {method.name}
                  </Text>
                </View>
                {selectedPaymentMethod === method.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Voucher Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Vouchers</Text>
          <View style={styles.voucherList}>
            {vouchers.map((voucher) => (
              <TouchableOpacity
                key={voucher.id}
                style={[
                  styles.voucherCard,
                  {
                    backgroundColor: selectedVoucher === voucher.id ? `${Colors.sky}15` : colors.borderLight,
                    borderColor: selectedVoucher === voucher.id ? Colors.sky : colors.border,
                  },
                ]}
                onPress={() => setSelectedVoucher(selectedVoucher === voucher.id ? null : voucher.id)}
              >
                <View style={styles.voucherContent}>
                  <Text style={[styles.voucherCode, { color: Colors.sky }]}>{voucher.code}</Text>
                  <Text style={[styles.voucherDesc, { color: colors.textSec }]}>{voucher.description}</Text>
                </View>
                {selectedVoucher === voucher.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price Summary Section */}
        <View style={[styles.section, { backgroundColor: colors.containerBg, marginTop: 12, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.paymentDetailsLabel, { color: colors.text }]}>Payment Details</Text>

          <View style={[styles.priceRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.priceLabel, { color: colors.textSec }]}>Quantity</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              x{item?.quantity || 0}
            </Text>
          </View>

          <View style={[styles.priceRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.priceLabel, { color: colors.textSec }]}>Subtotal</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              ₱{(item && item.product_price_srp ? item.product_price_srp * item.quantity : 0).toLocaleString()}
            </Text>
          </View>

          {shopDiscount > 0 && (
            <View style={[styles.priceRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.priceLabel, { color: colors.textSec }]}>Member Discount</Text>
              <Text style={[styles.priceValue, { color: Colors.sky }]}>
                -₱{shopDiscount.toLocaleString()}
              </Text>
            </View>
          )}

          {voucherDiscount > 0 && (
            <View style={[styles.priceRow, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.priceLabel, { color: colors.textSec }]}>Voucher Discount ({selectedVoucher && vouchers.find(v => v.id === selectedVoucher)?.code})</Text>
              <Text style={[styles.priceValue, { color: Colors.sky }]}>
                -₱{voucherDiscount.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={[styles.priceRow, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.priceLabel, { color: colors.textSec }]}>Shipping</Text>
            <Text style={[styles.priceValue, { color: colors.text }]}>
              ₱{shippingCost.toLocaleString()}
            </Text>
          </View>

          <View style={[styles.priceRow, { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 12 }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalPrice, { color: Colors.sky }]}>
              ₱{total.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>


      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.containerBg,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <View style={styles.footerContent}>
          <View style={styles.footerPrice}>
            <Text style={[styles.footerPriceLabel, { color: colors.textSec }]}>Total</Text>
            <Text style={[styles.footerPriceValue, { color: Colors.sky }]}>
              ₱{total.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.placeOrderBtn,
              {
                backgroundColor: Colors.sky,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Ionicons name="bag-check" size={18} color={Colors.white} />
                <Text style={styles.placeOrderBtnText}>Place Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor: colors.containerBg }]}>
            <ActivityIndicator size="large" color={Colors.sky} />
            <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>
              Processing your order...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: -10,
    marginRight: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  section: {
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    marginHorizontal: 'auto',
    maxWidth: 900,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  shopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shopName: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewBrandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBrandText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemVariantInfo: {
    fontSize: 10,
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  itemPriceSrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  itemQty: {
    fontSize: 11,
  },
  paymentList: {
    gap: 10,
  },
  paymentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  paymentListContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentListName: {
    fontSize: 13,
    fontWeight: '500',
  },
  paymentDetailsLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  methodCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodName: {
    fontSize: 13,
    fontWeight: '600',
  },
  methodDays: {
    fontSize: 11,
  },
  methodPrice: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioButton: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  voucherList: {
    gap: 10,
  },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  voucherContent: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  voucherDesc: {
    fontSize: 11,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  priceDisplayFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceValueSrp: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerPrice: {
    flex: 1,
  },
  footerPriceLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  footerPriceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  placeOrderBtn: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  placeOrderBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  shippingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  shippingHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  shippingTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  shippingContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  viewShippingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewShippingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  addressEditBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  addressType: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 16,
  },
  addressPhone: {
    fontSize: 11,
  },
  addressText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  addressNotes: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  addressModal: {
    width: '90%',
    borderRadius: 16,
    maxHeight: '75%',
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addressList: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addressListItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  addressListContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  addressListType: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  addressListName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
  },
  addressListPhone: {
    fontSize: 11,
  },
  addressListAddress: {
    fontSize: 11,
    lineHeight: 15,
  },
  shippingInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  shippingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  shippingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  shippingLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  shippingCity: {
    fontSize: 12,
    fontWeight: '600',
  },
  shippingCost: {
    fontSize: 14,
    fontWeight: '700',
  },
  shippingOptionsSeparator: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  shippingOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  shippingOptionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shippingOptionsContainer: {
    gap: 10,
  },
  shippingOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDays: {
    fontSize: 11,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 12,
  },
  referrerCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  referrerUsername: {
    fontSize: 13,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
