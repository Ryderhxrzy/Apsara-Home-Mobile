import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
})

export default styles
