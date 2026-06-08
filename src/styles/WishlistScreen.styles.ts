import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  header: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  selectAllCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  selectAllCheckboxChecked: {
    backgroundColor: Colors.sky,
    borderColor: Colors.sky,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  selectAllTextActive: {
    color: Colors.sky,
    fontWeight: "700",
  },
  filterSection: {
    flexDirection: "row",
    gap: 6,
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    borderWidth: 0,
  },
  filterBtnActive: {
    backgroundColor: Colors.sky,
  },
  filterText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },
  filterTextActive: {
    color: Colors.white,
    fontWeight: "700",
  },
  listContent: {
    backgroundColor: Colors.white,
  },
  footer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  checkoutBtn: {
    backgroundColor: Colors.sky,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  checkoutBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  rowBack: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    overflow: "hidden",
  },
  backLeftBtn: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
  },
  backLeftBtnLeft: {
    backgroundColor: Colors.sky,
    left: 0,
  },
  backRightBtn: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 90,
  },
  backRightBtnRight: {
    backgroundColor: "#ef4444",
    right: 0,
  },
  cartActionInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 90,
  },
  deleteActionInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: 90,
  },
  backTextWhite: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  swipeHintText: {
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
})

export default styles
