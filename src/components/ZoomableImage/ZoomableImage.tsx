import React, { useRef, useState } from "react"
import {
  Animated,
  PanResponder,
  StyleSheet,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from "react-native"
import { Image } from "expo-image"

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_MS = 280
const DOUBLE_TAP_SCALE = 2.5

interface ZoomableImageProps {
  uri: string
  /** Notifies the parent when this image is zoomed in (so it can disable the
   *  pager's horizontal paging while the user pans around). */
  onZoomChange?: (zoomed: boolean) => void
  containerStyle?: StyleProp<ViewStyle>
  imageStyle?: StyleProp<ImageStyle>
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max)

const touchDistance = (touches: any[]) => {
  const dx = touches[0].pageX - touches[1].pageX
  const dy = touches[0].pageY - touches[1].pageY
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Pinch-to-zoom + pan + double-tap image, built on the core Animated +
 * PanResponder APIs (no react-native-gesture-handler / reanimated, so no native
 * rebuild). Used inside the full-screen image popups so customers can zoom in to
 * inspect product photos. When zoomed it reports up via `onZoomChange` so the
 * host pager disables horizontal paging until the user zooms back out.
 */
export default function ZoomableImage({
  uri,
  onZoomChange,
  containerStyle,
  imageStyle,
}: ZoomableImageProps) {
  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  // Committed values (after a gesture ends) + live values (during a gesture).
  const baseScale = useRef(1)
  const baseTX = useRef(0)
  const baseTY = useRef(0)
  const curScale = useRef(1)
  const curTX = useRef(0)
  const curTY = useRef(0)
  const startDist = useRef(0)
  const lastTap = useRef(0)
  const zoomedRef = useRef(false)
  const size = useRef({ w: 0, h: 0 })

  const [, force] = useState(0)

  const setZoomed = (z: boolean) => {
    if (zoomedRef.current !== z) {
      zoomedRef.current = z
      onZoomChange?.(z)
    }
  }

  // Keep the pan within the scaled image's overflow so it can't be dragged off.
  const boundTranslate = (tx: number, ty: number, s: number) => {
    const maxX = ((s - 1) * size.current.w) / 2
    const maxY = ((s - 1) * size.current.h) / 2
    return { x: clamp(tx, -maxX, maxX), y: clamp(ty, -maxY, maxY) }
  }

  const animateTo = (s: number, tx: number, ty: number) => {
    baseScale.current = s
    baseTX.current = tx
    baseTY.current = ty
    curScale.current = s
    curTX.current = tx
    curTY.current = ty
    setZoomed(s > MIN_SCALE)
    Animated.parallel([
      Animated.spring(scale, { toValue: s, useNativeDriver: true, bounciness: 0 }),
      Animated.spring(translateX, { toValue: tx, useNativeDriver: true, bounciness: 0 }),
      Animated.spring(translateY, { toValue: ty, useNativeDriver: true, bounciness: 0 }),
    ]).start()
  }

  const reset = () => animateTo(1, 0, 0)

  const handleDoubleTap = () => {
    if (zoomedRef.current) reset()
    else animateTo(DOUBLE_TAP_SCALE, 0, 0)
  }

  const panResponder = useRef(
    PanResponder.create({
      // Grab two-finger gestures even inside a parent ScrollView (capture phase).
      onMoveShouldSetPanResponderCapture: (evt) =>
        evt.nativeEvent.touches.length === 2,
      onStartShouldSetPanResponder: (evt) => {
        // Double-tap detection (only for a single finger).
        if (evt.nativeEvent.touches.length === 1) {
          const now = Date.now()
          if (now - lastTap.current < DOUBLE_TAP_MS) {
            handleDoubleTap()
            lastTap.current = 0
          } else {
            lastTap.current = now
          }
        }
        return false
      },
      onMoveShouldSetPanResponder: (evt, g) => {
        const touches = evt.nativeEvent.touches
        if (touches.length === 2) return true
        // Single finger only pans once zoomed in (otherwise let the pager swipe).
        return (
          zoomedRef.current && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2)
        )
      },
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches
        if (touches.length === 2) startDist.current = touchDistance(touches)
      },
      onPanResponderMove: (evt, g) => {
        const touches = evt.nativeEvent.touches
        if (touches.length === 2) {
          const d = touchDistance(touches)
          if (startDist.current <= 0) {
            startDist.current = d
            return
          }
          const s = clamp(
            baseScale.current * (d / startDist.current),
            MIN_SCALE,
            MAX_SCALE
          )
          curScale.current = s
          scale.setValue(s)
          const { x, y } = boundTranslate(baseTX.current, baseTY.current, s)
          curTX.current = x
          curTY.current = y
          translateX.setValue(x)
          translateY.setValue(y)
        } else if (touches.length === 1 && zoomedRef.current) {
          const { x, y } = boundTranslate(
            baseTX.current + g.dx,
            baseTY.current + g.dy,
            curScale.current
          )
          curTX.current = x
          curTY.current = y
          translateX.setValue(x)
          translateY.setValue(y)
        }
      },
      onPanResponderRelease: () => {
        startDist.current = 0
        if (curScale.current <= MIN_SCALE + 0.01) {
          reset()
        } else {
          baseScale.current = curScale.current
          baseTX.current = curTX.current
          baseTY.current = curTY.current
          setZoomed(true)
        }
      },
      onPanResponderTerminate: () => {
        startDist.current = 0
      },
      onPanResponderTerminationRequest: () => false,
    })
  ).current

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    if (width !== size.current.w || height !== size.current.h) {
      size.current = { w: width, h: height }
      // Ensure first measurement is reflected (bounds depend on it).
      force((n) => n + 1)
    }
  }

  return (
    <Animated.View
      onLayout={onLayout}
      style={[styles.container, containerStyle]}
      {...panResponder.panHandlers}
    >
      <Animated.View
        style={[
          styles.fill,
          { transform: [{ translateX }, { translateY }, { scale }] },
        ]}
      >
        <Image
          source={{ uri }}
          style={[styles.image, imageStyle]}
          contentFit="contain"
          transition={150}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  fill: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
})
