import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"
import { palette, radius, shadow } from "../theme/theme"

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  container: {
    flex: 1,
    backgroundColor: palette.slate50,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    ...shadow.sm,
  },
  filterBar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterButtonActive: {
    borderColor: Colors.sky,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  totalBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  totalBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 10,
  },
  // Each notification is a clean card — no full-width hard dividers.
  notificationCard: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...shadow.sm,
  },
  notificationItem: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    alignItems: "flex-start",
  },
  notificationItemBorder: {},
  notificationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  notificationDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
    lineHeight: 18,
  },
  notificationCount: {
    fontSize: 12,
    color: Colors.sky,
    fontWeight: "600",
    marginTop: 2,
  },
  notificationImageBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  notificationImage: {
    width: "100%",
    height: "100%",
  },
  notificationAmount: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
    marginBottom: 2,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  updatesToggle: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  updatesToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.sky,
  },
  updatesContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 0,
  },
  updatesLoading: {
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  updateItem: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.sky,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingLeft: 12,
  },
  updateItemLast: {
    borderBottomWidth: 0,
  },
  updateTimelineIcon: {
    width: 20,
    height: 20,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -20,
  },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sky,
  },
  updateContent: {
    flex: 1,
    gap: 4,
  },
  updateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  updateTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    flex: 1,
  },
  updateTime: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.textSecondary,
    flexShrink: 0,
  },
  updateMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "400",
    lineHeight: 16,
  },
})

export default styles
