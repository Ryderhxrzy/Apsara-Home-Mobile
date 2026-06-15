import React, { useEffect, useRef, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  BackHandler,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { WebView } from "react-native-webview"
import { Colors } from "../constants/colors"
import { LEGAL_URLS, LEGAL_TITLES, LegalDoc } from "../constants/legal"

interface LegalWebViewScreenProps {
  doc: LegalDoc
  onClose: () => void
  isDarkMode?: boolean
}

export default function LegalWebViewScreen({
  doc,
  onClose,
  isDarkMode = false,
}: LegalWebViewScreenProps) {
  const [loading, setLoading] = useState(true)
  const webRef = useRef<WebView>(null)

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [onClose])

  const c = {
    bg: isDarkMode ? "#0f172a" : Colors.white,
    headerBg: isDarkMode ? "#1f2937" : Colors.white,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    text: isDarkMode ? "#f8fafc" : Colors.text,
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: c.headerBg, borderBottomColor: c.border },
        ]}
      >
        <Pressable
          onPress={onClose}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          {LEGAL_TITLES[doc]}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.body}>
        <WebView
          ref={webRef}
          source={{ uri: LEGAL_URLS[doc] }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
          originWhitelist={["*"]}
          style={{ backgroundColor: c.bg, opacity: loading ? 0 : 1 }}
        />
        {loading ? (
          <View style={[styles.loading, { backgroundColor: c.bg }]}>
            <ActivityIndicator size="large" color={Colors.sky} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "700" },
  body: { flex: 1 },
  loading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
})
