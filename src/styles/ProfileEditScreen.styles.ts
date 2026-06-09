import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"

const SCREEN_HEIGHT = Dimensions.get("window").height
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6

// Layout-only styles. Theme colors are applied inline from the screen palette.
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ---------- Hero header ---------- */
  hero: {
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 6,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 1,
  },

  /* ---------- Body ---------- */
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 12,
  },

  /* ---------- Section cards ---------- */
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  cardAccent: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: Colors.sky,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  cardBody: {
    padding: 14,
    gap: 14,
  },

  /* ---------- Fields ---------- */
  field: {
    gap: 7,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  required: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.error,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
  },
  inputText: {
    fontSize: 14,
    flex: 1,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.error,
  },

  /* ---------- Sticky save ---------- */
  buttonContainer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  saveBtn: {
    marginBottom: 0,
  },

  /* ---------- Modals (dropdown + date picker) ---------- */
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalOverlay: {
    flex: 1,
  },
  dropdownModal: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: MODAL_HEIGHT,
    width: "100%",
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalItemLast: {
    borderBottomWidth: 0,
  },
  modalItemContent: {
    flex: 1,
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  checkmark: {
    marginLeft: 12,
  },
  dropdownLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 40,
  },
  dropdownLoadingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  dropdownEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
  },
  datePickerContent: {
    flex: 1,
  },
  datePickerList: {
    flex: 1,
  },
  datePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  datePickerItemText: {
    fontSize: 15,
    fontWeight: "500",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  datePickerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  datePickerBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
})

export default styles
