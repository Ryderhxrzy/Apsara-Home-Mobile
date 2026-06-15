import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native"
import Ionicons from "../ui/Icon"
import ZoomableImage from "../ZoomableImage/ZoomableImage"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Colors } from "../../constants/colors"
import {
  variantLabel,
  type StripVariant,
} from "../ProductVariantStrip/ProductVariantStrip"

const SCREEN_WIDTH = Dimensions.get("window").width

interface VariantImageViewerProps {
  visible: boolean
  variants: StripVariant[]
  selectedVariantId: number | null
  onClose: () => void
  /** Keeps the screen's selected variant in sync while swiping. */
  onSelectVariant?: (variantId: number) => void
}

interface ViewerPage {
  variantId: number
  image: string
  label: string
  priceMember?: number
}

/**
 * Fullscreen swipable popup showing ONLY the variation images — not the whole
 * product gallery. One page per variant image, labeled with the variation name
 * and price. Swiping syncs the selected variant on the screen behind, so the
 * page reflects whatever color/size the user landed on when they close it.
 *
 * Native Modal (hardware back handled by onRequestClose); index committed on
 * settle (onMomentumScrollEnd) for accurate paging; React Compiler memoizes.
 */
function VariantImageViewer({
  visible,
  variants,
  selectedVariantId,
  onClose,
  onSelectVariant,
}: VariantImageViewerProps) {
  const insets = useSafeAreaInsets()
  const pagerRef = useRef<ScrollView>(null)
  const [pageIndex, setPageIndex] = useState(0)
  // Disable paging while an image is pinch-zoomed so panning moves the image.
  const [zoomed, setZoomed] = useState(false)

  // One page per variant image — variations without photos contribute nothing
  // (the strip shows no viewer entry point for them either).
  const pages: ViewerPage[] = variants.flatMap((v) =>
    (v.images ?? []).map((img) => ({
      variantId: v.id,
      image: img,
      label: variantLabel(v),
      priceMember: v.priceMember,
    }))
  )

  // On open, jump (no animation) to the currently selected variation's page.
  useEffect(() => {
    if (!visible) return
    const initial = Math.max(
      0,
      pages.findIndex((p) => p.variantId === selectedVariantId)
    )
    setPageIndex(initial)
    // Wait one frame so the ScrollView has laid out before scrolling.
    const timer = setTimeout(() => {
      pagerRef.current?.scrollTo({ x: initial * SCREEN_WIDTH, animated: false })
    }, 50)
    return () => clearTimeout(timer)
    // Re-run only when the popup opens; pages are stable while it's closed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible])

  // No variant photos → nothing to view (the strip offers no entry point then).
  if (pages.length === 0) return null

  const current = pages[pageIndex]

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Close */}
        <Pressable
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel="Close variation images"
        >
          <Ionicons name="close" size={22} color={Colors.white} />
        </Pressable>

        {/* Page indicator */}
        {pages.length > 1 && (
          <View style={[styles.pageIndicator, { top: insets.top + 18 }]}>
            <Text style={styles.pageIndicatorText}>
              {pageIndex + 1}/{pages.length}
            </Text>
          </View>
        )}

        {/* Swipable variant images */}
        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          disableIntervalMomentum
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
            if (idx < 0 || idx >= pages.length || idx === pageIndex) return
            setPageIndex(idx)
            onSelectVariant?.(pages[idx].variantId)
          }}
        >
          {pages.map((page, i) => (
            <View key={`${page.variantId}-${i}`} style={styles.page}>
              <ZoomableImage
                uri={page.image}
                onZoomChange={setZoomed}
                containerStyle={styles.pageImage}
              />
            </View>
          ))}
        </ScrollView>

        {/* Current variation label + price */}
        {current ? (
          <View
            style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
          >
            {current.label ? (
              <Text style={styles.footerLabel} numberOfLines={1}>
                {current.label}
              </Text>
            ) : null}
            {current.priceMember != null && (
              <Text style={styles.footerPrice}>
                ₱{current.priceMember.toLocaleString()}
              </Text>
            )}
            {/* Dots */}
            {pages.length > 1 && (
              <View style={styles.dotsRow}>
                {pages.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      i === pageIndex && styles.dotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </Modal>
  )
}

export default VariantImageViewer

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  pageIndicator: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  pageIndicatorText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  page: {
    width: SCREEN_WIDTH,
    alignItems: "center",
    justifyContent: "center",
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 24,
  },
  footerLabel: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  footerPrice: {
    color: "#7dd3fc",
    fontSize: 14,
    fontWeight: "600",
  },
  dotsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 16,
  },
})
