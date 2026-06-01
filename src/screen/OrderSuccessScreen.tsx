import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { API_CONFIG } from '../config/api';
import Toast from 'react-native-toast-message';

interface OrderData {
  item?: {
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
  };
  items?: Array<{
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
  }>;
  user: {
    name: string;
    phone?: string;
    email?: string;
    referrer_username?: string;
  };
  selectedAddress: {
    full_name: string;
    phone: string;
    full_address: string;
  };
  selectedPaymentMethod: string;
  shippingCost: number;
  voucherDiscount: number;
  selectedVoucher: number | null;
  subtotal: number;
  shopDiscount: number;
  total: number;
  token?: string;
  checkoutUrl?: string;
  orderId?: number;
  checkoutId?: string;
  mobileOrderId?: string;
  paymentIntentId?: string;
}

interface OrderSuccessScreenProps {
  orderData: OrderData;
  onBack?: () => void;
  onNavigateToPayment?: (checkoutUrl: string) => void;
  onPayLater?: () => void;
  isDarkMode?: boolean;
}

export default function OrderSuccessScreen({
  orderData,
  onBack,
  onNavigateToPayment,
  onPayLater,
  isDarkMode = false,
}: OrderSuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const renderInfoRow = (label: string, value: string | number, icon?: string) => (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons name={icon as any} size={16} color={Colors.sky} />
          </View>
        )}
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const handlePayment = async () => {
    console.log('[OrderSuccessScreen] Proceed to payment clicked');

    if (!orderData.token) {
      console.log('[OrderSuccessScreen] Missing authentication token');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Authentication token missing',
      });
      return;
    }

    console.log('[OrderSuccessScreen] Token found, setting loading to true');
    setLoading(true);

    try {
      console.log('[OrderSuccessScreen] Using checkout URL from orderData');

      if (orderData.checkoutUrl) {
        // Wait a moment to let user see the loading state
        await new Promise(resolve => setTimeout(resolve, 500));

        Toast.show({
          type: 'success',
          text1: 'Redirecting to Payment',
          text2: 'Opening PayMongo checkout...',
        });

        console.log('[OrderSuccessScreen] Navigating to payment with checkout URL');
        onNavigateToPayment?.(orderData.checkoutUrl);
      } else {
        console.log('[OrderSuccessScreen] No checkout URL in orderData');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Checkout URL not available',
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[OrderSuccessScreen] Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to proceed to payment',
      });
      setLoading(false);
    } finally {
      console.log('[OrderSuccessScreen] Setting loading to false');
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack?.();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  return (
    <View style={[styles.container, { backgroundColor: Colors.white }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['rgba(14,165,233,0.18)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Summary</Text>
          <View style={{ width: 38 }} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Section */}
        <View style={styles.profileHeaderContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={56} color={Colors.forest} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.nameText}>Order Confirmed!</Text>
              <Text style={styles.usernameText}>
                Order #{orderData.mobileOrderId || orderData.orderId || 'N/A'}
              </Text>
              <Text style={styles.statusText}>
                Review your order details and proceed to payment.
              </Text>
            </View>
          </View>
        </View>

        {/* Products Section */}
        {renderSection(
          `Products (${(orderData.items?.length || 1)})`,
          <>
            {orderData.item && !orderData.items && (
              <View style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {orderData.item?.product_name}
                  </Text>
                  {(orderData.item?.variant_color || orderData.item?.variant_size) && (
                    <Text style={styles.productVariant}>
                      {orderData.item?.variant_color && `${orderData.item.variant_color}`}
                      {orderData.item?.variant_color && orderData.item?.variant_size ? ', ' : ''}
                      {orderData.item?.variant_size && `${orderData.item.variant_size}`}
                    </Text>
                  )}
                </View>
                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>
                    ₱{(orderData.item?.product_price_member || 0).toLocaleString()}
                  </Text>
                  <Text style={styles.productQty}>x{orderData.item?.quantity}</Text>
                </View>
              </View>
            )}

            {orderData.items && orderData.items.length > 0 && (
              <View style={{ gap: 12 }}>
                {orderData.items.map((item, index) => (
                  <View key={index} style={styles.productRow}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {item?.product_name || 'Unknown Product'}
                      </Text>
                      {(item?.variant_color || item?.variant_size) && (
                        <Text style={styles.productVariant}>
                          {item?.variant_color && `${item.variant_color}`}
                          {item?.variant_color && item?.variant_size ? ', ' : ''}
                          {item?.variant_size && `${item.variant_size}`}
                        </Text>
                      )}
                    </View>
                    <View style={styles.productPriceContainer}>
                      <Text style={styles.productPrice}>
                        ₱{(item?.product_price_member || 0).toLocaleString()}
                      </Text>
                      <Text style={styles.productQty}>x{item?.quantity}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Delivery Address Section */}
        {renderSection('Delivery Address', (
          <>
            {renderInfoRow('Name', orderData.selectedAddress.full_name, 'person')}
            {renderInfoRow('Phone', orderData.selectedAddress.phone, 'call')}
            {renderInfoRow('Address', orderData.selectedAddress.full_address, 'location')}
          </>
        ))}

        {/* Payment Method Section */}
        {renderSection('Payment Method', (
          renderInfoRow('Method', orderData.selectedPaymentMethod.toUpperCase(), 'card')
        ))}

        {/* Order Summary Section */}
        {renderSection('Order Summary', (
          <>
            {renderInfoRow('Subtotal', `₱${orderData.subtotal.toLocaleString()}`)}
            {orderData.shopDiscount > 0 && (
              renderInfoRow('Member Discount', `-₱${orderData.shopDiscount.toLocaleString()}`)
            )}
            {orderData.voucherDiscount > 0 && (
              renderInfoRow('Voucher Discount', `-₱${orderData.voucherDiscount.toLocaleString()}`)
            )}
            {orderData.shippingCost > 0 && (
              renderInfoRow('Shipping', `₱${orderData.shippingCost.toLocaleString()}`)
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalPrice}>₱{orderData.total.toLocaleString()}</Text>
            </View>
          </>
        ))}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.6 }]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.7}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="card" size={18} color={Colors.white} />
              <Text style={styles.payBtnText}>Proceed to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.sky} />
            <Text style={styles.loadingText}>Processing payment...</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    padding: 0,
    paddingBottom: 40,
  },
  profileHeaderContainer: {
    borderRadius: 0,
    marginBottom: 0,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: '#e5e7eb',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  profileHeader: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
    width: '100%',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
    textAlign: 'center',
  },
  usernameText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.sky,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    borderColor: '#e5e7eb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionContent: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  productVariant: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  productPriceContainer: {
    alignItems: 'flex-end',
    gap: 2,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.sky,
  },
  productQty: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.sky,
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  payBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.sky,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
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
    backgroundColor: Colors.white,
    minWidth: 200,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.text,
    marginTop: 16,
  },
});
