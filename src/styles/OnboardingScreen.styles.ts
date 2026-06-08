import { StyleSheet, Dimensions } from "react-native"
import { Colors } from "../constants/colors"

const SCREEN_WIDTH = Dimensions.get("window").width

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backgroundCircle: {
    position: "absolute",
    width: SCREEN_WIDTH * 2,
    height: SCREEN_WIDTH * 2,
    borderRadius: SCREEN_WIDTH,
    top: -SCREEN_WIDTH * 0.8,
    left: -SCREEN_WIDTH * 0.5,
    opacity: 0.5,
  },
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
    gap: 16,
  },
  imageContainer: {
    width: SCREEN_WIDTH - 56,
    height: 220,
    position: "relative",
  },
  slideImage: {
    width: SCREEN_WIDTH - 56,
    height: 220,
  },
  titleOverCircle: {
    position: "absolute",
    bottom: 40,
    left: 28,
    right: 28,
    fontSize: 36,
    fontWeight: "900",
    color: Colors.white,
    lineHeight: 42,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  titleAccentOverCircle: {
    fontStyle: "italic",
  },
  eyebrow: {
    fontSize: 15,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 38,
    fontWeight: "900",
    color: Colors.text,
    lineHeight: 44,
    textAlign: "center",
  },
  titleAccent: {
    fontStyle: "italic",
  },
  subtitle: {
    fontSize: 19,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 27,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
  cardsWrapper: {
    width: "100%",
    gap: 16,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: "#e0f2fe",
    borderRadius: 16,
    padding: SCREEN_WIDTH < 375 ? 12 : 14,
    gap: 12,
  },
  stepNumber: {
    fontSize: SCREEN_WIDTH < 375 ? 18 : 20,
    fontWeight: "900",
    color: Colors.sky,
    alignSelf: "center",
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: SCREEN_WIDTH < 375 ? 15 : 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: SCREEN_WIDTH < 375 ? 12 : 13,
    color: Colors.textSecondary,
    lineHeight: SCREEN_WIDTH < 375 ? 16 : 18,
  },
  brandsSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 16,
  },
  brandsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  brandsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
    width: "100%",
  },
  brandItem: {
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
    aspectRatio: 2,
  },
  brandLogo: {
    width: "100%",
    height: "100%",
    maxWidth: 120,
    maxHeight: 60,
  },
  bulletPointsContainer: {
    width: "100%",
    marginTop: 8,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    maxWidth: 320,
    width: "100%",
  },
  bulletIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  skipBtn: {
    position: "absolute",
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  bottom: {
    paddingHorizontal: 28,
    paddingTop: 16,
    gap: 20,
    alignItems: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  dotActive: {
    width: 24,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  nextBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  nextBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  btnText: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "800",
  },
})

export default styles
