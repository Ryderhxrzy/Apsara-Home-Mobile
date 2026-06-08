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
  section: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
  },
  locationsTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  locationCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationName: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  locationAddress: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  supportSubtitle: {
    fontSize: 12,
    marginBottom: 12,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  supportCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  supportName: {
    fontSize: 13,
    fontWeight: "700",
  },
  supportNote: {
    fontSize: 11,
    fontWeight: "400",
    fontStyle: "italic",
  },
  contactAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
})

export default styles
