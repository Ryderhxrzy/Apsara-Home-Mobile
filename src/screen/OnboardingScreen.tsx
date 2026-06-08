import React, { useRef, useState } from "react"
import {  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import styles from "../styles/OnboardingScreen.styles"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")

interface Slide {
  key: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  eyebrow: string
  titlePlain: string
  titleAccent: string
  subtitle: string
  badge?: string
  bulletPoints?: string[]
  cards?: {
    number: string
    icon: keyof typeof Ionicons.glyphMap
    title: string
    description: string
  }[]
}

const SLIDES: Slide[] = [
  {
    key: "1",
    icon: "home-outline",
    iconColor: Colors.sky,
    iconBg: "#e0f2fe",
    eyebrow: "Welcome to AF Home",
    titlePlain: "Earn From Home.\nBuild a Team.\n",
    titleAccent: "Upgrade Lives.",
    subtitle:
      "AF Home is a home and lifestyle affiliate ecosystem where you earn commissions, enjoy lifetime discounts, and grow with a community.",
    badge: "No inventory. No capital. Just real products, real earnings.",
  },
  {
    key: "2",
    icon: "home-outline",
    iconColor: Colors.sky,
    iconBg: "#e0f2fe",
    eyebrow: "SIMPLE PROCESS",
    titlePlain: "How It ",
    titleAccent: "Works",
    subtitle: "Start earning in 3 easy steps - no experience needed.",
    cards: [
      {
        number: "01",
        icon: "person-add-outline",
        title: "Register for Free",
        description:
          "Sign up as an AF Home affiliate in minutes. No fees, no inventory, no capital required.",
      },
      {
        number: "02",
        icon: "share-social-outline",
        title: "Share Products",
        description:
          "Get your unique affiliate link. Share AF Home products to your family, friends, and social media followers.",
      },
      {
        number: "03",
        icon: "wallet-outline",
        title: "Earn & Enjoy",
        description:
          "Collect commissions on every successful sale. Plus, enjoy lifetime discounts on all AF Home products for yourself.",
      },
    ],
  },
  {
    key: "3",
    icon: "people-outline",
    iconColor: Colors.sky,
    iconBg: "#e0f2fe",
    eyebrow: "ONE ECOSYSTEM",
    titlePlain: "One Ecosystem.\nMany Trusted ",
    titleAccent: "Home Brands.",
    subtitle:
      "AF Home brings together furniture, home essentials, and interior solutions under one affiliate-friendly platform, giving you more ways to earn.",
  },
  {
    key: "4",
    icon: "person-outline",
    iconColor: Colors.sky,
    iconBg: "#e0f2fe",
    eyebrow: "WHO THIS IS FOR",
    titlePlain: "This Is for You ",
    titleAccent: "If...",
    subtitle:
      "Whether you're looking for a side hustle or a full-time career, AF Home gives you the platform to succeed on your own terms.",
    bulletPoints: [
      "You want to earn without stocking products",
      "You create content on social media",
      "You help people find home solutions",
      "You want extra income or a scalable business",
      "You believe homes should be better, not more expensive",
    ],
  },
]

interface OnboardingScreenProps {
  onDone: () => void
}

export default function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<FlatList>(null)
  const insets = useSafeAreaInsets()

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveIndex(index)
  }

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true })
    } else {
      onDone()
    }
  }

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top image */}
        {item.key === "1" && (
          <Image
            source={require("../../assets/on-boarding/earn_from_home.png")}
            style={styles.slideImage}
            resizeMode="contain"
          />
        )}
        {item.key === "2" && (
          <Image
            source={require("../../assets/on-boarding/how_it_works.png")}
            style={styles.slideImage}
            resizeMode="contain"
          />
        )}
        {item.key === "3" && (
          <Image
            source={require("../../assets/on-boarding/one_eco_system.png")}
            style={styles.slideImage}
            resizeMode="contain"
          />
        )}
        {item.key === "4" && (
          <Image
            source={require("../../assets/on-boarding/this_is_for_you_if.png")}
            style={styles.slideImage}
            resizeMode="contain"
          />
        )}

        {/* Title */}
        <Text style={styles.title}>
          {item.titlePlain}
          <Text style={[styles.titleAccent, { color: item.iconColor }]}>
            {item.titleAccent}
          </Text>
        </Text>

        {/* Subtitle for non-fourth pages */}
        {item.key !== "4" && (
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        )}

        {/* Badge */}
        {item.badge && item.key !== "4" && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: item.iconBg + "30",
                borderColor: item.iconColor + "60",
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: item.iconColor }]}>
              {item.badge}
            </Text>
          </View>
        )}

        {/* Bullet points for fourth page */}
        {item.bulletPoints && (
          <View style={styles.bulletPointsContainer}>
            {item.bulletPoints.map((point, index) => {
              let iconName: keyof typeof Ionicons.glyphMap = "checkmark-circle"

              // Set icon based on content
              if (point.includes("earn without stocking")) {
                iconName = "wallet-outline"
              } else if (point.includes("content on social media")) {
                iconName = "camera-outline"
              } else if (point.includes("help people find home")) {
                iconName = "home-outline"
              } else if (point.includes("extra income")) {
                iconName = "trending-up-outline"
              } else if (point.includes("homes should be better")) {
                iconName = "heart-outline"
              }

              return (
                <View key={index} style={styles.bulletPoint}>
                  <View
                    style={[
                      styles.iconContainer,
                      {
                        backgroundColor: item.iconBg + "20",
                        borderColor: item.iconColor + "30",
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={18}
                      color={item.iconColor}
                    />
                  </View>
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Subtitle for fourth page (moved to bottom) */}
        {item.key === "4" && (
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        )}

        {/* Trusted by top brands section for third page */}
        {item.key === "3" && (
          <View style={styles.brandsSection}>
            <Text style={styles.brandsTitle}>TRUSTED BY TOP BRANDS</Text>
            <View style={styles.brandsGrid}>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/affordahome.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/airpro.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/furnigo.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/sunnyware.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/xiaomi.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.brandItem}>
                <Image
                  source={require("../../assets/on-boarding/zooey.png")}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}

        {/* Cards for second slide */}
        {item.cards && (
          <View style={styles.cardsWrapper}>
            {item.cards.map((card, index) => (
              <View key={index} style={styles.stepRow}>
                {/* Step number */}
                <Text style={styles.stepNumber}>{card.number}</Text>

                {/* Step content */}
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{card.title}</Text>
                  <Text style={styles.stepDescription}>{card.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )

  const isLast = activeIndex === SLIDES.length - 1

  return (
    <View style={styles.container}>
      {/* Background circle for all slides */}
      {(activeIndex === 0 ||
        activeIndex === 1 ||
        activeIndex === 2 ||
        activeIndex === 3) && (
        <View
          style={[
            styles.backgroundCircle,
            { backgroundColor: SLIDES[activeIndex].iconBg },
          ]}
        />
      )}

      <SafeAreaView style={styles.safeArea}>
        {/* Skip */}
        {!isLast && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={onDone}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Slides */}
        <FlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.list}
        />
      </SafeAreaView>

      {/* Bottom: dots and next button */}
      <View
        style={[styles.bottom, { paddingBottom: Math.max(32, insets.bottom) }]}
      >
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i && styles.dotActive,
                activeIndex === i && { backgroundColor: SLIDES[i].iconColor },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextBtn,
            { backgroundColor: SLIDES[activeIndex].iconColor },
          ]}
          onPress={goNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextBtnText}>
            {isLast ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
