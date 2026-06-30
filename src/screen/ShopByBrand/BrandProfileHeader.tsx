import React from "react"
import { View, Text, TextInput, TouchableOpacity } from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { BadgeCheck } from "lucide-react-native"
import Ionicons from "../../components/ui/Icon"
import { Colors } from "../../constants/colors"
import styles from "../../styles/ShopByBrandScreen.styles"

type TabKey = "home" | "products" | "categories"

interface BrandProfileHeaderProps {
  brandName?: string
  brandLogo?: string | null
  brandInitial: string
  coverPhoto?: string | null
  searchQuery: string
  onSearchChange: (text: string) => void
  onBack: () => void
  onMenuPress: () => void
  isFollowing: boolean
  followLoading: boolean
  onFollowPress: () => void
  selectedTab: TabKey
  onTabChange: (tab: TabKey) => void
  isDarkMode?: boolean
}

/**
 * The brand-store header (cover + overlaid nav + profile + tabs) — mirrors the
 * web MobilePhonePreview. Rendered full-width at the top of each tab's scroll so
 * it scrolls away naturally; the parent fades in a compact bar on scroll.
 */
export default function BrandProfileHeader({
  brandName,
  brandLogo,
  brandInitial,
  coverPhoto,
  searchQuery,
  onSearchChange,
  onBack,
  onMenuPress,
  isFollowing,
  followLoading,
  onFollowPress,
  selectedTab,
  onTabChange,
  isDarkMode = false,
}: BrandProfileHeaderProps) {
  const insets = useSafeAreaInsets()

  const themeColors = {
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSecondary: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    cardBg: isDarkMode ? "#1f2937" : Colors.white,
    cardBorder: isDarkMode ? "#374151" : "#e5e7eb",
    searchBg: isDarkMode ? "#0f172a" : "#f1f5f9",
    followingBg: isDarkMode ? "rgba(14,165,233,0.15)" : "#e0f2fe",
  }

  const hasCover = !!coverPhoto
  const navIconColor = hasCover ? "#ffffff" : themeColors.text
  const navSearchBg = hasCover ? "rgba(255,255,255,0.92)" : themeColors.searchBg
  const navSearchText = hasCover ? Colors.text : themeColors.text
  const navSearchPlaceholder = hasCover
    ? Colors.textSecondary
    : themeColors.textSecondary

  return (
    <View
      style={[
        styles.previewHeader,
        {
          backgroundColor: themeColors.cardBg,
          borderBottomColor: themeColors.cardBorder,
        },
      ]}
    >
      <View style={hasCover ? styles.coverWrapper : undefined}>
        {hasCover ? (
          <>
            <Image
              source={{ uri: coverPhoto as string }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.coverScrim} />
          </>
        ) : null}

        <View
          style={[
            styles.searchRow,
            { paddingTop: insets.top + 8, paddingBottom: hasCover ? 8 : 0 },
          ]}
        >
          <TouchableOpacity
            onPress={onBack}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons name="chevron-back" size={24} color={navIconColor} />
          </TouchableOpacity>
          <View
            style={[styles.searchWrapper, { backgroundColor: navSearchBg }]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={navSearchPlaceholder}
              style={styles.searchIconLeft}
            />
            <TextInput
              style={[styles.searchInput, { color: navSearchText }]}
              placeholder={`Search in ${brandName ?? "this brand"}`}
              placeholderTextColor={navSearchPlaceholder}
              value={searchQuery}
              onChangeText={onSearchChange}
              returnKeyType="search"
            />
            {!!searchQuery && (
              <TouchableOpacity
                onPress={() => onSearchChange("")}
                style={styles.clearSearchButton}
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={navSearchPlaceholder}
                />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={onMenuPress}
            style={styles.iconButton}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={navIconColor} />
          </TouchableOpacity>
        </View>

        {hasCover ? <View style={styles.coverBand} /> : null}
      </View>

      <View style={[styles.brandRow, hasCover && styles.brandRowOnCover]}>
        <View
          style={[
            styles.brandLogo,
            { borderColor: themeColors.cardBorder },
            hasCover && styles.brandLogoOnCover,
          ]}
        >
          {brandLogo ? (
            <Image
              source={{ uri: brandLogo }}
              style={styles.brandLogoImage}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View style={styles.brandLogoFallback}>
              <Text style={styles.brandInitial}>{brandInitial}</Text>
            </View>
          )}
        </View>

        <View style={styles.brandInfo}>
          <View style={styles.brandNameRow}>
            <Text
              style={[styles.brandName, { color: themeColors.text }]}
              numberOfLines={1}
            >
              {brandName ?? "Brand"}
            </Text>
            <BadgeCheck
              size={16}
              color="#ffffff"
              fill={Colors.sky}
              style={{ marginLeft: 4 }}
            />
          </View>
          <View style={styles.brandMetaRow}>
            <Ionicons name="star" size={13} color="#fbbf24" />
            <Text style={[styles.brandMetaText, { color: themeColors.text }]}>
              4.8
            </Text>
            <Text
              style={[
                styles.brandMetaDot,
                { color: themeColors.textSecondary },
              ]}
            >
              •
            </Text>
            <Ionicons
              name="people"
              size={12}
              color={themeColors.textSecondary}
            />
            <Text
              style={[
                styles.brandMetaText,
                { color: themeColors.textSecondary },
              ]}
            >
              12.5K followers
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onFollowPress}
          disabled={followLoading}
          style={[
            styles.followButton,
            isFollowing
              ? { backgroundColor: themeColors.followingBg }
              : { backgroundColor: Colors.sky },
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isFollowing ? "heart" : "heart-outline"}
            size={15}
            color={isFollowing ? Colors.sky : Colors.white}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.followButtonText,
              { color: isFollowing ? Colors.sky : Colors.white },
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab strip (Home / Products / Categories) */}
      <View style={styles.tabBar}>
        {(["home", "products", "categories"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={styles.tabItem}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: themeColors.textSecondary },
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
            {selectedTab === tab && (
              <View
                style={[styles.tabIndicator, { backgroundColor: Colors.sky }]}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
