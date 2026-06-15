import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react"
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { Image } from "expo-image"
import Ionicons from "../ui/Icon"
import GalleryThumbnails from "../GalleryThumbnails/GalleryThumbnails"
import styles from "../../styles/ProductDetailScreen.styles"

const SCREEN_WIDTH = Dimensions.get("window").width

export interface ImageWithVariant {
  image: string
  variantId: number | null
}

export interface ProductGalleryHandle {
  /** Scroll the gallery to a specific image index (from the variant strip, etc.). */
  scrollToIndex: (index: number) => void
}

interface ProductGalleryProps {
  images: string[]
  imagesWithVariants: ImageWithVariant[]
  isDarkMode?: boolean
  /** Fired when a focused image belongs to a variant (keeps the parent's price/strip in sync). */
  onVariantFocus: (variantId: number) => void
  /** Tap an image → open the full-screen viewer at this index. */
  onOpenViewer: (index: number) => void
  /** Lightweight notify (ref-style) of the current index — for the fly-to-cart image. */
  onIndexChange?: (index: number) => void
}

/**
 * Self-contained product image gallery (horizontal pager + page counter +
 * thumbnail strip). It owns `activeImage` LOCALLY, so swiping re-renders only
 * this component — never the heavy ProductDetailScreen tree (description,
 * related products, reviews). That's the fix for the swipe lag: the giant parent
 * used to re-render on every page-cross.
 *
 * The carefully-tuned scroll sync is preserved verbatim: live tracking commits
 * the index at the halfway point for user swipes, while programmatic scrolls
 * (thumbnail / variant taps) are ignored mid-flight via a ref guard.
 */
const ProductGallery = forwardRef<ProductGalleryHandle, ProductGalleryProps>(
  (
    { images, imagesWithVariants, isDarkMode = false, onVariantFocus, onOpenViewer, onIndexChange },
    ref
  ) => {
    const [activeImage, setActiveImage] = useState(0)
    const galleryScrollRef = useRef<ScrollView>(null)
    // Tracks the image currently in view, so focus logic runs once per crossing
    // (not per scroll frame).
    const lastGalleryIndexRef = useRef(0)
    // True while an animated scrollTo is in flight, so live onScroll tracking
    // ignores the intermediate pages it passes through.
    const isProgrammaticScrollRef = useRef(false)

    const bg = isDarkMode ? "#0f172a" : "#f5f5f5"
    const divider = isDarkMode ? "#334155" : "#f1f5f9"

    // Focus a gallery image: update the active image + matching variant. Called
    // live from onScroll, guarded so it fires once per image crossing.
    const focusGalleryImage = (index: number) => {
      if (index < 0 || index >= images.length) return
      if (index === lastGalleryIndexRef.current) return
      lastGalleryIndexRef.current = index
      setActiveImage(index)
      onIndexChange?.(index)
      const item = imagesWithVariants[index]
      if (item && item.variantId !== null) onVariantFocus(item.variantId)
    }

    // Tap a thumbnail: scroll the gallery to that image and sync the active
    // index + matching variant. lastGalleryIndexRef is set so the resulting
    // onMomentumScrollEnd is a no-op (avoids a double update).
    const handleSelectImage = (index: number) => {
      if (index < 0 || index >= images.length) return
      lastGalleryIndexRef.current = index
      setActiveImage(index)
      onIndexChange?.(index)
      isProgrammaticScrollRef.current = true
      galleryScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
      const item = imagesWithVariants[index]
      if (item && item.variantId !== null) onVariantFocus(item.variantId)
    }

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index: number) => {
        if (index < 0 || index >= images.length) return
        lastGalleryIndexRef.current = index
        setActiveImage(index)
        onIndexChange?.(index)
        isProgrammaticScrollRef.current = true
        galleryScrollRef.current?.scrollTo({
          x: index * SCREEN_WIDTH,
          animated: true,
        })
      },
    }))

    return (
      <>
        <View
          style={[
            styles.galleryWrap,
            { backgroundColor: bg, borderBottomColor: divider },
          ]}
        >
          <ScrollView
            ref={galleryScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            disableIntervalMomentum
            scrollEventThrottle={16}
            style={{ backgroundColor: bg }}
            // A user touch always means a user-driven scroll — re-enable live
            // tracking even if a programmatic scroll was in flight.
            onScrollBeginDrag={() => {
              isProgrammaticScrollRef.current = false
            }}
            // Live tracking for USER swipes only: index commits as the page
            // crosses halfway (feels instant); the ref guard means one state
            // update per page. Animated scrollTo is ignored here.
            onScroll={(e) => {
              if (isProgrammaticScrollRef.current) return
              focusGalleryImage(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              )
            }}
            // Final settle for both user and programmatic scrolls.
            onMomentumScrollEnd={(e) => {
              isProgrammaticScrollRef.current = false
              focusGalleryImage(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              )
            }}
            // Fallback for slow drags with no momentum (esp. Android).
            onScrollEndDrag={(e) => {
              focusGalleryImage(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              )
            }}
          >
            {images.length > 0 ? (
              images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.95}
                  onPress={() => {
                    handleSelectImage(i)
                    onOpenViewer(i)
                  }}
                  style={[styles.galleryImageContainer, { backgroundColor: bg }]}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.galleryImage}
                    contentFit="contain"
                    transition={150}
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={[
                  styles.galleryImageContainer,
                  styles.galleryFallback,
                  { backgroundColor: bg },
                ]}
              >
                <Ionicons name="image-outline" size={48} color="#d1d5db" />
              </View>
            )}
          </ScrollView>

          {images.length > 0 && (
            <View style={styles.galleryPageCounter}>
              <Text style={styles.galleryPageCounterText}>
                {activeImage + 1}/{images.length}
              </Text>
            </View>
          )}
        </View>

        <GalleryThumbnails
          images={images}
          activeIndex={activeImage}
          isDarkMode={isDarkMode}
          onSelectIndex={handleSelectImage}
        />
      </>
    )
  }
)

ProductGallery.displayName = "ProductGallery"

export default ProductGallery
