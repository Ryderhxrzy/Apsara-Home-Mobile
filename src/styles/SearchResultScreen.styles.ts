import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
    marginLeft: -4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  headerQuery: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    flexWrap: "wrap",
    paddingRight: 12,
  },
  headerCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  scroll: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    paddingHorizontal: 8,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  productItem: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Dark mode styles
  containerDark: {
    backgroundColor: "#0f172a",
  },
  headerDark: {
    backgroundColor: "#1f2937",
    borderBottomColor: "#374151",
  },
  headerTitleDark: {
    color: "#f8fafc",
  },
  headerQueryDark: {
    color: "#9ca3af",
  },
  headerCountDark: {
    color: "#9ca3af",
  },
  scrollDark: {
    backgroundColor: "#0f172a",
  },
  loadingContainerDark: {
    backgroundColor: "#0f172a",
  },
  loadingTextDark: {
    color: "#9ca3af",
  },
  emptyContainerDark: {
    backgroundColor: "#0f172a",
  },
  emptyTextDark: {
    color: "#9ca3af",
  },
})

export default styles
