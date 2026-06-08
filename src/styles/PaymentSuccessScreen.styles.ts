import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  successSection: {
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  section: {
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  refBox: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  refValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "500",
  },
  productCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  productRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  qtyText: {
    fontSize: 11,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
  addressCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  customerInfoBox: {
    borderRadius: 8,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  customerInfoField: {
    paddingVertical: 8,
  },
  customerInfoLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  customerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  customerInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  customerDivider: {
    height: 1,
    marginVertical: 8,
  },
  infoBox: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  infoBoxText: {
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  primaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
  },
  timelineContainer: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  timelineText: {
    fontSize: 11,
  },
  timelineConnector: {
    width: 1,
    height: 12,
    marginLeft: 20,
  },
  policyBox: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  policyText: {
    fontSize: 11,
    lineHeight: 15,
  },
  faqBox: {
    borderRadius: 8,
    padding: 12,
  },
  faqTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    fontSize: 11,
    lineHeight: 16,
  },
})

export default styles
