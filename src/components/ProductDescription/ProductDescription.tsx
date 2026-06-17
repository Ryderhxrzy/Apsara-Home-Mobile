import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  LayoutChangeEvent,
} from "react-native"
import { Image } from "expo-image"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import RenderHtml from "react-native-render-html"
import Ionicons from "../ui/Icon"
import ZoomableImage from "../ZoomableImage/ZoomableImage"
import { Colors } from "../../constants/colors"
import styles from "../../styles/ProductDetailScreen.styles"

const SCREEN_WIDTH = Dimensions.get("window").width
const CARD_W = Math.round(SCREEN_WIDTH * 0.62)
const CARD_H = Math.round(CARD_W * 1.15)

// Height the description text is clamped to before "See more" is shown.
const COLLAPSED_H = 220

// Enable LayoutAnimation on old-architecture Android (no-op on Fabric).
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// Quick, smooth expand/collapse — height eases; the fade + button fade in/out.
const EXPAND_ANIM = LayoutAnimation.create(
  220,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity
)

// Backend descriptions can arrive entity-encoded (e.g. "&lt;p&gt;" shows the
// literal <p> tag) and carry inline CSS (style="font-size:16px") that fights the
// app's own typography. Decode entities and strip inline style/class so our
// tagsStyles fully control the look.
const toRenderableHtml = (raw?: string | null): string => {
  if (!raw || !raw.trim()) return "<p>No description available</p>"
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sclass="[^"]*"/gi, "")
    .trim()
}

// Pull every <img src="..."> out of the (decoded) description HTML.
const extractImageUrls = (html: string): string[] => {
  const urls: string[] = []
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    if (m[1]) urls.push(m[1])
  }
  return urls
}

// Remove the <img> tags (rendered separately in the horizontal strip) plus the
// empty <br>/<p> scaffolding they leave behind, so RenderHtml shows just the
// text/spec content with no big vertical gaps.
const stripImages = (html: string): string =>
  html
    .replace(/<img[^>]*>/gi, "")
    .replace(/(\s*<br\s*\/?>\s*)+/gi, "<br>")
    .replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "")
    .trim()

interface ProductDescriptionProps {
  description?: string | null
  isDarkMode?: boolean
}

/**
 * Product description. The text is clamped to COLLAPSED_H with a "See more /
 * See less" toggle and a bottom fade (only when it actually overflows); the
 * expand/collapse animates via LayoutAnimation. Images embedded in the
 * description are lifted into a horizontal scrollable strip (tap → full-screen
 * zoomable viewer). RenderHtml + entity-decode + image-extract recompute only
 * when description/isDarkMode change (memoized by the compiler).
 */
function ProductDescription({
  description,
  isDarkMode = false,
}: ProductDescriptionProps) {
  const insets = useSafeAreaInsets()
  const [expanded, setExpanded] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const [viewerVisible, setViewerVisible] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerZoomed, setViewerZoomed] = useState(false)

  const text = isDarkMode ? "#f8fafc" : Colors.text
  const textSec = isDarkMode ? "#94a3b8" : Colors.textSecondary
  const card = isDarkMode ? "#1e293b" : Colors.white
  const divider = isDarkMode ? "#334155" : "#f1f5f9"

  const decoded = toRenderableHtml(description)
  const imageUrls = extractImageUrls(decoded)
  const html = imageUrls.length > 0 ? stripImages(decoded) : decoded

  // Re-collapse when the viewed product's description changes.
  useEffect(() => {
    setExpanded(false)
    setContentHeight(0)
  }, [description])

  const overflows = contentHeight > COLLAPSED_H + 8
  const clamp = !expanded && overflows
  const showToggle = overflows
  const fadeColors = isDarkMode
    ? (["rgba(30,41,59,0)", "#1e293b"] as const)
    : (["rgba(255,255,255,0)", "#ffffff"] as const)

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height
    if (h && Math.abs(h - contentHeight) > 1) setContentHeight(h)
  }

  const toggle = () => {
    LayoutAnimation.configureNext(EXPAND_ANIM)
    setExpanded((p) => !p)
  }

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerVisible(true)
  }

  return (
    <View
      style={[
        styles.descriptionSection,
        {
          backgroundColor: card,
          borderBottomColor: divider,
          borderTopColor: divider,
        },
      ]}
    >
      <View
        style={[
          styles.descriptionHeader,
          { backgroundColor: isDarkMode ? "#111827" : "#f9fafb" },
        ]}
      >
        <Text style={[styles.descriptionTitle, { color: text }]}>
          Description
        </Text>
      </View>

      <View style={[styles.descriptionContent, { backgroundColor: card }]}>
        {/* Clamped text — onLayout on the inner view reports full height even
            while the outer view clips it, so we know whether it overflows. */}
        <View style={clamp ? s.clampCollapsed : undefined}>
          <View style={styles.descriptionContentInner} onLayout={onContentLayout}>
            <RenderHtml
              source={{ html }}
              contentWidth={SCREEN_WIDTH - 32}
              defaultTextProps={{ selectable: true }}
              enableExperimentalMarginCollapsing
              baseStyle={{ color: text, fontSize: 14, lineHeight: 22 }}
              tagsStyles={{
                body: { color: text, fontSize: 14, lineHeight: 22 },
                div: { color: text, fontSize: 14, lineHeight: 22 },
                span: { color: text, fontSize: 14, lineHeight: 22 },
                h1: { color: text, fontSize: 20, fontWeight: "800", marginTop: 12, marginBottom: 6 },
                h2: { color: text, fontSize: 18, fontWeight: "800", marginTop: 12, marginBottom: 6 },
                h3: { color: text, fontSize: 16, fontWeight: "700", marginTop: 12, marginBottom: 6 },
                h4: { color: text, fontSize: 15, fontWeight: "600", marginTop: 10, marginBottom: 6 },
                h5: { color: text, fontSize: 14, fontWeight: "600", marginTop: 8, marginBottom: 4 },
                h6: { color: text, fontSize: 13, fontWeight: "600", marginTop: 8, marginBottom: 4 },
                p: { color: text, fontSize: 14, lineHeight: 22, marginBottom: 10 },
                ul: { marginLeft: 20, marginBottom: 10 },
                ol: { marginLeft: 20, marginBottom: 10 },
                li: { color: text, fontSize: 14, lineHeight: 22, marginBottom: 6 },
                hr: { backgroundColor: divider, marginVertical: 12 },
                strong: { fontWeight: "700" },
                b: { fontWeight: "700" },
                em: { fontStyle: "italic" },
                i: { fontStyle: "italic" },
                u: { textDecorationLine: "underline" },
                br: { marginVertical: 2 },
                a: { color: Colors.sky, textDecorationLine: "underline" },
              }}
            />
          </View>

          {/* Fade ("shadow") over the clipped bottom edge while collapsed. */}
          {clamp && (
            <LinearGradient
              colors={fadeColors}
              style={s.fade}
              pointerEvents="none"
            />
          )}
        </View>

        {/* See more / See less */}
        {showToggle && (
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={toggle}
            activeOpacity={0.7}
          >
            <Text style={s.toggleText}>
              {expanded ? "See less" : "See more"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={Colors.sky}
            />
          </TouchableOpacity>
        )}

        {/* Embedded description images — single horizontal scrollable row */}
        {imageUrls.length > 0 && (
          <View style={s.imagesWrap}>
            <View style={s.imagesLabelRow}>
              <Ionicons name="image" size={14} color={Colors.sky} />
              <Text style={[s.imagesLabel, { color: text }]}>
                Product Images
              </Text>
              <Text style={[s.imagesHint, { color: textSec }]}>
                Swipe • tap to zoom
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.imagesRow}
              decelerationRate="fast"
              snapToInterval={CARD_W + 10}
              snapToAlignment="start"
            >
              {imageUrls.map((uri, i) => (
                <Pressable
                  key={`${uri}-${i}`}
                  onPress={() => openViewer(i)}
                  style={({ pressed }) => [
                    s.imageCard,
                    { borderColor: divider, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Image
                    source={{ uri }}
                    style={s.image}
                    contentFit="cover"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Full-screen viewer for the description images */}
      <Modal
        visible={viewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerVisible(false)}
      >
        <View style={s.viewerRoot}>
          <ScrollView
            horizontal
            pagingEnabled
            scrollEnabled={!viewerZoomed}
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerIndex * SCREEN_WIDTH, y: 0 }}
            onMomentumScrollEnd={(e) =>
              setViewerIndex(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              )
            }
          >
            {imageUrls.map((uri, i) => (
              <View key={`full-${uri}-${i}`} style={s.viewerPage}>
                <ZoomableImage
                  uri={uri}
                  onZoomChange={setViewerZoomed}
                  containerStyle={s.viewerImage}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[s.viewerClose, { top: insets.top + 12 }]}
            onPress={() => setViewerVisible(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {imageUrls.length > 1 && (
            <View style={[s.viewerCounter, { bottom: insets.bottom + 28 }]}>
              <Text style={s.viewerCounterText}>
                {viewerIndex + 1}/{imageUrls.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  clampCollapsed: { maxHeight: COLLAPSED_H, overflow: "hidden" },
  fade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 2,
  },
  toggleText: { fontSize: 13, fontWeight: "700", color: Colors.sky },
  imagesWrap: { marginTop: 10, marginBottom: 4 },
  imagesLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  imagesLabel: { fontSize: 13, fontWeight: "700" },
  imagesHint: { fontSize: 11, fontWeight: "500", marginLeft: "auto" },
  imagesRow: { gap: 10, paddingRight: 16 },
  imageCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "#f1f5f9",
  },
  image: { width: "100%", height: "100%" },
  viewerRoot: { flex: 1, backgroundColor: "rgba(0,0,0,0.96)" },
  viewerPage: {
    width: SCREEN_WIDTH,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: { width: SCREEN_WIDTH, height: "85%" },
  viewerClose: {
    position: "absolute",
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerCounter: {
    position: "absolute",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  viewerCounterText: { color: "#fff", fontSize: 13, fontWeight: "700" },
})

export default ProductDescription
