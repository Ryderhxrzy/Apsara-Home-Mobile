import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  cardsGrid: {
    gap: 10,
  },
  balanceCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    fontSize: 16,
  },
  cardLabel: {
    fontSize: 12,
    flex: 1,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 11,
  },
  capacityBar: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  capacityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  capacityTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  capacityPercent: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#0284c7",
    borderRadius: 3,
  },
  capacityDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  capacityDetail: {
    fontSize: 11,
  },
  ledgerSection: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  ledgerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  ledgerTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  ledgerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  ledgerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ledgerCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  ledgerTable: {
    paddingHorizontal: 12,
  },
  ledgerRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  ledgerCell: {
    flex: 1,
  },
  ledgerDate: {
    fontSize: 11,
  },
  ledgerBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  ledgerBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.white,
  },
  ledgerSource: {
    fontSize: 11,
    textTransform: "capitalize",
  },
  ledgerAmount: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "right",
  },
  ledgerMore: {
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 10,
  },
})

export default styles
