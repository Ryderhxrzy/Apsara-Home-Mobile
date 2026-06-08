import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  root: {
    flex: 1,
  },

  headerBackground: {
    position: "relative",
    overflow: "hidden",
    minHeight: 90,
    borderBottomWidth: 1,
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

  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },

  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.white,
    flex: 1,
    textAlign: "center",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },

  section: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },

  sectionHeader: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },

  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.sky,
    marginBottom: 4,
  },

  summaryLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },

  treeScrollView: {
    minHeight: "auto",
  },

  treeContainer: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    minWidth: "100%",
  },

  treeLine: {
    width: 1.5,
    backgroundColor: "#e2e8f0",
    marginRight: 0,
    position: "relative",
  },

  horizontalConnector: {
    width: 12,
    height: 1.5,
    backgroundColor: "#e2e8f0",
  },

  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    marginBottom: 8,
  },

  rootCard: {
    backgroundColor: "#e0f2fe",
    borderColor: Colors.sky,
    borderWidth: 2,
  },

  rootBadge: {
    backgroundColor: Colors.sky,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  rootBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },

  userCardContent: {
    padding: 12,
  },

  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },

  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.sky,
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.sky,
  },

  userInfo: {
    flex: 1,
    justifyContent: "center",
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },

  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    flex: 1,
  },

  userUsername: {
    fontSize: 11,
    color: Colors.sky,
    fontWeight: "500",
  },

  joinDate: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },

  expandIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  userStats: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  statContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },

  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.sky,
  },

  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  statsPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
    justifyContent: "center",
  },

  statsPlaceholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },

  childrenContainer: {
    marginTop: 4,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyBackBtn: {
    marginTop: 6,
    backgroundColor: Colors.sky,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyBackBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
})

export default styles
