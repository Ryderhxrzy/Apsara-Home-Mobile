import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: Colors.text,
  },
  loader: {
    position: "absolute",
    bottom: 80,
  },
})

export default styles
