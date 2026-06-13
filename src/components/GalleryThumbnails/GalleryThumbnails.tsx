import React, { useEffect, useRef } from "react"
import {
  View,
  ScrollView,
  Pressable,
  Dimensions,
  StyleSheet,
} from "react-native"
import { Image } from "expo-image"
import { Colors } from "../../constants/colors"

const SCREEN_WIDTH = Dimensions.get("window").width
const THUMB_SIZE = 56
const THUMB_GAP = 8
const EDGE_PADDING = 12
// Distance between the left edge of one thumbnail and the next.
const STRIDE = THUMB_SIZE + THUMB_GAP

interface GalleryThumbnailsProps {
  images: string[]
  /** Index of the gallery image currently in view. */
  activeIndex: number
  isDarkMode?: boolean
  /** Tap a thumbnail → parent scrolls the gallery to this exact index. */
  onSelectIndex: (index: number) => void
}

/**
 * Horizontal thumbnail strip mirroring the image gallery. Tapping a thumbnail
 * navigates the gallery; swiping the gallery updates `activeIndex`, which scrolls
 * the matching thumbnail into the center here. Thumbnail width is fixed, so the
 * centered offset is computed directly (no onLayout needed) for exact tracking.
 *
 * React Compiler (app.json) auto-memoizes this, so it only re-renders when
 * `images`, `activeIndex`, or `isDarkMode` change.
 */
function GalleryThumbnails({
  images,
  activeIndex,
  isDarkMode = false,
  onSelectIndex,
}: GalleryThumbnailsProps) {
  const scrollRef = useRef<ScrollView>(null)

  // Center the active thumbnail whenever the gallery moves to a new image.
  useEffect(() => {
    if (!scrollRef.current || images.length <= 1) return
    const target =
      EDGE_PADDING + activeIndex * STRIDE + THUMB_SIZE / 2 - SCREEN_WIDTH / 2
    scrollRef.current.scrollTo({ x: Math.max(0, target), animated: true })
  }, [activeIndex, images.length])

  // A single image needs no thumbnail navigation.
  if (images.length <= 1) return null

  const barBg = isDarkMode ? "#1e293b" : Colors.white
  const border = isDarkMode ? "#334155" : "#e5e7eb"

  return (
    <View
      style={[styles.bar, { backgroundColor: barBg, borderBottomColor: border }]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {images.map((img, i) => {
          const selected = i === activeIndex
          return (
            <Pressable
              key={`${i}-${img}`}
              onPress={() => onSelectIndex(i)}
              style={[
                styles.thumb,
                {
                  borderColor: selected ? Colors.sky : border,
                  opacity: selected ? 1 : 0.55,
                },
              ]}
            >
              <Image
                source={{ uri: img }}
                style={styles.thumbImage}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default GalleryThumbnails

const styles = StyleSheet.create({
  bar: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  content: {
    paddingHorizontal: EDGE_PADDING,
    gap: THUMB_GAP,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
})
