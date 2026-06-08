import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  balanceSection: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  balanceGrid: {
    gap: 10,
  },
  balanceBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  vouchersSection: {
    gap: 12,
  },
  voucherCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  voucherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  voucherCodeSection: {
    flex: 1,
  },
  voucherCode: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  voucherAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  voucherStatus: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  voucherStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  voucherDivider: {
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  voucherDetails: {
    gap: 8,
  },
  voucherDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  voucherDetailLabel: {
    fontSize: 11,
  },
  voucherDetailValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyState: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  emptyStateSubtext: {
    fontSize: 12,
    textAlign: "center",
  },
})

export default styles
