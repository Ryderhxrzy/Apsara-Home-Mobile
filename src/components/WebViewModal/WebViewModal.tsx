import React from "react"
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
} from "react-native"
import { WebView } from "react-native-webview"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../ui/Icon"
import { Colors } from "../../constants/colors"
import { getColors, spacing, type as typo } from "../../theme/theme"

interface WebViewModalProps {
  visible: boolean
  url: string
  title?: string
  isDarkMode?: boolean
  onClose: () => void
}

/**
 * Lightweight in-app browser: full-screen modal with a themed header (close +
 * open-in-browser) and a loading overlay. Reused by the chatbot (Track Order)
 * and anywhere we need to show an afhome.ph page without leaving the app.
 */
export default function WebViewModal({
  visible,
  url,
  title = "AF Home",
  isDarkMode = false,
  onClose,
}: WebViewModalProps) {
  const insets = useSafeAreaInsets()
  const c = getColors(isDarkMode)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 8,
              backgroundColor: c.card,
              borderBottomColor: c.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerBtn} hitSlop={8}>
            <Ionicons name="close" size={24} color={c.text} />
          </TouchableOpacity>
          <Text style={[typo.title, styles.title, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            style={styles.headerBtn}
            hitSlop={8}
            accessibilityLabel="Open in browser"
          >
            <Ionicons name="open-outline" size={22} color={c.primary} />
          </TouchableOpacity>
        </View>

        {visible && !!url ? (
          <WebView
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: c.bg }}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.loading, { backgroundColor: c.bg }]}>
                <ActivityIndicator size="large" color={c.primary} />
                <Text style={[typo.bodySm, { color: c.textSecondary }]}>
                  Loading…
                </Text>
              </View>
            )}
          />
        ) : null}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
  },
  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
})
