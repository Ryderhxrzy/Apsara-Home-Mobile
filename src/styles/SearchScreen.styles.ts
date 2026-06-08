import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    zIndex: 100,
  },
  headerBackground: {
    position: "relative",
    overflow: "hidden",
    minHeight: 90,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  liveSection: {
    backgroundColor: Colors.white,
  },
  liveLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 20,
    justifyContent: "center",
  },
  liveLoadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  liveThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  liveInfo: {
    flex: 1,
    gap: 4,
  },
  liveName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  livePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  livePrice: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.sky,
  },
  liveOriginalPrice: {
    fontSize: 11,
    color: Colors.textSecondary,
    textDecorationLine: "line-through",
  },
  liveDiscountBadge: {
    backgroundColor: "#fef2f2",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDiscountText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#ef4444",
  },
  livePvBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.sky,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  livePvText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  liveEmpty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 36,
  },
  liveEmptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: Colors.white,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
  },
  historyList: {
    gap: 0,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
  },
  historyRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  historySeeMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
  },
  historySeeMoreText: {
    fontSize: 13,
    color: Colors.sky,
    fontWeight: "600",
  },
  recsSection: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    backgroundColor: "#f5f5f5",
  },
  recsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recsTable: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: Colors.white,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  recsTableCell: {
    width: "33.333%",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  recBoxContainer: {
    width: 64,
    height: 64,
  },
  recBoxWrap: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  roomImage: {
    width: "100%",
    height: "100%",
  },
  circleLabel: {
    fontSize: 11,
    textAlign: "center",
    color: Colors.text,
    fontWeight: "600",
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  // Dark mode styles
  rootDark: {
    backgroundColor: "#0f172a",
  },
  headerDark: {
    backgroundColor: "#1f2937",
    borderBottomColor: "#374151",
  },
  searchWrapperDark: {
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  searchInputDark: {
    color: "#f8fafc",
  },
  cancelTextDark: {
    color: "#38bdf8",
  },
  liveRowDark: {
    backgroundColor: "#1e293b",
  },
  liveRowBorderDark: {
    borderBottomColor: "#334155",
  },
  liveNameDark: {
    color: "#f8fafc",
  },
  liveLoadingTextDark: {
    color: "#9ca3af",
  },
  liveEmptyTextDark: {
    color: "#9ca3af",
  },
  sectionDark: {
    backgroundColor: "#1e293b",
  },
  sectionTitleDark: {
    color: "#f8fafc",
  },
  historyRowBorderDark: {
    borderBottomColor: "#334155",
  },
  historyTextDark: {
    color: "#f8fafc",
  },
  historySeeMoreTextDark: {
    color: "#38bdf8",
  },
  recsSectionDark: {
    backgroundColor: "#1e293b",
  },
  recsTableDark: {
    backgroundColor: "#1e293b",
    borderColor: "#334155",
  },
  recsTableCellDark: {
    borderColor: "#334155",
    backgroundColor: "#1e293b",
  },
  recBoxWrapDark: {
    backgroundColor: "#374151",
  },
  circleLabelDark: {
    color: "#f8fafc",
  },
})

export default styles
