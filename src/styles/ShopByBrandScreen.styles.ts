import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  // Tabs stay mounted AND laid out (absolute + opacity), so their lists keep
  // their rendered rows and re-showing a tab is an instant opacity flip — no
  // re-render, no re-fetch (mirrors how react-native-screens keeps tabs alive).
  tabPage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabPageActive: {
    opacity: 1,
    zIndex: 1,
  },
  tabPageHidden: {
    opacity: 0,
    zIndex: 0,
  },
  header: {
    borderBottomWidth: 1,
  },
  // Full preview header (cover + nav + profile + tabs) inside the feed. Bleeds
  // past the list's 5px content padding so the cover spans edge-to-edge.
  previewHeader: {
    borderBottomWidth: 1,
  },
  // Compact bar that fades in on scroll (home) / is fixed (products, categories).
  compactBarFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  compactBarStatic: {
    borderBottomWidth: 1,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 2,
  },
  tabBarCompact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  tabItemCompact: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabTextCompact: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabIndicatorCompact: {
    position: "absolute",
    bottom: 0,
    left: "18%",
    right: "18%",
    height: 2.5,
    borderRadius: 1.5,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    // 8px — one shared content edge with the feed sections + product grid so the
    // whole brand page lines up (matches the Shop screen's max-width).
    paddingHorizontal: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIconLeft: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchButton: {
    marginLeft: 6,
  },
  // Middle of the top bar — holds the two cross-fading layers.
  searchMiddle: {
    flex: 1,
    height: 42,
    justifyContent: "center",
  },
  searchLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  // Compact bar shown when the profile is collapsed (avatar + name + search + follow).
  compactBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  compactLogoImage: {
    width: "100%",
    height: "100%",
  },
  compactLogoFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInitial: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.white,
  },
  compactName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  compactSearchBtn: {
    padding: 4,
  },
  compactFollow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compactFollowText: {
    fontSize: 12,
    fontWeight: "700",
  },
  // Facebook-style cover banner: the search/nav row is overlaid on the image.
  coverWrapper: {
    position: "relative",
    width: "100%",
  },
  coverImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  coverScrim: {
    // Full black overlay (with opacity) over the whole cover so the overlaid
    // nav, search pill, and brand name stay legible on any cover photo.
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  // Visible strip of cover image below the nav that the avatar overlaps into.
  coverBand: {
    height: 60,
  },
  // Cover banner inside the scrollable feed (scrolls away smoothly on scroll).
  coverBanner: {
    marginHorizontal: 3,
    height: 140,
    borderRadius: 8,
    overflow: "hidden",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // 8px to match the nav, tabs, and feed sections — one consistent content edge
    // shared with the Shop screen's max-width.
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
  },
  // With a cover, the enlarged avatar overlaps up onto the banner (negative
  // margin) while the name/meta + Follow bottom-align beside it.
  brandRowOnCover: {
    alignItems: "flex-end",
    paddingTop: 8,
  },
  brandLogoOnCover: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginTop: -44,
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  brandLogo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
  },
  brandLogoImage: {
    width: "100%",
    height: "100%",
  },
  brandLogoFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  brandInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.white,
  },
  brandInfo: {
    flex: 1,
  },
  brandNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandName: {
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    // Shrink + truncate so a long brand name doesn't push the verified badge
    // out of view (the badge sits right after it).
    flexShrink: 1,
  },
  brandMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  brandMetaText: {
    fontSize: 12,
    fontWeight: "600",
  },
  brandMetaDot: {
    fontSize: 10,
    marginHorizontal: 2,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  categoriesBody: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  // Active only changes color/weight — never the size, so tabs don't resize.
  tabTextActive: {
    color: Colors.sky,
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 2.5,
    borderRadius: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  menuContainer: {
    position: "absolute",
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
})

export default styles
