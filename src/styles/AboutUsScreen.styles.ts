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
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  tagline: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
  },
  featureList: {
    marginTop: 12,
    gap: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statsContainer: {
    gap: 12,
  },
  statCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  statDesc: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  valuesTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  valuesSubtitle: {
    fontSize: 13,
    marginBottom: 12,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  valueCard: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  valueHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  valueIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  valueSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  valueDesc: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
})

export default styles
