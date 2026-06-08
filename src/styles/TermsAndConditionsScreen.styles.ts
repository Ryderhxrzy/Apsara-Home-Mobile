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
  introHeading: {
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
  },
  contactHeading: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: "row",
    gap: 8,
  },
  bullet: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: -2,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    flex: 1,
  },
})

export default styles
