import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBg: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 32,
    width: "100%",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
})

export default styles
