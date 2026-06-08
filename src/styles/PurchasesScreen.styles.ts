import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"

const { height: screenHeight } = Dimensions.get("window")

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBackground: {
    position: "relative",
    overflow: "hidden",
    minHeight: 100,
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
    justifyContent: "space-between",
    marginLeft: -10,
    marginRight: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerGreeting: {
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  orderCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 11,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemsContainer: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  itemInfo: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 2,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 11,
    fontWeight: "500",
  },
  itemDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemVariant: {
    fontSize: 10,
    marginTop: 0,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
  itemPriceContainer: {
    minWidth: 95,
    alignItems: "flex-end",
  },
  shippingFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  shippingLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  shippingPrice: {
    fontSize: 12,
    fontWeight: "600",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
  },
  paymentMethodLabel: {
    fontSize: 11,
  },
  payUntilInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  payUntilInlineText: {
    fontSize: 11,
    fontWeight: "700",
  },
  orderFooter: {
    gap: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "800",
  },
  paymentBtn: {
    flex: 1,
    backgroundColor: Colors.sky,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 0,
  },
  paymentBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  paymentSection: {
    gap: 10,
    marginTop: 12,
  },
  listActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cancelListBtn: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  filterBar: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  filterContent: {
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
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
  filterCountBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  filterCountBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
  },
  filterCountBadgeTextActive: {
    color: Colors.white,
  },
  // Modal Styles
  modalContainer: {
    height: "90%",
    maxHeight: "92%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdropLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalCloseBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
    paddingBottom: 30,
  },
  detailCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  detailItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  detailItemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  detailActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  cancelBtn: {
    backgroundColor: "#ef4444",
  },
  payBtn: {
    backgroundColor: Colors.sky,
  },
  detailActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  reasonList: {
    flex: 1,
    paddingHorizontal: 0,
  },
  reasonListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reasonOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  reasonOptionContent: {
    flex: 1,
  },
  reasonCheckmark: {
    marginLeft: 12,
  },
  reasonText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  reasonActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  reasonBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  reasonBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelReasonSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight * 0.75,
    width: "100%",
    paddingBottom: 20,
  },
  cancellationReasonBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  cancellationReasonLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  cancellationReasonText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  shopNowBtn: {
    backgroundColor: Colors.sky,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  shopNowBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
})

export default styles
