import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
  scrollableContainer: {
    flex: 1,
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
  spacer: {
    height: 40,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    width: "100%",
  },
  fieldWrap: {
    flex: 1,
    width: "100%",
  },
  halfField: {
    flex: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 4,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  hint: {
    fontSize: 12,
    marginBottom: 6,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginBottom: 4,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  termsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginVertical: 0,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.sky,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.sky,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: Colors.sky,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  signUpBtn: {
    marginTop: 0,
    marginBottom: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  termsModalContent: {
    borderRadius: 12,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    overflow: "hidden",
    flex: 1,
    flexDirection: "column",
  },
  termsModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  termsModalSubtitle: {
    fontSize: 13,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  termsModalScroll: {
    flex: 1,
  },
  termsModalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  termsParagraphTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  termsParagraph: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  termsModalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
  },
  termsCloseBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  termsCloseBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  termsAcceptBtn: {
    flex: 1,
    height: 48,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.sky,
    alignItems: "center",
    justifyContent: "center",
  },
  termsAcceptBtnDisabled: {
    opacity: 0.5,
  },
  termsAcceptBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  requirementsBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  requirementsGrid: {
    flexDirection: "column",
    gap: 8,
  },
  requirementLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  requirementCheck: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 16,
  },
  requirementText: {
    fontSize: 11,
    fontWeight: "500",
  },
  separator: {
    fontSize: 10,
    fontWeight: "400",
  },
  bottomFooter: {
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successModalContent: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  successModalMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  successModalFooter: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  successCloseBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successCloseBtnText: {
    fontWeight: "700",
  },
  successLoginBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.sky,
  },
  successLoginBtnText: {
    color: Colors.white,
    fontWeight: "800",
  },
})

export default styles
