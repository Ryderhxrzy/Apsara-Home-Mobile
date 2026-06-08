import React, { useEffect } from "react"
import {  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { Colors } from "../constants/colors"
import styles from "../styles/AFHomeAffiliateScreen.styles"

interface AFHomeAffiliateScreenProps {
  onClose: () => void
}

export default function AFHomeAffiliateScreen({
  onClose,
}: AFHomeAffiliateScreenProps) {
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [onClose])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AF Home Affiliate</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Earn From Home. Build a Team. Upgrade Lives.
          </Text>
          <Text style={styles.heroSubtitle}>
            AF Home is a home and lifestyle affiliate ecosystem where you earn
            commissions, enjoy lifetime discounts, and grow with a community.
          </Text>
          <Text style={styles.heroTag}>
            No inventory. No capital. Just real products, real earnings.
          </Text>
          <TouchableOpacity style={styles.cta}>
            <Text style={styles.ctaText}>Join as an Affiliate — It's Free</Text>
          </TouchableOpacity>
        </View>

        {/* Experience Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.sectionSubtitle}>
            More Than Products. A Better Home Experience.
          </Text>
          <Text style={styles.sectionDescription}>
            As an AF Home Affiliate, you don't just promote furniture. You help
            people create better living spaces - homes that feel comfortable,
            functional, and inspiring.
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
              <Text style={styles.benefitText}>
                Products designed for real Filipino homes
              </Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
              <Text style={styles.benefitText}>
                Styles for condos, houses, offices, and families
              </Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
              <Text style={styles.benefitText}>
                Quality materials at factory-direct prices
              </Text>
            </View>
            <View style={styles.benefit}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.sky} />
              <Text style={styles.benefitText}>
                Solutions people actually use every day
              </Text>
            </View>
          </View>
        </View>

        {/* How It Works Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Simple Process</Text>
          <Text style={styles.sectionSubtitle}>How It Works</Text>
          <Text style={styles.sectionDescription}>
            Start earning in 3 easy steps - no experience needed.
          </Text>

          <View style={styles.stepsContainer}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>01</Text>
              </View>
              <Text style={styles.stepTitle}>Register for Free</Text>
              <Text style={styles.stepDescription}>
                Sign up as an AF Home affiliate in minutes. No fees, no
                inventory, no capital required.
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>02</Text>
              </View>
              <Text style={styles.stepTitle}>Share Products</Text>
              <Text style={styles.stepDescription}>
                Get your unique affiliate link. Share AF Home products to your
                family, friends, and social media followers.
              </Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>03</Text>
              </View>
              <Text style={styles.stepTitle}>Earn & Enjoy</Text>
              <Text style={styles.stepDescription}>
                Collect commissions on every successful sale. Plus, enjoy
                lifetime discounts on all AF Home products for yourself.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.cta}>
            <Text style={styles.ctaText}>Get Started - It's Free</Text>
          </TouchableOpacity>
        </View>

        {/* How You Earn Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How You Earn</Text>
          <Text style={styles.sectionSubtitle}>Earn Every Time You Share.</Text>
          <Text style={styles.sectionDescription}>
            When someone buys using your affiliate link, you earn
            commissions—simple as that.
          </Text>

          <View style={styles.earnBenefits}>
            <View style={styles.earnBenefit}>
              <Ionicons name="trending-up" size={20} color={Colors.sky} />
              <Text style={styles.earnBenefitText}>
                Earn commissions on every successful order
              </Text>
            </View>
            <View style={styles.earnBenefit}>
              <Ionicons name="bar-chart" size={20} color={Colors.sky} />
              <Text style={styles.earnBenefitText}>
                Track sales and earnings in real time
              </Text>
            </View>
            <View style={styles.earnBenefit}>
              <Ionicons name="infinite" size={20} color={Colors.sky} />
              <Text style={styles.earnBenefitText}>
                No limit to how much you can earn
              </Text>
            </View>
            <View style={styles.earnBenefit}>
              <Ionicons name="heart" size={20} color={Colors.sky} />
              <Text style={styles.earnBenefitText}>
                Get paid while helping others upgrade their homes
              </Text>
            </View>
          </View>

          <View style={styles.flowContainer}>
            <View style={styles.flowStep}>
              <Text style={styles.flowStepLabel}>You</Text>
              <Text style={styles.flowStepDesc}>Join as an affiliate</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.sky} />
            <View style={styles.flowStep}>
              <Text style={styles.flowStepLabel}>Share Link</Text>
              <Text style={styles.flowStepDesc}>Post on social media</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color={Colors.sky} />
            <View style={styles.flowStep}>
              <Text style={styles.flowStepLabel}>Commission</Text>
              <Text style={styles.flowStepDesc}>You get paid!</Text>
            </View>
          </View>
        </View>

        {/* Lifetime Discounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Lifetime Discounts & Personal Benefits
          </Text>
          <Text style={styles.sectionSubtitle}>
            Save for Life, Not Just Once.
          </Text>
          <Text style={styles.sectionDescription}>
            As an AF Home Affiliate, you enjoy lifetime member discounts on
            products—whether you're buying for yourself, your family, or your
            projects.
          </Text>

          <View style={styles.discountBenefits}>
            <View style={styles.discountBenefit}>
              <Ionicons name="pricetag" size={20} color={Colors.sky} />
              <Text style={styles.discountBenefitText}>
                Exclusive member pricing
              </Text>
            </View>
            <View style={styles.discountBenefit}>
              <Ionicons name="time" size={20} color={Colors.sky} />
              <Text style={styles.discountBenefitText}>
                Use discounts anytime
              </Text>
            </View>
            <View style={styles.discountBenefit}>
              <Ionicons name="home" size={20} color={Colors.sky} />
              <Text style={styles.discountBenefitText}>
                Perfect for renovations
              </Text>
            </View>
            <View style={styles.discountBenefit}>
              <Ionicons name="wallet" size={20} color={Colors.sky} />
              <Text style={styles.discountBenefitText}>
                Maximize your margins
              </Text>
            </View>
          </View>
        </View>

        {/* Build a Team Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Build a Team & Referral System
          </Text>
          <Text style={styles.sectionSubtitle}>
            Build a Team. Grow Together.
          </Text>
          <Text style={styles.sectionDescription}>
            Invite others to become affiliates and build your own network. The
            more your community grows, the more opportunities you unlock.
          </Text>

          <View style={styles.teamBenefits}>
            <View style={styles.teamBenefit}>
              <Ionicons name="people" size={20} color={Colors.sky} />
              <Text style={styles.teamBenefitText}>
                Refer friends & professionals
              </Text>
            </View>
            <View style={styles.teamBenefit}>
              {/* @ts-ignore */}
              <Ionicons name="handshake" size={20} color={Colors.sky} />
              <Text style={styles.teamBenefitText}>Grow together</Text>
            </View>
            <View style={styles.teamBenefit}>
              <Ionicons name="trending-up" size={20} color={Colors.sky} />
              <Text style={styles.teamBenefitText}>Scalable income</Text>
            </View>
          </View>
        </View>

        {/* Trainings & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trainings, Events & Support</Text>
          <Text style={styles.sectionSubtitle}>
            You're Never Doing This Alone.
          </Text>
          <Text style={styles.sectionDescription}>
            AF Home provides ongoing training, tools, and events to help
            affiliates succeed—whether you're a beginner or experienced seller.
          </Text>

          <View style={styles.supportItems}>
            <View style={styles.supportItem}>
              <Ionicons name="school" size={20} color={Colors.sky} />
              <Text style={styles.supportItemText}>
                Affiliate onboarding sessions
              </Text>
            </View>
            <View style={styles.supportItem}>
              <Ionicons name="book" size={20} color={Colors.sky} />
              <Text style={styles.supportItemText}>
                Product & selling trainings
              </Text>
            </View>
            <View style={styles.supportItem}>
              <Ionicons name="megaphone" size={20} color={Colors.sky} />
              <Text style={styles.supportItemText}>
                Content and marketing tips
              </Text>
            </View>
            <View style={styles.supportItem}>
              <Ionicons name="calendar" size={20} color={Colors.sky} />
              <Text style={styles.supportItemText}>
                Online and in-person events
              </Text>
            </View>
          </View>
        </View>

        {/* Who This Is For Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Who This Is For</Text>
          <Text style={styles.sectionSubtitle}>This Is for You If...</Text>

          <View style={styles.audienceItems}>
            <View style={styles.audienceItem}>
              <View style={styles.audienceBullet} />
              <Text style={styles.audienceText}>
                You want to earn without stocking products
              </Text>
            </View>
            <View style={styles.audienceItem}>
              <View style={styles.audienceBullet} />
              <Text style={styles.audienceText}>
                You create content on social media
              </Text>
            </View>
            <View style={styles.audienceItem}>
              <View style={styles.audienceBullet} />
              <Text style={styles.audienceText}>
                You help people find home solutions
              </Text>
            </View>
            <View style={styles.audienceItem}>
              <View style={styles.audienceBullet} />
              <Text style={styles.audienceText}>
                You want extra income or a scalable business
              </Text>
            </View>
            <View style={styles.audienceItem}>
              <View style={styles.audienceBullet} />
              <Text style={styles.audienceText}>
                You believe homes should be better, not more expensive
              </Text>
            </View>
          </View>

          <View style={styles.testimonial}>
            <Text style={styles.testimonialText}>
              "Whether you're looking for a side hustle or a full-time career,
              AF Home gives you the platform to succeed on your own terms."
            </Text>
          </View>

          <TouchableOpacity style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Join AF Home Today</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  )
}
