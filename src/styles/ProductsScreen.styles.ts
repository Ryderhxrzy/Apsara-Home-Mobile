import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"

const { width } = Dimensions.get("window")
const CARD_MARGIN = 8
const NUM_COLUMNS = 2
const CARD_WIDTH = (width - 32 - CARD_MARGIN * (NUM_COLUMNS - 1)) / NUM_COLUMNS

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  headerCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
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
})

export default styles
