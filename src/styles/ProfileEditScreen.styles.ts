import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"

const SCREEN_HEIGHT = Dimensions.get("window").height
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  keyboardView: {
    flex: 1,
    flexDirection: "column",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  profilePictureSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  profilePictureButton: {
    position: "relative",
    marginBottom: 8,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePictureDefault: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profilePictureText: {
    fontSize: 12,
    color: "#666",
  },
  profilePictureHint: {
    fontSize: 12,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputText: {
    fontSize: 13,
    flex: 1,
  },
  dateText: {
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
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
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text,
  },
  modalList: {
    paddingHorizontal: 0,
    flex: 1,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
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
    color: Colors.text,
  },
  checkmark: {
    marginLeft: 12,
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
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  saveBtn: {
    marginBottom: 0,
  },
})

export default styles
