import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f6f8" },
  safe: { flex: 1 },
  flex: { flex: 1 },
  // Back-to-Home arrow (Login is optional for guests).
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginTop: 4,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: "center",
  },

  // ── Brand ──
  logoWrap: {
    alignItems: "center",
    marginBottom: 16,
  },
  logo: {
    width: 84,
    height: 84,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#64748b",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },

  form: { width: "100%" },

  // ── Primary button ──
  primaryBtn: {
    height: 54,
    borderRadius: 14,
    marginTop: 8,
  },

  // ── OR divider ──
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    letterSpacing: 1,
  },

  // ── Biometric ──
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#e8f1fe",
    marginBottom: 12,
  },
  biometricBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.sky,
  },

  // ── Google ──
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },

  // ── Forgot password ──
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 16,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.sky,
  },

  // ── Sign up link ──
  signupLinkSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signupText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
  },
  signupLink: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.sky,
  },

  // ── Continue as guest ──
  guestBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "transparent",
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },

  // ── Affiliate CTA banner ──
  affiliateBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 20,
  },
  affiliateIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  affiliateTextWrap: { flex: 1 },
  affiliateTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  affiliateSub: {
    fontSize: 11.5,
    fontWeight: "500",
    color: "#64748b",
    marginTop: 2,
  },

  // ── Legal footer ──
  legalFooter: {
    fontSize: 12,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.sky,
    fontWeight: "700",
  },

  // ── Remembered user ──
  notYouButton: { marginTop: 16, paddingVertical: 12, alignItems: "center" },
  notYouText: { fontSize: 13, color: Colors.sky, fontWeight: "600" },
  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  profilePicture: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  profilePictureDefault: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profilePictureDefaultText: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  profileEmail: { fontSize: 12, color: "#64748b" },

  // ── 2FA / MFA modals ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: "center",
  },
  modalPolling: { fontSize: 13, color: "#0ea5e9", marginBottom: 20 },
  otpInput: {
    width: "100%",
    height: 48,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 16,
  },
  otpErrorText: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: 12,
    textAlign: "center",
  },
  modalButton: { width: "100%", marginBottom: 8, borderRadius: 10, height: 48 },
  modalLink: { paddingVertical: 8 },
  modalLinkText: { color: "#0ea5e9", fontWeight: "600" },
})

export default styles
