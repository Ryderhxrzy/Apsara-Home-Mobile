import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingVertical: 12,
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
  addBtn: {
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
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  contentContainer: {
    paddingVertical: 12,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 400,
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
  addressCard: {
    padding: 12,
    marginHorizontal: 4,
  },
  addressCardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  addressType: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  addressName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 16,
  },
  addressPhone: {
    fontSize: 11,
  },
  addressText: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  addressNotes: {
    fontSize: 10,
    fontStyle: "italic",
  },
  checkmark: {
    marginTop: 2,
  },
})

export default styles
