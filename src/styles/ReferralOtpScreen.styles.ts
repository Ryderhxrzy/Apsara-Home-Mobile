import { StyleSheet } from "react-native"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    width: "100%",
    maxWidth: 900,
    marginHorizontal: "auto",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  expiryText: {
    fontSize: 12,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginBottom: 12,
    fontWeight: "500",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },
  otpBox: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
  },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 20,
  },
  resendText: {
    fontSize: 12,
  },
  resendLink: {
    fontSize: 12,
    fontWeight: "600",
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
  verifyBtn: {
    marginBottom: 16,
  },
  spacer: {
    height: 40,
  },
})

export default styles
