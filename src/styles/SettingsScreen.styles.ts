import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  headerBackground: {
    position: "relative",
    overflow: "hidden",
    minHeight: 90,
    borderBottomWidth: 1,
  },
  headerBackgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  headerContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.white,
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitleText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  settingRowWithBorder: {
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  languageValue: {
    fontSize: 13,
    fontWeight: "500",
  },
  logoutIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  linkRowWithBorder: {
    borderBottomWidth: 1,
  },
  linkLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
  paymentContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  paymentMethods: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    width: "100%",
    gap: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutConfirmButton: {
    backgroundColor: Colors.error,
  },
  logoutConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  versionFooter: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    fontWeight: "500",
  },
  profileCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  profileAvatarContainer: {
    marginRight: 4,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarInitial: {
    fontSize: 22,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: "400",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  profileDivider: {
    height: 1,
  },
  profileActions: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 12,
  },
  profileActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  profileActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
})

export default styles
