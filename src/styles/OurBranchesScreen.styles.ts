import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text,
  },
  headerTitleDark: {
    color: "#f8fafc",
  },
  content: {
    padding: 8,
    gap: 16,
    paddingBottom: 32,
  },
  taglineContainer: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
  branchCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  branchHeader: {
    marginBottom: 4,
  },
  branchType: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  branchName: {
    fontSize: 14,
    fontWeight: "700",
  },
  branchAddress: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  mapButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: 6,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  wazeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
})

export default styles
