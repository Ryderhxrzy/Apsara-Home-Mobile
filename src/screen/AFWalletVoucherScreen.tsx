import React, { useEffect } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
  FlatList,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { Colors } from "../constants/colors"
import { useWalletVoucher } from "../hooks/query/useWallet"
import styles from "../styles/AFWalletVoucherScreen.styles"

interface AFWalletVoucherScreenProps {
  isDarkMode?: boolean
  onClose?: () => void
  token?: string | null
}

const peso = (value: number) => {
  return `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  } catch {
    return "-"
  }
}

interface VoucherCardProps {
  code: string
  amount: number
  status: string
  expiresAt?: string | null
  usedCount?: number | null
  maxUses?: number | null
  isDarkMode: boolean
}

function VoucherCard({
  code,
  amount,
  status,
  expiresAt,
  usedCount,
  maxUses,
  isDarkMode,
}: VoucherCardProps) {
  const colors = {
    bg: isDarkMode ? "#1e293b" : "#f8fafc",
    border: isDarkMode ? "#374151" : "#e5e7eb",
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    statusBg:
      status === "redeemed"
        ? isDarkMode
          ? "#7f1d1d"
          : "#fee2e2"
        : status === "expired"
          ? isDarkMode
            ? "#4b5563"
            : "#f3f4f6"
          : isDarkMode
            ? "#064e3b"
            : "#ecfdf5",
    statusText:
      status === "redeemed"
        ? isDarkMode
          ? "#fca5a5"
          : "#dc2626"
        : status === "expired"
          ? isDarkMode
            ? "#d1d5db"
            : "#6b7280"
          : isDarkMode
            ? "#6ee7b7"
            : "#059669",
  }

  return (
    <View
      style={[
        styles.voucherCard,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <View style={styles.voucherHeader}>
        <View style={styles.voucherCodeSection}>
          <Text style={[styles.voucherCode, { color: colors.text }]}>
            {code}
          </Text>
          <Text style={[styles.voucherAmount, { color: colors.text }]}>
            {peso(amount)}
          </Text>
        </View>
        <View
          style={[styles.voucherStatus, { backgroundColor: colors.statusBg }]}
        >
          <Text
            style={[styles.voucherStatusText, { color: colors.statusText }]}
          >
            {status === "redeemed"
              ? "Redeemed"
              : status === "expired"
                ? "Expired"
                : "Available"}
          </Text>
        </View>
      </View>

      <View
        style={[styles.voucherDivider, { borderBottomColor: colors.border }]}
      />

      <View style={styles.voucherDetails}>
        {expiresAt && (
          <View style={styles.voucherDetailRow}>
            <Text
              style={[styles.voucherDetailLabel, { color: colors.textSec }]}
            >
              Expires:
            </Text>
            <Text style={[styles.voucherDetailValue, { color: colors.text }]}>
              {formatDate(expiresAt)}
            </Text>
          </View>
        )}
        {maxUses !== null && maxUses !== undefined && (
          <View style={styles.voucherDetailRow}>
            <Text
              style={[styles.voucherDetailLabel, { color: colors.textSec }]}
            >
              Usage:
            </Text>
            <Text style={[styles.voucherDetailValue, { color: colors.text }]}>
              {usedCount || 0} of {maxUses}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

export default function AFWalletVoucherScreen({
  isDarkMode = false,
  onClose,
  token,
}: AFWalletVoucherScreenProps) {
  const insets = useSafeAreaInsets()
  const { data, isLoading: loading } = useWalletVoucher({ token })
  const walletData = data?.summary ?? null
  const vouchers = data?.vouchers ?? []

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onClose?.()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onClose])

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    cardBg: isDarkMode ? "#1e293b" : "#f8fafc",
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(59,130,246,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
            borderBottomColor: isDarkMode ? "#374151" : "#e5e7eb",
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={isDarkMode ? "#e5e7eb" : Colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.headerGreeting,
                { color: isDarkMode ? "#f8fafc" : Colors.text },
              ]}
            >
              AF Voucher
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#9ca3af" : Colors.textSecondary },
              ]}
            >
              Voucher & Balance
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isDarkMode ? "#38bdf8" : "#0ea5e9"}
            />
          </View>
        ) : (
          <>
            {/* Balance Section */}
            {walletData && (
              <View
                style={[
                  styles.balanceSection,
                  {
                    backgroundColor: colors.containerBg,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Balance Overview
                </Text>

                <View style={styles.balanceGrid}>
                  <View
                    style={[
                      styles.balanceBox,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.balanceLabel, { color: colors.textSec }]}
                    >
                      AF Voucher Balance
                    </Text>
                    <Text style={[styles.balanceValue, { color: colors.text }]}>
                      {peso(walletData.af_voucher_balance || 0)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.balanceBox,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.balanceLabel, { color: colors.textSec }]}
                    >
                      Reserved/Pending
                    </Text>
                    <Text style={[styles.balanceValue, { color: colors.text }]}>
                      {peso(walletData.af_voucher_reserved_balance || 0)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.balanceBox,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.balanceLabel, { color: colors.textSec }]}
                    >
                      Available Balance
                    </Text>
                    <Text style={[styles.balanceValue, { color: colors.text }]}>
                      {peso(walletData.af_voucher_source_balance || 0)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Vouchers List */}
            <View style={styles.vouchersSection}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: colors.text, marginBottom: 12 },
                ]}
              >
                Your Vouchers ({vouchers.length})
              </Text>

              {vouchers.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    {
                      backgroundColor: colors.containerBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="ticket-outline"
                    size={48}
                    color={colors.textSec}
                  />
                  <Text style={[styles.emptyStateText, { color: colors.text }]}>
                    No vouchers yet
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateSubtext,
                      { color: colors.textSec },
                    ]}
                  >
                    Create a voucher to share with customers
                  </Text>
                </View>
              ) : (
                <FlatList
                  scrollEnabled={false}
                  data={vouchers}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={({ item }) => (
                    <VoucherCard
                      code={item.code}
                      amount={item.amount}
                      status={item.status}
                      expiresAt={item.expires_at}
                      usedCount={item.used_count}
                      maxUses={item.max_uses}
                      isDarkMode={isDarkMode}
                    />
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}
