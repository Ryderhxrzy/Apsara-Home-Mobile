import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fbff",
  },
  containerDark: {
    backgroundColor: "#111827",
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    width: "100%",
    paddingHorizontal: 0,
    paddingBottom: 20,
  },
  banner: {
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 0,
    padding: 32,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    width: "100%",
  },
  bannerContent: {
    alignItems: "center",
    gap: 12,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  card: {
    marginHorizontal: 0,
    marginVertical: 0,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "#e5e7eb",
    width: "100%",
  },
  cardDark: {
    backgroundColor: "#1f2937",
    borderColor: "#374151",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  cardLabelDark: {
    color: "#9ca3af",
  },
  referrerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  referrerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  referrerDetails: {
    flex: 1,
  },
  referrerName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 4,
  },
  referrerNameDark: {
    color: Colors.white,
  },
  referrerUsername: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  referrerUsernameDark: {
    color: "#9ca3af",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: Colors.white,
  },
  benefitItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(2, 132, 199, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    justifyContent: "center",
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  benefitTitleDark: {
    color: Colors.white,
  },
  benefitDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  benefitDescDark: {
    color: "#9ca3af",
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoTextDark: {
    color: "#9ca3af",
  },
  statusContainer: {
    gap: 12,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusIcon: {
    marginTop: 2,
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  statusLabelDark: {
    color: "#9ca3af",
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 20,
  },
  statusValueDark: {
    color: Colors.white,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  dividerDark: {
    backgroundColor: "#374151",
  },
  spacer: {
    height: 40,
  },
  footer: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerDark: {
    backgroundColor: "#1f2937",
    borderTopColor: "#374151",
  },
  footerContent: {
    width: "100%",
    gap: 10,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonDark: {
    backgroundColor: "#374151",
    borderColor: "#4b5563",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  secondaryButtonTextDark: {
    color: Colors.white,
  },
})

export default styles
