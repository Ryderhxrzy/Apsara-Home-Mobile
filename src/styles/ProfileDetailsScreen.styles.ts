import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"
import { radius, shadow } from "../theme/theme"

// Layout-only styles. Theme colors are applied inline from the screen's `c`
// palette so the screen fully supports dark mode.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ---------- Cover banner ---------- */
  cover: {
    paddingBottom: 72,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.white,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 11,
  },

  /* ---------- Floating profile sheet ---------- */
  profileSheet: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  avatarWrap: {
    marginTop: -52,
    marginBottom: 8,
    position: "relative",
    ...shadow.lg,
  },
  avatarRing: {
    borderRadius: 56,
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: "900",
    color: Colors.sky,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 46,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.white,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  nameText: {
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
    marginTop: 2,
  },
  usernameText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.sky,
    marginTop: 2,
  },
  nameEditContainer: {
    width: "100%",
    gap: 8,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: "700",
    borderWidth: 1,
    borderColor: Colors.sky,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "center",
  },
  nameEditActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  chipBadge: {
    backgroundColor: Colors.sky,
  },
  chipOutline: {
    borderWidth: 1,
  },
  chipImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
  chipOutlineText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* ---------- Body ---------- */
  body: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 40,
  },

  /* ---------- Stat tiles ---------- */
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
    ...shadow.sm,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  /* ---------- Progress (sheet + monthly activation) ---------- */
  completion: {
    width: "100%",
    gap: 6,
    marginTop: 14,
  },
  completionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  completionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  completionPct: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.sky,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.sky,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  /* ---------- Primary CTA ---------- */
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.sky,
    paddingVertical: 15,
    borderRadius: radius.lg,
    marginBottom: 18,
    ...shadow.md,
  },
  ctaComplete: {
    backgroundColor: "#10b981",
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
  },

  /* ---------- Grouped list sections ---------- */
  groupLabel: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 6,
    marginBottom: 8,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 18,
    ...shadow.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  rowProgress: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 8,
  },

  /* ---------- Status pills ---------- */
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
  },

  /* ---------- Badge journey ---------- */
  tierItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tierRank: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  tierRankText: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.white,
  },
  tierInfo: {
    flex: 1,
    gap: 2,
  },
  tierTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  tierMeta: {
    fontSize: 11,
    fontWeight: "500",
  },
  tierState: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tierStateText: {
    fontSize: 10,
    fontWeight: "700",
  },

  /* ---------- States ---------- */
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.sky,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
  },
})

export default styles
