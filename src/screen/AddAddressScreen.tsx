import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Ionicons from "../components/ui/Icon"
import { LinearGradient } from "expo-linear-gradient"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Colors } from "../constants/colors"
import Toast from "react-native-toast-message"
import {
  addressSchema,
  ADDRESS_DEFAULTS,
  AddressValues,
} from "../schemas/addressSchemas"
import ControlledFormField from "../components/ui/ControlledFormField"
import BottomSheetSelector from "../components/BottomSheetSelector/BottomSheetSelector"
import { useRegions } from "../hooks/query/useRegions"
import { useProvinces } from "../hooks/query/useProvinces"
import { useCities } from "../hooks/query/useCities"
import { useBarangays } from "../hooks/query/useBarangays"
import styles from "../styles/AddAddressScreen.styles"

interface LocationData {
  code: string
  name: string
  zipCode?: string
}

interface AddAddressScreenProps {
  isDarkMode?: boolean
  onBack?: () => void
  onAddressAdded?: () => void
  token?: string
}

export default function AddAddressScreen({
  isDarkMode = false,
  onBack,
  onAddressAdded,
  token,
}: AddAddressScreenProps) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)

  // Free-text fields are managed by react-hook-form + zod (addressSchema).
  const { control, handleSubmit } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: ADDRESS_DEFAULTS,
    mode: "onBlur",
  })

  // Form states
  const [locationType, setLocationType] = useState("Home")
  const [region, setRegion] = useState<LocationData | null>(null)
  const [province, setProvince] = useState<LocationData | null>(null)
  const [city, setCity] = useState<LocationData | null>(null)
  const [barangay, setBarangay] = useState<LocationData | null>(null)

  // Dropdown states
  const [showLocationTypeModal, setShowLocationTypeModal] = useState(false)
  const [showRegionModal, setShowRegionModal] = useState(false)
  const [showProvinceModal, setShowProvinceModal] = useState(false)
  const [showCityModal, setShowCityModal] = useState(false)
  const [showBarangayModal, setShowBarangayModal] = useState(false)

  // Data states
  const {
    data: regions = [],
    isLoading: loadingRegions,
    isError: regionsError,
  } = useRegions()
  const {
    data: provinces = [],
    isLoading: loadingProvinces,
    isError: provincesError,
  } = useProvinces(region?.code)
  const {
    data: cities = [],
    isLoading: loadingCities,
    isError: citiesError,
  } = useCities(province?.code)
  const {
    data: barangays = [],
    isLoading: loadingBarangays,
    isError: barangaysError,
  } = useBarangays(city?.code)

  const locationTypes = ["Home", "Office", "Other"]

  const colors = {
    bg: isDarkMode ? "#0f172a" : "#f0f9ff",
    containerBg: isDarkMode ? "#1f2937" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    border: isDarkMode ? "#374151" : "#e5e7eb",
    borderLight: isDarkMode ? "#475569" : "#f1f5f9",
  }

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack?.()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack])

  // Surface a toast if any location lookup fails. The lists themselves load via
  // the useRegions/useProvinces/useCities/useBarangays dependent queries.
  useEffect(() => {
    if (regionsError) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load regions" })
    }
  }, [regionsError])

  useEffect(() => {
    if (provincesError) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load provinces" })
    }
  }, [provincesError])

  useEffect(() => {
    if (citiesError) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load cities" })
    }
  }, [citiesError])

  useEffect(() => {
    if (barangaysError) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load barangays" })
    }
  }, [barangaysError])

  // Selecting a parent clears the child selections; the dependent queries then
  // refetch the next level automatically from the new region/province/city code.
  const handleRegionSelect = (selectedRegion: LocationData) => {
    setRegion(selectedRegion)
    setProvince(null)
    setCity(null)
    setBarangay(null)
    setShowRegionModal(false)
  }

  const handleProvinceSelect = (selectedProvince: LocationData) => {
    setProvince(selectedProvince)
    setCity(null)
    setBarangay(null)
    setShowProvinceModal(false)
  }

  const handleCitySelect = (selectedCity: LocationData) => {
    setCity(selectedCity)
    setBarangay(null)
    setShowCityModal(false)
  }

  const handleBarangaySelect = (selectedBarangay: LocationData) => {
    setBarangay(selectedBarangay)
    setShowBarangayModal(false)
  }

  // Text fields are validated by zodResolver; here we only need to check the
  // dependent location dropdowns (kept in component state).
  const onSubmit = async (_values: AddressValues) => {
    if (!region || !province || !city || !barangay) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select region, province, city, and barangay",
      })
      return
    }

    setLoading(true)
    try {
      // For now, just show a success message
      // In a real app, you'd make an API call to save the address
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Address added successfully",
      })
      onAddressAdded?.()
    } catch (error) {
      console.error("Error adding address:", error)
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to add address",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <LinearGradient
        colors={
          isDarkMode
            ? ["rgba(59,130,246,0.15)", "rgba(31,41,55,0)"]
            : ["rgba(14,165,233,0.18)", "rgba(255,255,255,0)"]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: insets.top,
            backgroundColor: isDarkMode ? "#1f2937" : Colors.white,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons
              name="chevron-back-outline"
              size={24}
              color={isDarkMode ? "#e5e7eb" : Colors.text}
            />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.headerGreeting,
                { color: isDarkMode ? "#f8fafc" : Colors.text },
              ]}
            >
              Add Address
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: isDarkMode ? "#9ca3af" : Colors.textSecondary },
              ]}
            >
              Add a new shipping address
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* Form */}
      <ScrollView
        style={[styles.content, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.section,
            { backgroundColor: colors.containerBg, borderColor: colors.border },
          ]}
        >
          {/* Location Type */}
          <Text style={[styles.label, { color: colors.text }]}>
            Location Type *
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowLocationTypeModal(true)}
          >
            <Text style={[styles.selectButtonText, { color: colors.text }]}>
              {locationType}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSec} />
          </TouchableOpacity>

          {/* Name */}
          <ControlledFormField
            control={control}
            name="fullName"
            label="Name"
            required
            placeholder="Enter your name"
            leftIcon="person-outline"
            isDarkMode={isDarkMode}
            containerStyle={{ marginTop: 16 }}
          />

          {/* Contact Number */}
          <ControlledFormField
            control={control}
            name="contactNumber"
            label="Contact Number"
            required
            placeholder="Enter contact number"
            keyboardType="phone-pad"
            leftIcon="call-outline"
            isDarkMode={isDarkMode}
          />

          {/* Region */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
            Region *
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowRegionModal(true)}
          >
            <Text
              style={[
                styles.selectButtonText,
                { color: region ? colors.text : colors.textSec },
              ]}
            >
              {region ? region.name : "Select region"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSec} />
          </TouchableOpacity>

          {/* Province */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
            Province *
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
                opacity: region ? 1 : 0.5,
              },
            ]}
            onPress={() => region && setShowProvinceModal(true)}
            disabled={!region}
          >
            <Text
              style={[
                styles.selectButtonText,
                { color: province ? colors.text : colors.textSec },
              ]}
            >
              {province ? province.name : "Select province"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSec} />
          </TouchableOpacity>

          {/* City */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
            City *
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
                opacity: province ? 1 : 0.5,
              },
            ]}
            onPress={() => province && setShowCityModal(true)}
            disabled={!province}
          >
            <Text
              style={[
                styles.selectButtonText,
                { color: city ? colors.text : colors.textSec },
              ]}
            >
              {city ? city.name : "Select city"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSec} />
          </TouchableOpacity>

          {/* Barangay */}
          <Text style={[styles.label, { color: colors.text, marginTop: 12 }]}>
            Barangay *
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.borderLight,
                borderColor: colors.border,
                opacity: city ? 1 : 0.5,
              },
            ]}
            onPress={() => city && setShowBarangayModal(true)}
            disabled={!city}
          >
            <Text
              style={[
                styles.selectButtonText,
                { color: barangay ? colors.text : colors.textSec },
              ]}
            >
              {barangay ? barangay.name : "Select barangay"}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSec} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Button */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.containerBg,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.addButton,
            { backgroundColor: Colors.sky, opacity: loading ? 0.6 : 1 },
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Ionicons name="add-circle" size={18} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Address</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Location Type Bottom Sheet */}
      <BottomSheetSelector
        visible={showLocationTypeModal}
        title="Select Location Type"
        items={locationTypes.map((type) => ({ code: type, name: type }))}
        selectedItem={
          locationTypes
            .map((type) => ({ code: type, name: type }))
            .find((item) => item.code === locationType) || null
        }
        isDarkMode={isDarkMode}
        onSelect={(item) => {
          setLocationType(item.code)
          setShowLocationTypeModal(false)
        }}
        onClose={() => setShowLocationTypeModal(false)}
      />

      {/* Region Bottom Sheet */}
      <BottomSheetSelector
        visible={showRegionModal}
        title="Select Region"
        items={regions}
        selectedItem={region}
        loading={loadingRegions}
        isDarkMode={isDarkMode}
        onSelect={handleRegionSelect}
        onClose={() => setShowRegionModal(false)}
      />

      {/* Province Bottom Sheet */}
      <BottomSheetSelector
        visible={showProvinceModal}
        title="Select Province"
        items={provinces}
        selectedItem={province}
        loading={loadingProvinces}
        isDarkMode={isDarkMode}
        onSelect={handleProvinceSelect}
        onClose={() => setShowProvinceModal(false)}
      />

      {/* City Bottom Sheet */}
      <BottomSheetSelector
        visible={showCityModal}
        title="Select City"
        items={cities}
        selectedItem={city}
        loading={loadingCities}
        isDarkMode={isDarkMode}
        onSelect={handleCitySelect}
        onClose={() => setShowCityModal(false)}
      />

      {/* Barangay Bottom Sheet */}
      <BottomSheetSelector
        visible={showBarangayModal}
        title="Select Barangay"
        items={barangays}
        selectedItem={barangay}
        loading={loadingBarangays}
        isDarkMode={isDarkMode}
        onSelect={handleBarangaySelect}
        onClose={() => setShowBarangayModal(false)}
      />
    </View>
  )
}
