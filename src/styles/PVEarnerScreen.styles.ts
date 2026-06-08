import { StyleSheet } from "react-native"
import { Colors } from "../constants/colors"

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
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
    justifyContent: "space-between",
    paddingRight: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 8,
    gap: 8,
    paddingBottom: 16,
  },
  productsSection: {
    gap: 0,
    marginHorizontal: -8,
  },
  productsSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    paddingHorizontal: 8,
    marginTop: 0,
    textAlign: "left",
  },
  masonryGrid: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  masonryColumn: {
    flex: 1,
    gap: 8,
  },
  masonryItem: {
    width: "100%",
  },
  dummyCard: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    width: "100%",
  },
  dummyImageContainer: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  dummyImage: {
    width: "60%",
    height: "60%",
  },
  dummyContent: {
    padding: 12,
    gap: 6,
  },
  dummyLine: {
    height: 8,
    borderRadius: 4,
    width: "100%",
  },
  emptyContainer: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.text,
  },
  shopMoreButton: {
    marginTop: 20,
    marginBottom: 28,
    borderRadius: 12,
    overflow: "hidden",
  },
  shopMoreGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shopMoreText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.white,
    flex: 1,
    textAlign: "center",
  },
})

export default styles
