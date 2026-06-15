import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native"
import { Image } from "expo-image"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import axios from "axios"
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio"
import { Colors } from "../constants/colors"
import { authService, SearchHistoryItem } from "../services/authService"
import { userBehaviorService } from "../services/userBehaviorService"
import { API_CONFIG } from "../config/api"
import { useLiveSearch } from "../hooks/query/useLiveSearch"
import { useSearchRecommendations } from "../hooks/query/useSearchRecommendations"
import Toast from "react-native-toast-message"
import styles from "../styles/SearchScreen.styles"

const SCREEN_WIDTH = Dimensions.get("window").width
const CARD_WIDTH = (SCREEN_WIDTH - 8 - 8 - 8) / 2

interface SearchScreenProps {
  onBack: () => void
  token?: string | null
  onProductPress?: (id: number) => void
  onSearchSubmit?: (query: string) => void
  isDarkMode?: boolean
}

interface RecommendationItem {
  id: number
  name: string
  image: string
  category_name: string
  type: string
}

function getHistoryLabel(item: SearchHistoryItem) {
  return item.query ?? item.term ?? item.keyword ?? item.name ?? ""
}

export default function SearchScreen({
  onBack,
  token,
  onProductPress,
  onSearchSubmit,
  isDarkMode = false,
}: SearchScreenProps) {
  const insets = useSafeAreaInsets()

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f5f5f5",
    headerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSecondary: isDarkMode ? "#9ca3af" : Colors.textSecondary,
    input: isDarkMode ? "#374151" : Colors.white,
    inputBorder: isDarkMode ? "#4b5563" : "#e5e7eb",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    liveRow: isDarkMode ? "#1e293b" : Colors.white,
  }

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [savingQuery, setSavingQuery] = useState(false)
  const [showAllRecent, setShowAllRecent] = useState(false)
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [voiceText, setVoiceText] = useState("")
  const inputRef = useRef<TextInput>(null)
  const slideAnim = useState(() => new Animated.Value(SCREEN_WIDTH))[0]
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)

  const { data: recommendations = [], isFetching: loadingRecs } =
    useSearchRecommendations({ token })

  const { data: liveResults = [], isFetching: isLiveFetching } = useLiveSearch({
    query: debouncedQuery,
  })
  // Show the loading spinner while the user is still typing (query !== debounced)
  // or while the live query is in flight.
  const loadingLive =
    query.trim().length >= 2 &&
    (isLiveFetching || query.trim() !== debouncedQuery.trim())

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start(() => inputRef.current?.focus())
  }, [])

  useEffect(() => {
    initializeAudio()
    return () => {
      audioRecorder.stop().catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initializeAudio = async () => {
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: false,
      })
    } catch (error) {
      console.error("Audio mode setup failed:", error)
    }
  }

  const transcribeAudio = async (uri: string) => {
    try {
      const formData = new FormData()
      const normalizedUri = uri.startsWith("file://") ? uri : `file://${uri}`
      const fileBlob = await fetch(normalizedUri).then((res) => res.blob())
      formData.append("audio", fileBlob, "audio.m4a")

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/transcribe`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      )

      return response.data?.text || ""
    } catch (error) {
      console.error("Transcription error:", error)
      Toast.show({
        type: "error",
        text1: "Transcription Failed",
        text2: "Could not process audio. Please try again.",
      })
      return ""
    }
  }

  const requestMicrophonePermission = async () => {
    try {
      const permission = await getRecordingPermissionsAsync()
      if (permission.granted) {
        return true
      }

      const newPermission = await requestRecordingPermissionsAsync()
      return newPermission.granted
    } catch (error) {
      console.error("Permission error:", error)
      return false
    }
  }

  const handleMicPress = async () => {
    try {
      const hasPermission = await requestMicrophonePermission()
      if (!hasPermission) {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Microphone permission is required for voice search",
        })
        return
      }

      if (isVoiceRecording) {
        await stopRecording()
      } else {
        await startRecording()
      }
    } catch (error: any) {
      console.error("Voice error:", error)
      Toast.show({
        type: "error",
        text1: "Voice Search Error",
        text2: error.message || "An error occurred",
      })
      setIsVoiceRecording(false)
    }
  }

  const startRecording = async () => {
    try {
      setIsVoiceRecording(true)
      setVoiceText("")

      await audioRecorder.prepareToRecordAsync()
      audioRecorder.record()
    } catch (error) {
      console.error("Failed to start recording:", error)
      setIsVoiceRecording(false)
      throw error
    }
  }

  const stopRecording = async () => {
    try {
      setIsVoiceRecording(false)

      await audioRecorder.stop()
      const uri = audioRecorder.uri

      if (uri) {
        const transcript = await transcribeAudio(uri)
        if (transcript) {
          setVoiceText(transcript)
          setQuery(transcript)
        }
      }
    } catch (error) {
      console.error("Failed to stop recording:", error)
      throw error
    }
  }

  useEffect(() => {
    if (!token) return
    let active = true
    setLoadingHistory(true)
    authService
      .getSearchHistory(token)
      .then((items) => {
        if (active) setHistory(items)
      })
      .catch((error) => {
        if (!active) return
        Toast.show({
          type: "error",
          text1: "Search history failed",
          text2: error.message || "Unable to load search history.",
        })
      })
      .finally(() => {
        if (active) setLoadingHistory(false)
      })
    return () => {
      active = false
    }
  }, [token])

  const displayedRecommendations = useMemo<RecommendationItem[]>(() => {
    const shuffled = [...(recommendations as RecommendationItem[])]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, 6)
  }, [recommendations])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setDebouncedQuery("")
      return
    }
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const recentSearches = useMemo(() => {
    const seen = new Set<string>()
    const labels = history
      .map(getHistoryLabel)
      .map((label) => label.trim())
      .filter(Boolean)
      .filter((label) => {
        const normalized = label.toLowerCase()
        if (seen.has(normalized)) return false
        seen.add(normalized)
        return true
      })
    if (labels.length > 0) return labels.slice(0, 15)
    return ["sofa", "dining table", "bed frame", "floor lamp", "curtains"]
  }, [history])

  function handleBack() {
    inputRef.current?.blur()
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onBack())
  }

  async function submitSearch(term: string) {
    const next = term.trim()
    if (!next) return
    setQuery(next)
    if (!token) {
      Toast.show({
        type: "error",
        text1: "Search unavailable",
        text2: "Please sign in again.",
      })
      return
    }
    setSavingQuery(true)
    try {
      await authService.saveSearchHistory(token, next)
      setHistory((prev) => {
        const normalized = prev.filter(
          (item) => getHistoryLabel(item).toLowerCase() !== next.toLowerCase()
        )
        return [{ query: next }, ...normalized].slice(0, 8)
      })
      // Track search behavior
      userBehaviorService
        .trackBehavior(token, "search", undefined, undefined, undefined, next)
        .catch(() => {})
      onSearchSubmit?.(next)
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Search failed",
        text2: error.message || "Unable to save the search.",
      })
      onSearchSubmit?.(next) // proceed anyway
    } finally {
      setSavingQuery(false)
    }
  }

  const hasQuery = query.trim().length > 0

  return (
    <Animated.View
      style={[
        styles.root,
        isDarkMode && styles.rootDark,
        { transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={styles.headerBackground}>
        <Image
          source={{
          uri: "https://res.cloudinary.com/dc05ncs6l/image/upload/v1780969375/header_bg_jjpkvu.png"
        }}
          style={styles.headerBackgroundImage}
          contentFit="cover"
          transition={200}
        />
        <View
          style={[
            styles.header,
            { paddingTop: insets.top + 10, paddingHorizontal: 12 },
          ]}
        >
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>

          <View
            style={[
              styles.searchWrapper,
              isDarkMode && styles.searchWrapperDark,
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
              color={Colors.white}
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={[
                styles.searchInput,
                isDarkMode && styles.searchInputDark,
                { color: Colors.white },
              ]}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => submitSearch(query)}
              placeholder="Search products..."
              placeholderTextColor={Colors.white}
              returnKeyType="search"
            />
            {hasQuery ? (
              <TouchableOpacity
                onPress={() => setQuery("")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleMicPress}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isVoiceRecording ? "mic" : "mic-outline"}
                  size={18}
                  color={isVoiceRecording ? Colors.forest : Colors.white}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={handleBack}
            style={styles.cancelBtn}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: Colors.white }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={[
          styles.scroll,
          { backgroundColor: hasQuery ? colors.liveRow : colors.bg },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={{
            backgroundColor: colors.liveRow,
            height: 1000,
            position: "absolute",
            top: -1000,
            left: 0,
            right: 0,
          }}
        />

        {/* Live search results */}
        {hasQuery && (
          <View style={styles.liveSection}>
            {loadingLive ? (
              <View style={styles.liveLoading}>
                <ActivityIndicator size="small" color={Colors.sky} />
                <Text
                  style={[
                    styles.liveLoadingText,
                    isDarkMode && styles.liveLoadingTextDark,
                  ]}
                >
                  Searching...
                </Text>
              </View>
            ) : liveResults.length > 0 ? (
              liveResults.map((item, index) => (
                <TouchableOpacity
                  key={`live-${item.id}`}
                  style={[
                    styles.liveRow,
                    isDarkMode && styles.liveRowDark,
                    index < liveResults.length - 1 && styles.liveRowBorder,
                    isDarkMode &&
                      index < liveResults.length - 1 &&
                      styles.liveRowBorderDark,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onProductPress?.(item.id)
                  }}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.liveThumb}
                    contentFit="cover"
                    transition={200}
                  />
                  <View style={styles.liveInfo}>
                    <Text
                      style={[
                        styles.liveName,
                        isDarkMode && styles.liveNameDark,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <View style={styles.livePriceRow}>
                      <Text style={styles.livePrice}>
                        ₱{item.discounted_price.toLocaleString()}
                      </Text>
                      {item.has_discount && (
                        <>
                          <Text style={styles.liveOriginalPrice}>
                            ₱{item.original_price.toLocaleString()}
                          </Text>
                          <View style={styles.liveDiscountBadge}>
                            <Text style={styles.liveDiscountText}>
                              {item.discount_percentage}% OFF
                            </Text>
                          </View>
                        </>
                      )}
                      <View style={styles.livePvBadge}>
                        <Ionicons name="star" size={8} color={Colors.white} />
                        <Text style={styles.livePvText}>PV {item.pv}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isDarkMode ? "#4b5563" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.liveEmpty}>
                <Ionicons
                  name="search-outline"
                  size={28}
                  color={isDarkMode ? "#4b5563" : "#d1d5db"}
                />
                <Text
                  style={[
                    styles.liveEmptyText,
                    isDarkMode && styles.liveEmptyTextDark,
                  ]}
                >
                  No results for {query}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent searches */}
        {!hasQuery && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <View style={styles.sectionRow}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDarkMode && styles.sectionTitleDark,
                ]}
              >
                Recent Searches
              </Text>
              {loadingHistory && (
                <ActivityIndicator size="small" color={Colors.sky} />
              )}
            </View>
            <View style={styles.historyList}>
              {recentSearches
                .slice(0, showAllRecent ? recentSearches.length : 5)
                .map((term, index, arr) => (
                  <TouchableOpacity
                    key={`recent-${term.toLowerCase()}`}
                    style={[
                      styles.historyRow,
                      index < arr.length - 1 && styles.historyRowBorder,
                      isDarkMode &&
                        index < arr.length - 1 &&
                        styles.historyRowBorderDark,
                    ]}
                    onPress={() => submitSearch(term)}
                    activeOpacity={0.7}
                    disabled={savingQuery}
                  >
                    <Ionicons
                      name="time-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.historyText,
                        isDarkMode && styles.historyTextDark,
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {term}
                    </Text>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={13}
                      color={isDarkMode ? "#4b5563" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                ))}
              {!showAllRecent && recentSearches.length > 5 && (
                <TouchableOpacity
                  style={styles.historySeeMoreRow}
                  onPress={() => setShowAllRecent(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.historySeeMoreText,
                      isDarkMode && styles.historySeeMoreTextDark,
                    ]}
                  >
                    See more
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={Colors.sky} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Recommendations */}
        {!hasQuery && (
          <View
            style={[styles.recsSection, isDarkMode && styles.recsSectionDark]}
          >
            <View style={styles.sectionRow}>
              <View style={styles.recsTitleRow}>
                <Ionicons name="sparkles" size={14} color={Colors.sky} />
                <Text
                  style={[
                    styles.sectionTitle,
                    isDarkMode && styles.sectionTitleDark,
                  ]}
                >
                  Recommended for You
                </Text>
              </View>
              {loadingRecs && (
                <ActivityIndicator size="small" color={Colors.sky} />
              )}
            </View>

            {loadingRecs && displayedRecommendations.length === 0 ? (
              <View
                style={[styles.recsTable, isDarkMode && styles.recsTableDark]}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.recsTableCell,
                      isDarkMode && styles.recsTableCellDark,
                    ]}
                  >
                    <View style={styles.recBoxContainer}>
                      <View
                        style={[
                          styles.recBoxWrap,
                          {
                            backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                          },
                        ]}
                      />
                    </View>
                    <View
                      style={{
                        height: 10,
                        width: 40,
                        backgroundColor: isDarkMode ? "#374151" : "#f1f5f9",
                        borderRadius: 4,
                        marginTop: 4,
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View
                style={[styles.recsTable, isDarkMode && styles.recsTableDark]}
              >
                {displayedRecommendations.map((item) => (
                  <TouchableOpacity
                    key={`rec-${item.id}`}
                    style={[
                      styles.recsTableCell,
                      isDarkMode && styles.recsTableCellDark,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onProductPress?.(item.id)}
                  >
                    <View style={styles.recBoxContainer}>
                      <View
                        style={[
                          styles.recBoxWrap,
                          isDarkMode && styles.recBoxWrapDark,
                        ]}
                      >
                        <Image
                          source={{ uri: item.image }}
                          style={styles.roomImage}
                          contentFit="contain"
                          transition={200}
                        />
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.circleLabel,
                        isDarkMode && styles.circleLabelDark,
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Animated.View>
  )
}
