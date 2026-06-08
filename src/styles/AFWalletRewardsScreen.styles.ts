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
  rewardCard: {
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
  totalBonusSection: {
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  bonusValue: {
    fontSize: 20,
    fontWeight: "700",
  },
})

export default styles
