import { Dimensions, StyleSheet } from "react-native"
import { Colors } from "../constants/colors"
import { palette, radius, shadow } from "../theme/theme"

export const BANNER_HEIGHT = 190
export const SCREEN_WIDTH = Dimensions.get("window").width

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.slate50 },
  // gap: 0 so the alternating section bands sit flush against each other —
  // no main-background line peeking between them. Spacing below the banner is
  // handled by `bannerShell.marginBottom`; the last band fills to the bottom
  // via `sectionBlockLast`.
  content: { paddingHorizontal: 8, paddingTop: 4, paddingBottom: 0, gap: 0 },
  loadingWrap: { paddingVertical: 42, alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, color: Colors.textSecondary },
  bannerShell: {
    gap: 10,
    marginBottom: 14,
  },

  // ── Sponsored zone (under the banner, inside the hero fade) ──────────────
  // Each hero ad row is its own wrapper so it can fade independently on scroll.
  sponsoredColsWrap: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  portraitWrap: {
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  sponsoredCols: {
    flexDirection: "row",
    gap: 10,
  },
  // Each sponsored column is its own panel (themed background applied inline),
  // so Brands and Products read as two separate blocks.
  sponsoredCol: {
    flex: 1,
    gap: 6,
    borderRadius: radius.lg,
    padding: 10,
  },
  sponsoredColTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    paddingHorizontal: 2,
    textTransform: "uppercase",
  },
  sponsoredColRow: {
    gap: 8,
    paddingRight: 4,
  },
  // Shared "Ad" badge + mini sponsored card (brand & product carousels)
  adMiniBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(15,23,42,0.55)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  adMiniBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  adMiniCard: {
    width: 132,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 8,
    gap: 6,
    position: "relative",
  },
  adMiniLogo: {
    width: "100%",
    height: 72,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 10,
  },
  adMiniImageBox: {
    width: "100%",
    height: 92,
    borderRadius: 8,
    overflow: "hidden",
  },
  adMiniMedia: {
    width: "100%",
    height: "100%",
  },
  adMiniFallback: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.sky,
  },
  adMiniName: {
    fontSize: 12,
    fontWeight: "700",
  },
  adMiniMeta: {
    fontSize: 10,
    fontWeight: "500",
  },
  adMiniPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.sky,
  },
  // Optional portrait ad banner
  portraitRow: {
    gap: 10,
    paddingRight: 4,
  },
  portraitAdCard: {
    width: 152,
    height: 210,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  portraitAdGradient: {
    flex: 1,
    padding: 12,
    justifyContent: "flex-end",
    gap: 4,
  },
  portraitAdText: {
    gap: 2,
  },
  portraitAdTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  portraitAdSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 11,
    fontWeight: "600",
  },
  portraitAdCtaBtn: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  portraitAdCtaText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800",
  },
  // Leading portrait-ads carousel spacing (banner hidden).
  heroLead: {
    marginBottom: 12,
  },
  // ── One landscape ad banner ──────────────────────────────────────────────
  landscapeAd: {
    height: 116,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginHorizontal: 4,
    marginBottom: 14,
  },
  landscapeAdGradient: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: "center",
    position: "relative",
  },
  landscapeAdInfo: {
    gap: 3,
    maxWidth: "72%",
  },
  landscapeAdTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  landscapeAdSubtitle: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "600",
  },
  landscapeAdCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  landscapeAdCtaText: {
    color: "#0369a1",
    fontSize: 12,
    fontWeight: "800",
  },
  landscapeAdWatermark: {
    position: "absolute",
    right: 14,
    bottom: 10,
  },
  // ── Sponsored Brands paged carousel ──────────────────────────────────────
  brandAdSection: {
    marginBottom: 14,
    gap: 8,
  },
  brandAdPage: {
    paddingHorizontal: 4,
  },
  brandAdCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    position: "relative",
  },
  brandAdLogo: {
    width: 84,
    height: 84,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 10,
    flexShrink: 0,
  },
  brandAdInfo: {
    flex: 1,
    gap: 3,
  },
  adEyebrowSky: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: Colors.sky,
  },
  brandAdName: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  brandAdCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  brandAdCtaText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.sky,
  },
  brandAdDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 2,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: radius["2xl"],
    overflow: "hidden",
    backgroundColor: "#0f172a",
    padding: 18,
    marginRight: 12,
    justifyContent: "space-between",
    position: "relative",
    ...shadow.lg,
  },
  bannerGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -70,
    opacity: 0.22,
  },
  bannerTextWrap: {
    zIndex: 2,
    flex: 1,
    justifyContent: "center",
    paddingRight: 90,
  },
  bannerEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bannerTitle: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
    color: Colors.white,
    marginTop: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.84)",
    marginTop: 8,
  },
  bannerVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 24,
  },
  bannerIcon: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  // Overlaid on the bottom of the banner (dots inside, not below).
  pagination: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#cbd5e1",
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.sky,
  },
  section: { gap: 0, paddingHorizontal: 4 },

  // ── Unified home section band (Shopee-style alternating feed) ──────────
  // Full-bleed: marginHorizontal cancels the content's paddingHorizontal (8)
  // so each band's background runs edge-to-edge. Backgrounds alternate per
  // section and are applied inline from the theme. The thin page-bg gap
  // between bands comes from `content.gap`.
  sectionBlock: {
    marginHorizontal: -8,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 0,
  },
  // Variant for HomeProductRail — the rail pads its own header + list to 12,
  // so the band itself adds no horizontal padding (avoids a double inset and
  // keeps the rail's header aligned with its cards).
  sectionBlockRail: {
    marginHorizontal: -8,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 0,
  },
  // Applied to the final band so its background fills all the way to the bottom
  // of the scroll view instead of leaving the main page background exposed.
  sectionBlockLast: {
    paddingBottom: 16,
  },
  // Rounded top corners so the section reads as a sheet sliding up over the
  // hero fade (applied to the first content section, Popular Picks).
  sectionTopRounded: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  // "View more products" CTA below the Recommended grid → routes to Shop.
  viewMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    marginHorizontal: 4,
    paddingVertical: 13,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  // ── Hero membership card ──────────────────────────────────────────────
  heroCard: {
    borderRadius: radius["2xl"],
    padding: 18,
    marginHorizontal: 4,
    marginBottom: 2,
    overflow: "hidden",
    gap: 16,
    ...shadow.lg,
  },
  heroWatermark: {
    position: "absolute",
    right: -28,
    top: -24,
    width: 150,
    height: 150,
    opacity: 0.08,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  heroBadgeWrap: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    flexShrink: 0,
  },
  heroBadgeImg: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  heroInfo: {
    flex: 1,
    gap: 3,
  },
  heroEyebrow: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  heroLevel: {
    color: "#ffffff",
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  heroSubtext: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    lineHeight: 16,
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radius.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroStatCell: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  heroStatValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // ── Quick actions ─────────────────────────────────────────────────────
  quickActionRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 4,
  },
  quickActionCard: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.md,
  },
  quickActionGradient: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  quickActionText: {
    flex: 1,
    gap: 1,
  },
  quickActionTitle: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 13,
  },
  quickActionSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "600",
  },
  sectionEven: {
    backgroundColor: "#f0f9ff",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 18,
    gap: 0,
  },
  sectionOdd: {
    backgroundColor: "#f8fbff",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingVertical: 18,
    gap: 0,
  },
  sectionFeatured: {
    backgroundColor: "#f0f9ff",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 44,
    marginBottom: -28,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: Colors.text },
  sectionMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleRow: {
    gap: 12,
    paddingRight: 4,
  },
  // A single scrollable column in the 2-row "Shop by Rooms" strip: two room
  // circles stacked vertically.
  roomColumn: {
    gap: 18,
  },
  // Content container for the 2-row rooms strip. flexGrow + center keeps the
  // columns centered when they fit the screen, while still allowing horizontal
  // scrolling when there are enough rooms to overflow.
  roomRow: {
    gap: 18,
    paddingHorizontal: 4,
    flexGrow: 1,
    justifyContent: "center",
  },
  categoryGrid: {
    gap: 16,
  },
  // "View all" expanded layouts
  categoryGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 4,
    rowGap: 12,
  },
  brandListWrap: {
    gap: 10,
    paddingHorizontal: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: 10,
  },
  brandRowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brandRowLogo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 6,
  },
  brandRowLogoImg: {
    width: "100%",
    height: "100%",
  },
  brandRowInitial: {
    fontSize: 20,
    fontWeight: "900",
    color: Colors.sky,
  },
  brandRowInfo: {
    flex: 1,
    gap: 2,
  },
  brandRowName: {
    fontSize: 14,
    fontWeight: "800",
  },
  brandRowCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  roomGrid: {
    gap: 0,
  },
  circleItem: {
    width: 88,
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  // Shared circle used by BOTH "Shop by Rooms" and "Shop by Categories" so the
  // two strips render identically.
  browseItem: {
    width: 78,
    alignItems: "center",
    gap: 8,
  },
  browseCircleContainer: {
    position: "relative",
    width: 64,
    height: 64,
  },
  browseCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  browseBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    zIndex: 10,
  },
  browseBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  categoryCircleItem: {
    width: 88,
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  categoryBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    zIndex: 10,
  },
  categoryBadgeDark: {
    borderColor: "#111827",
  },
  categoryBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  roomItem: {
    width: 80,
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  roomCircleContainer: {
    position: "relative",
    width: 64,
    height: 64,
  },
  roomBadge: {
    position: "absolute",
    top: -2,
    right: -6,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ffffff",
    zIndex: 10,
  },
  roomBadgeDark: {
    borderColor: "#111827",
  },
  roomBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
  },
  circleImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    backgroundColor: Colors.white,
  },
  roomCircleWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#e0f2fe",
    ...shadow.sm,
  },
  roomImage: {
    width: "100%",
    height: "100%",
  },
  roomCircleFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  circleImage: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },
  categoryCircle: {
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e0f2fe",
    ...shadow.sm,
  },
  circleLabel: {
    fontSize: 12,
    textAlign: "center",
    color: Colors.text,
    fontWeight: "700",
    lineHeight: 16,
    // Reserve two lines so every item is the same height regardless of label
    // length — keeps the 2nd row of the rooms strip aligned across all columns.
    height: 32,
    width: "100%",
  },
  brandRowHorizontal: {
    paddingLeft: 0,
    paddingRight: 12,
    paddingVertical: 4,
  },
  brandSeparator: {
    width: 14,
  },
  brandCardWrap: {
    position: "relative",
  },
  brandCardFollowBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  brandCard: {
    width: 184,
    height: 196,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  brandLogoBox: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  brandDivider: {
    height: 1,
    width: "100%",
  },
  brandLogoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  brandLogoImage: {
    width: "100%",
    height: "100%",
  },
  brandLogoFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  brandFooter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  brandFooterInfo: {
    flex: 1,
    gap: 3,
  },
  brandFooterName: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  brandFooterCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  brandFooterCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  brandArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  brandFallbackInitialLarge: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: "900",
    color: Colors.white,
  },
  brandLogoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "flex-start",
    justifyContent: "flex-end",
    height: "50%",
  },
  brandOverlayContent: {
    width: "100%",
    gap: 8,
    alignItems: "flex-start",
  },
  brandCardNameOverlay: {
    fontSize: 15,
    fontWeight: "900",
    textAlign: "left",
    letterSpacing: -0.2,
  },
  brandProductCountOverlay: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  brandProductBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  brandCardImage: {
    width: "100%",
    height: "100%",
  },
  brandFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbeafe",
  },
  brandFallbackInitial: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    color: Colors.sky,
  },
  brandCardOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15,23,42,0.34)",
  },
  brandCardName: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  brandProductCount: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  brandImagesGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  brandMiniImageContainer: {
    width: "33.33%",
    height: "50%",
    overflow: "hidden",
    borderWidth: 0.25,
  },
  brandMiniImage: {
    width: "100%",
    height: "100%",
  },
  brandMiniFallback: {
    backgroundColor: "#f1f5f9",
  },
  brandNamePlate: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  featuredProductsContainer: {
    gap: 8,
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  featuredProductItem: {
    width: "100%",
  },
  sampleAdCard: {
    width: "100%",
    height: 160,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.md,
  },
  sampleAdGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 6,
  },
  sampleAdTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
  },
  sampleAdSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  sampleAdBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sampleAdBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
    textTransform: "uppercase",
  },
  featuredProductSkeleton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    height: 280,
    overflow: "hidden",
  },
  noProductsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  marketingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    minWidth: 110,
    flexShrink: 0,
  },
  marketingContent: {
    flex: 1,
    gap: 2,
  },
  marketingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text,
  },
  marketingSubtitle: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  recommendationsLoading: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  productGrid: {
    gap: 8,
  },
  emptyState: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
})

export default styles
