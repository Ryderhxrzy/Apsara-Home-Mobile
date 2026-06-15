import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Image } from "expo-image"
import Ionicons from "../ui/Icon"
import { Colors } from "../../constants/colors"

export interface StripVariant {
  id: number
  name?: string
  sku?: string
  color?: string
  colorHex?: string | null
  size?: string
  images?: string[]
  priceMember?: number
  qty?: number
}

interface ProductVariantStripProps {
  variants: StripVariant[]
  selectedVariantId: number | null
  isDarkMode?: boolean
  onSelectVariant: (variantId: number) => void
  /** Tap the Selected card's thumbnail → open the swipable image viewer. */
  onPressSelectedImage?: (variantId: number) => void
}

// Human label for a variant: color ("Black"), size ("4x48x75"), name, or sku.
export const variantLabel = (v: StripVariant) =>
  v.color || v.size || v.name || v.sku || ""

// Placeholder hexes like "#N/A" are truthy but not real colors — only strict
// #RGB / #RRGGBB values render as a color dot.
export const isValidHex = (hex?: string | null): boolean =>
  !!hex && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(hex).trim())

/**
 * Variation picker shown under the gallery thumbnails.
 *
 * Variations render as TEXT buttons (label + price + stock) in a 2-column wrap
 * grid — no image tiles, so they don't duplicate the gallery thumbnail strip.
 * The selected variation is summarized in a card above the grid with a small
 * image (variant image, falling back to the product image); tapping that image
 * opens the swipable fullscreen viewer at the variant's photo.
 *
 * React Compiler (app.json) auto-memoizes this component — no manual memo.
 */
function ProductVariantStrip({
  variants,
  selectedVariantId,
  isDarkMode = false,
  onSelectVariant,
  onPressSelectedImage,
}: ProductVariantStripProps) {
  const cardBg = isDarkMode ? "#1e293b" : Colors.white
  const border = isDarkMode ? "#334155" : "#e5e7eb"
  const text = isDarkMode ? "#f8fafc" : Colors.text
  const textSec = isDarkMode ? "#94a3b8" : Colors.textSecondary
  const optionBg = isDarkMode ? "#0f172a" : Colors.white
  const selectedBg = isDarkMode ? "rgba(14,165,233,0.12)" : "#f0f9ff"

  const selected = variants.find((v) => v.id === selectedVariantId)
  // Only the variant's OWN photo — variations without images show no image UI
  // (no thumbnail, no viewer entry point), just their text/color.
  const selectedImage = selected?.images?.[0]

  return (
    <View style={[styles.bar, { backgroundColor: cardBg, borderBottomColor: border }]}>
      {/* Header */}
      <Text style={[styles.headerTitle, { color: text }]}>
        {variants.length} {variants.length === 1 ? "Variation" : "Variations"}{" "}
        Available
      </Text>

      {/* Selected summary — small image + variation text. Tapping the image
          opens the swipable fullscreen viewer for this variation. */}
      {selected ? (
        <View
          style={[
            styles.selectedCard,
            { backgroundColor: selectedBg, borderColor: Colors.sky + "55" },
          ]}
        >
          {selectedImage ? (
            <Pressable
              onPress={() => onPressSelectedImage?.(selected.id)}
              style={({ pressed }) => [
                styles.selectedImageWrap,
                { borderColor: border, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="imagebutton"
              accessibilityLabel={`View ${variantLabel(selected)} images`}
            >
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                contentFit="cover"
                transition={150}
              />
              <View style={styles.selectedImageZoom}>
                <Ionicons
                  name="expand-outline"
                  size={10}
                  color={Colors.white}
                />
              </View>
            </Pressable>
          ) : isValidHex(selected.colorHex) ? (
            <View
              style={[
                styles.selectedColorSwatch,
                { backgroundColor: selected.colorHex as string, borderColor: border },
              ]}
            />
          ) : null}
          <View style={styles.selectedInfo}>
            <Text style={[styles.selectedLabel, { color: textSec }]}>
              Selected:{" "}
              <Text style={styles.selectedValue}>{variantLabel(selected)}</Text>
            </Text>
            <Text style={[styles.selectedMeta, { color: textSec }]}>
              {selected.priceMember != null
                ? `₱${selected.priceMember.toLocaleString()}`
                : ""}
              {selected.priceMember != null && selected.qty != null ? " · " : ""}
              {selected.qty != null ? `${selected.qty} available` : ""}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Variation options — text buttons in a 2-column wrap grid */}
      <View style={styles.optionsGrid}>
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id
          return (
            <Pressable
              key={variant.id}
              onPress={() => onSelectVariant(variant.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? selectedBg : optionBg,
                  borderColor: isSelected ? Colors.sky : border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={variantLabel(variant)}
            >
              <View style={styles.optionLabelRow}>
                {isValidHex(variant.colorHex) && (
                  <View
                    style={[
                      styles.optionColorDot,
                      {
                        backgroundColor: variant.colorHex as string,
                        borderColor: border,
                      },
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? Colors.sky : text },
                  ]}
                  numberOfLines={2}
                >
                  {variantLabel(variant)}
                </Text>
              </View>
              {variant.priceMember != null || variant.qty != null ? (
                <Text style={[styles.optionMeta, { color: textSec }]}>
                  {variant.priceMember != null
                    ? `₱${variant.priceMember.toLocaleString()}`
                    : ""}
                  {variant.priceMember != null && variant.qty != null
                    ? " · "
                    : ""}
                  {variant.qty != null ? `${variant.qty} left` : ""}
                </Text>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default ProductVariantStrip

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
  },
  selectedImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  selectedImageZoom: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderTopLeftRadius: 6,
    padding: 2,
  },
  selectedInfo: {
    flex: 1,
    gap: 2,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedValue: {
    color: Colors.sky,
    fontWeight: "700",
  },
  selectedMeta: {
    fontSize: 11,
  },
  selectedColorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  optionColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  option: {
    flexBasis: "48%",
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  optionLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    flexShrink: 1,
  },
  optionMeta: {
    fontSize: 11,
  },
})
