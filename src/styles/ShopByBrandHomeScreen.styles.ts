import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"
const { width } = Dimensions.get("window")

export { width }
const styles = StyleSheet.create({
  voucherSectionContainer: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  voucherHeader: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voucherContent: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  voucherSubtitle: {
    fontSize: 12,
    fontWeight: "400",
  },
  vouchersGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  voucherCard: {
    width: width * 0.7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.sky,
    flexDirection: "row",
    overflow: "hidden",
    paddingVertical: 8,
  },
  voucherCardLeft: {
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  discountBox: {
    alignItems: "center",
  },
  discountText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.sky,
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.sky,
  },
  voucherCardDivider: {
    width: 1,
    height: "80%",
    backgroundColor: Colors.sky,
    opacity: 0.3,
  },
  voucherCardRight: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  voucherCardDesc: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  voucherCardCode: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  voucherCardMinSpend: {
    fontSize: 10,
    fontWeight: "400",
    marginBottom: 6,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: "600",
  },
  featuredSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuredHeaderRow: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text,
  },
  seeMoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  featuredGrid: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  featuredItemWrap: {
    width: width * 0.46,
  },
  productsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: "hidden",
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: "100%",
  },
  dummyCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  dummyImageContainer: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  dummyContent: {
    padding: 12,
    gap: 6,
  },
  dummyLine: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  dummyImage: {
    width: 40,
    height: 40,
  },
  emptyContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  bannerContainer: {
    height: 180,
    overflow: "hidden",
    borderRadius: 8,
  },
  carouselContent: {
    alignItems: "center",
  },
  bannerImage: {
    width: width,
    height: 180,
  },
  carouselIndicators: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bestProductsSection: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  bestProductsHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 0,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bestProductsTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  bestProductsGrid: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "stretch",
  },
  bestProductsBanner: {
    width: "100%",
    height: 150,
  },

  // ── Dynamic, DB-driven sections (mirrors the web MobilePhonePreview) ──
  // Banner — a single full-width image card.
  bannerSection: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  bannerSectionImage: {
    width: "100%",
    aspectRatio: 16 / 7,
  },
  // Carousel — swipeable, paginated images with dot indicators.
  carouselSection: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  carouselDots: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  // Products — titled card with an optional button and a horizontal product row.
  sectionCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  sectionHeaderRow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginLeft: 8,
  },
  loadingContainer: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  // Header wrapper around the DB sections inside the FlashList — inner 3px so the
  // cards/banners line up at ~8px with the masonry items below.
  headerWrap: {
    // 10px inset — the shared content edge used by the brand header rows (nav,
    // brand profile, tabs) so the feed sections line up exactly with them.
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  // "For You" — a plain label (no card background) above the masonry feed.
  forYouLabel: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 8,
    // Sits inside headerWrap's 12px inset already — no extra padding needed.
    paddingHorizontal: 0,
  },
  // Masonry feed (mirrors the Shop screen's grid spacing).
  forYouListContent: {
    // No horizontal padding here — it would inset the whole list, including the
    // brand header + cover photo. The header bleeds edge-to-edge; the sections
    // carry their own 10px inset instead.
    paddingBottom: 24,
  },
  forYouItem: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  // Masonry skeleton (first-load placeholder)
  skelWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  skelCol: {
    flex: 1,
    gap: 8,
  },
  skelCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  skelImage: {
    width: "100%",
  },
  skelBody: {
    padding: 10,
    gap: 6,
  },
  skelLine: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  footerText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Text block — rich-text body with an optional image below it.
  textCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    padding: 10,
  },
  textImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 6,
    marginTop: 8,
  },
})

export default styles
