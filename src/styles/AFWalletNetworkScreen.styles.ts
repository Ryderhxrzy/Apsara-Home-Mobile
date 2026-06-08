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
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardsGrid: {
    gap: 10,
  },
  networkCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardLabel: {
    fontSize: 11,
    flex: 1,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  activationBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  activationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  activationLabel: {
    fontSize: 12,
  },
  activationValue: {
    fontSize: 12,
    fontWeight: "700",
  },
  activationDivider: {
    borderBottomWidth: 1,
    marginVertical: 6,
  },
  awardRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  awardLeft: {
    flex: 1,
  },
  awardRight: {
    alignItems: "flex-end",
  },
  awardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  awardSource: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  levelBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  awardDate: {
    fontSize: 11,
  },
  awardAmount: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  awardPv: {
    fontSize: 10,
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
