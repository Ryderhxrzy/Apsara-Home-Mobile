import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  // Content lifts off the sky gradient with a rounded top (same hero treatment
  // as Home), which also gives the top of the list breathing room.
  sheet: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    marginTop: 6,
    paddingTop: 6,
  },
  flatList: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flatListContent: {
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  filterInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "transparent",
    borderBottomWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 8,
  },
  viewToggleWrapper: {
    flexDirection: "row",
    gap: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  viewToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRightWidth: 0,
    backgroundColor: "transparent",
  },
  viewToggleButtonActive: {
    backgroundColor: Colors.sky,
  },
  viewToggleButtonLast: {
    borderRightWidth: 0,
  },
  viewToggleText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.text,
  },
  viewToggleTextActive: {
    color: Colors.white,
  },
  productCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productCountInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterLoadingIndicator: {
    marginLeft: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 0,
    paddingBottom: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: "100%",
  },
  gridItem: {
    paddingHorizontal: 3,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 5,
    // Space so the first product row isn't flush against the product-count bar.
    paddingTop: 14,
    paddingBottom: 24,
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
  dummyImage: {
    width: "60%",
    height: "60%",
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
  emptyContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    borderWidth: 1,
    borderColor: Colors.sky,
  },
  paginationButtonDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },
  paginationText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.sky,
  },
  paginationTextDisabled: {
    color: Colors.textSecondary,
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  // ─── View-mode toolbar ───────────────────────────────────────────────────
  viewToolbar: {
    flexDirection: "row",
    alignItems: "center",
    // Only the view-mode toggle remains (product count removed), kept right-aligned.
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    // Breathing room above the view-option bar so it isn't stuck to the filters.
    marginTop: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  viewToolbarCount: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  viewToggleGroup: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  viewModeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  // ─── List-mode row card ──────────────────────────────────────────────────
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
    marginHorizontal: 4,
  },
  listRowThumb: {
    width: 100,
    height: 100,
    flexShrink: 0,
    position: "relative",
  },
  listRowImg: {
    width: "100%",
    height: "100%",
  },
  listRowDiscount: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#ef4444",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  listRowDiscountText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  listRowDetails: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  listRowBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  listRowBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  listRowName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  listRowBrandText: {
    fontSize: 11,
    fontWeight: "500",
  },
  listRowPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  listRowPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.sky,
  },
  listRowSrp: {
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  listRowPv: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  listRowWishlistArea: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignSelf: "center",
  },
})

export default styles
