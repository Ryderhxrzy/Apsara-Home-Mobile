import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  PanResponder,
  Pressable,
  Dimensions,
  BackHandler,
  ActivityIndicator,
  KeyboardTypeOptions,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Ionicons from "../components/ui/Icon"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Toast from "react-native-toast-message"
import { Colors } from "../constants/colors"
import { addressService, LocationData } from "../services/addressService"
import { useRegions } from "../hooks/query/useRegions"
import {
  profileSchema,
  buildProfileDefaults,
  ProfileFormValues,
} from "../schemas/profileSchemas"
import ControlledFormField from "../components/ui/ControlledFormField"
import Button from "../components/Button/PrimaryButton"
import styles from "../styles/ProfileEditScreen.styles"

interface ProfileEditScreenProps {
  user: any
  onBack: () => void
  onSave?: (data: any) => Promise<void>
  isDarkMode?: boolean
}

// Free-text fields bound to react-hook-form via ControlledFormField.
type TextFieldName =
  | "firstName"
  | "lastName"
  | "middleName"
  | "phone"
  | "occupation"
  | "streetAddress"
  | "zipCode"

const GENDERS = ["Male", "Female", "Other"]
const WORK_LOCATIONS = ["Local", "Overseas"]
const COUNTRIES = [
  "Philippines",
  "United States",
  "Canada",
  "Australia",
  "United Kingdom",
  "Other",
]

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

const SCREEN_HEIGHT = Dimensions.get("window").height
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.6

const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate()

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear; i >= 1950; i--) years.push(i)
  return years
}

// Location dropdowns whose options are loaded asynchronously.
const LOCATION_FIELDS = ["region", "province", "city", "barangay"]

export default function ProfileEditScreen({
  user,
  onBack,
  onSave,
  isDarkMode = false,
}: ProfileEditScreenProps) {
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)

  // All form values (text + selects + location + date) live in react-hook-form;
  // validation rules are in profileSchema (zod).
  const { control, handleSubmit, setValue, getValues, watch, formState } =
    useForm<ProfileFormValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: buildProfileDefaults(user),
      mode: "onBlur",
    })
  const { errors } = formState

  // Only subscribe the parent to the fields IT renders directly (selects, date,
  // location). Text fields are isolated inside ControlledFormField, so their
  // keystrokes don't re-render this component.
  const [
    genderValue,
    workLocationValue,
    countryValue,
    birthDateValue,
    regionValue,
    provinceValue,
    cityValue,
    barangayValue,
  ] = watch([
    "gender",
    "workLocation",
    "country",
    "birthDate",
    "region",
    "province",
    "city",
    "barangay",
  ])

  // Option lists for the location dropdowns (data/UI state, not form values).
  const { data: regions = [], isLoading: loadingRegions } = useRegions()
  const [provinces, setProvinces] = useState<LocationData[]>([])
  const [cities, setCities] = useState<LocationData[]>([])
  const [barangays, setBarangays] = useState<LocationData[]>([])

  const [selectedDropdown, setSelectedDropdown] = useState<string | null>(null)
  const [dropdownOptions, setDropdownOptions] = useState<LocationData[]>([])
  const [dropdownTitle, setDropdownTitle] = useState<string>("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [datePickerMode, setDatePickerMode] = useState<
    "year" | "month" | "day"
  >("year")
  const initialBirthDate = (() => {
    const parsed = new Date(user?.birth_date || "2000-01-01")
    return isNaN(parsed.getTime()) ? new Date(2000, 0, 1) : parsed
  })()
  const [tempYear, setTempYear] = useState(() => initialBirthDate.getFullYear())
  const [tempMonth, setTempMonth] = useState(() => initialBirthDate.getMonth())
  const [tempDay, setTempDay] = useState(() => initialBirthDate.getDate())
  const [isNCRRegion, setIsNCRRegion] = useState(false)

  const c = {
    bg: isDarkMode ? "#0b1220" : "#f0f9ff",
    card: isDarkMode ? "#1e293b" : Colors.white,
    cardAlt: isDarkMode ? "#0f172a" : "#f9fafb",
    border: isDarkMode ? "#334155" : "#e5e7eb",
    inputBg: isDarkMode ? "#0f172a" : Colors.white,
    text: isDarkMode ? "#f8fafc" : Colors.text,
    textSec: isDarkMode ? "#94a3b8" : Colors.textSecondary,
    heroFrom: isDarkMode ? "rgba(2,132,199,0.28)" : "rgba(14,165,233,0.20)",
    heroTo: isDarkMode ? "rgba(11,18,32,0)" : "rgba(240,249,255,0)",
    handle: isDarkMode ? "#475569" : "#cbd5e1",
    selectedBg: isDarkMode ? "#0c4a6e" : "#eff6ff",
  }

  const modalTranslateY = useState(() => new Animated.Value(MODAL_HEIGHT))[0]
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_evt, gestureState) => {
        if (gestureState.dy > 0) modalTranslateY.setValue(gestureState.dy)
      },
      onPanResponderRelease: (_evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(modalTranslateY, {
            toValue: MODAL_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setSelectedDropdown(null))
        } else {
          Animated.spring(modalTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 60,
            useNativeDriver: true,
          }).start()
        }
      },
    })
  ).current

  useEffect(() => {
    if (selectedDropdown) {
      Animated.spring(modalTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }).start()
    } else {
      modalTranslateY.setValue(MODAL_HEIGHT)
    }
  }, [selectedDropdown, modalTranslateY])

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        onBack()
        return true
      }
    )
    return () => backHandler.remove()
  }, [onBack])

  const showLocationError = (what: string) =>
    Toast.show({ type: "error", text1: "Error", text2: `Failed to load ${what}` })

  const fetchProvinces = async (regionCode: string) => {
    try {
      setLoadingLocations(true)
      setProvinces(await addressService.getProvinces(regionCode))
    } catch {
      showLocationError("provinces")
    } finally {
      setLoadingLocations(false)
    }
  }

  const fetchCities = async (code: string) => {
    try {
      setLoadingLocations(true)
      setCities(await addressService.getCities(code, isNCRRegion))
    } catch {
      showLocationError("cities")
    } finally {
      setLoadingLocations(false)
    }
  }

  const fetchBarangays = async (cityCode: string) => {
    try {
      setLoadingLocations(true)
      setBarangays(await addressService.getBarangays(cityCode))
    } catch {
      showLocationError("barangays")
    } finally {
      setLoadingLocations(false)
    }
  }

  const openDropdown = (
    field: string,
    options: string[] | LocationData[],
    title: string
  ) => {
    setSelectedDropdown(field)
    const formatted =
      Array.isArray(options) && typeof options[0] === "string"
        ? (options as string[]).map((opt) => ({ code: opt, name: opt }))
        : (options as LocationData[])
    setDropdownOptions(formatted)
    setDropdownTitle(title)
  }

  const formatDate = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const handleDatePickerNext = () => {
    if (datePickerMode === "year") setDatePickerMode("month")
    else if (datePickerMode === "month") setDatePickerMode("day")
  }

  const handleDatePickerPrev = () => {
    if (datePickerMode === "month") setDatePickerMode("year")
    else if (datePickerMode === "day") setDatePickerMode("month")
  }

  const handleDatePickerConfirm = () => {
    setValue("birthDate", formatDate(tempYear, tempMonth, tempDay), {
      shouldValidate: true,
    })
    setShowDatePicker(false)
    setDatePickerMode("year")
  }

  const selectDropdownOption = (value: LocationData | string) => {
    const field = selectedDropdown

    if (field === "gender") {
      setValue("gender", typeof value === "string" ? value : value.name, {
        shouldValidate: true,
      })
    } else if (field === "workLocation") {
      setValue("workLocation", typeof value === "string" ? value : value.name, {
        shouldValidate: true,
      })
    } else if (field === "country") {
      setValue("country", typeof value === "string" ? value : value.name, {
        shouldValidate: true,
      })
    } else if (field === "region" && typeof value !== "string") {
      setValue("region", value, { shouldValidate: true })
      setValue("province", null)
      setValue("city", null)
      setValue("barangay", null)
      setProvinces([])
      setCities([])
      setBarangays([])
      const isNCR =
        value.name.toUpperCase().includes("NATIONAL CAPITAL") ||
        value.name.toUpperCase() === "NCR"
      setIsNCRRegion(isNCR)
      if (isNCR) {
        setProvinces([{ code: "NCR", name: "National Capital Region" }])
      } else {
        fetchProvinces(value.code)
      }
    } else if (field === "province" && typeof value !== "string") {
      setValue("province", value, { shouldValidate: true })
      setValue("city", null)
      setValue("barangay", null)
      setCities([])
      setBarangays([])
      const regionVal = getValues("region")
      fetchCities(isNCRRegion && regionVal ? regionVal.code : value.code)
    } else if (field === "city" && typeof value !== "string") {
      setValue("city", value, { shouldValidate: true })
      setValue("barangay", null)
      setBarangays([])
      fetchBarangays(value.code)
    } else if (field === "barangay" && typeof value !== "string") {
      setValue("barangay", value, { shouldValidate: true })
    }
    setSelectedDropdown(null)
  }

  // Validation handled by zodResolver(profileSchema); values arrive validated.
  const onSubmit = async (values: ProfileFormValues) => {
    if (!onSave) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Cannot save profile - no callback provided",
      })
      return
    }

    setLoading(true)
    try {
      await onSave({
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName,
        birthDate: values.birthDate,
        gender: values.gender,
        occupation: values.occupation,
        workLocation: values.workLocation,
        country: values.country,
        streetAddress: values.streetAddress,
        zipCode: values.zipCode,
        phone: values.phone,
        region: values.region?.name || "",
        province: values.province?.name || "",
        city: values.city?.name || "",
        barangay: values.barangay?.name || "",
      })
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message || "Failed to update profile",
      })
    } finally {
      setLoading(false)
    }
  }

  const onInvalid = () => {
    Toast.show({
      type: "error",
      text1: "Missing information",
      text2: "Please complete all required fields.",
    })
  }

  /* ---------- Field renderers ---------- */
  const renderLabel = (label: string, required?: boolean) => (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      {required ? <Text style={styles.required}>*</Text> : null}
    </View>
  )

  const renderTextField = (
    name: TextFieldName,
    label: string,
    opts: {
      required?: boolean
      placeholder?: string
      keyboardType?: KeyboardTypeOptions
    } = {}
  ) => (
    <ControlledFormField
      control={control}
      name={name}
      label={label}
      required={opts.required}
      placeholder={opts.placeholder}
      keyboardType={opts.keyboardType}
      isDarkMode={isDarkMode}
    />
  )

  const renderSelectField = (
    label: string,
    value: string,
    placeholder: string,
    onPress: () => void,
    error?: string,
    required?: boolean
  ) => {
    const hasError = !!error
    return (
      <View style={styles.field}>
        {renderLabel(label, required)}
        <TouchableOpacity
          style={[
            styles.input,
            {
              backgroundColor: c.inputBg,
              borderColor: hasError ? Colors.error : c.border,
            },
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.inputText, { color: value ? c.text : c.textSec }]}
            numberOfLines={1}
          >
            {value || placeholder}
          </Text>
          <Ionicons name="chevron-down" size={18} color={c.textSec} />
        </TouchableOpacity>
        {hasError ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    )
  }

  const isLocationDropdown =
    selectedDropdown !== null && LOCATION_FIELDS.includes(selectedDropdown)
  const isLocationLoading =
    loadingLocations || (selectedDropdown === "region" && loadingRegions)
  const showDropdownLoading =
    isLocationDropdown && isLocationLoading && dropdownOptions.length === 0

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Hero header */}
      <LinearGradient
        colors={[c.heroFrom, c.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 6 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.backButton,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: c.text }]}>
              Edit Profile
            </Text>
            <Text style={[styles.headerSubtitle, { color: c.textSec }]}>
              Keep your information up to date
            </Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Personal Information */}
          <View
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.cardHeader, { borderBottomColor: c.border }]}>
              <View style={styles.cardAccent} />
              <Ionicons name="person-circle" size={16} color={Colors.sky} />
              <Text style={[styles.cardTitle, { color: c.text }]}>
                Personal Information
              </Text>
            </View>
            <View style={styles.cardBody}>
              {renderTextField("firstName", "First Name", {
                required: true,
                placeholder: "First name",
              })}
              {renderTextField("lastName", "Last Name", {
                placeholder: "Last name",
              })}
              {renderTextField("middleName", "Middle Name", {
                placeholder: "Middle name",
              })}
              {renderTextField("phone", "Phone", {
                placeholder: "09xx xxx xxxx",
                keyboardType: "phone-pad",
              })}

              {/* Birth Date */}
              <View style={styles.field}>
                {renderLabel("Birth Date", true)}
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: c.inputBg,
                      borderColor: errors.birthDate ? Colors.error : c.border,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.inputText, { color: c.text }]}>
                    {birthDateValue}
                  </Text>
                  <Ionicons name="calendar" size={18} color={c.textSec} />
                </TouchableOpacity>
                {errors.birthDate ? (
                  <Text style={styles.errorText}>
                    {errors.birthDate.message}
                  </Text>
                ) : null}
              </View>

              {renderSelectField(
                "Gender",
                genderValue,
                "Select gender",
                () => openDropdown("gender", GENDERS, "Gender"),
                errors.gender?.message,
                true
              )}
              {renderTextField("occupation", "Occupation", {
                required: true,
                placeholder: "Occupation",
              })}
              {renderSelectField(
                "Work Location",
                workLocationValue,
                "Select work location",
                () =>
                  openDropdown("workLocation", WORK_LOCATIONS, "Work Location"),
                errors.workLocation?.message,
                true
              )}
              {renderSelectField(
                "Country",
                countryValue,
                "Select country",
                () => openDropdown("country", COUNTRIES, "Country"),
                errors.country?.message,
                true
              )}
            </View>
          </View>

          {/* Address */}
          <View
            style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <View style={[styles.cardHeader, { borderBottomColor: c.border }]}>
              <View style={styles.cardAccent} />
              <Ionicons name="map" size={16} color={Colors.sky} />
              <Text style={[styles.cardTitle, { color: c.text }]}>Address</Text>
            </View>
            <View style={styles.cardBody}>
              {renderTextField("streetAddress", "Street / House No.", {
                required: true,
                placeholder: "Street / House No.",
              })}
              {renderSelectField(
                "Region",
                regionValue?.name || "",
                "Select region",
                () => openDropdown("region", regions, "Region"),
                errors.region?.message as string | undefined,
                true
              )}
              {renderSelectField(
                "Province",
                provinceValue?.name || "",
                "Select province",
                () => openDropdown("province", provinces, "Province"),
                errors.province?.message as string | undefined,
                true
              )}
              {renderSelectField(
                "City / Municipality",
                cityValue?.name || "",
                "Select city / municipality",
                () => openDropdown("city", cities, "City / Municipality"),
                errors.city?.message as string | undefined,
                true
              )}
              {renderSelectField(
                "Barangay",
                barangayValue?.name || "",
                "Select barangay",
                () => openDropdown("barangay", barangays, "Barangay"),
                errors.barangay?.message as string | undefined,
                true
              )}
              {renderTextField("zipCode", "ZIP Code", {
                required: true,
                placeholder: "0000",
                keyboardType: "number-pad",
              })}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View
          style={[
            styles.buttonContainer,
            {
              backgroundColor: c.card,
              borderTopColor: c.border,
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          <Button
            title="SAVE CHANGES"
            onPress={handleSubmit(onSubmit, onInvalid)}
            loading={loading}
            style={styles.saveBtn}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Dropdown Modal */}
      <Modal
        visible={selectedDropdown !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDropdown(null)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedDropdown(null)}
          />
          <Animated.View
            style={[
              styles.dropdownModal,
              {
                backgroundColor: c.card,
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: c.handle }]} />
            </View>
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                {dropdownTitle}
              </Text>
            </View>

            {showDropdownLoading ? (
              <View style={styles.dropdownLoading}>
                <ActivityIndicator size="large" color={Colors.sky} />
                <Text style={[styles.dropdownLoadingText, { color: c.textSec }]}>
                  Loading {dropdownTitle.toLowerCase()}...
                </Text>
              </View>
            ) : dropdownOptions.length === 0 ? (
              <View style={styles.dropdownEmpty}>
                <Ionicons name="list" size={28} color={c.textSec} />
                <Text style={[styles.dropdownLoadingText, { color: c.textSec }]}>
                  No options available
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.modalList}
                showsVerticalScrollIndicator={false}
              >
                {dropdownOptions.map((item, index) => {
                  const isSelected =
                    (selectedDropdown === "gender" &&
                      item.name === genderValue) ||
                    (selectedDropdown === "workLocation" &&
                      item.name === workLocationValue) ||
                    (selectedDropdown === "country" &&
                      item.name === countryValue) ||
                    (selectedDropdown === "region" &&
                      item.name === regionValue?.name) ||
                    (selectedDropdown === "province" &&
                      item.name === provinceValue?.name) ||
                    (selectedDropdown === "city" &&
                      item.name === cityValue?.name) ||
                    (selectedDropdown === "barangay" &&
                      item.name === barangayValue?.name)

                  return (
                    <TouchableOpacity
                      key={`${item.code}-${index}`}
                      style={[
                        styles.modalItem,
                        { borderBottomColor: c.border },
                        index === dropdownOptions.length - 1 &&
                          styles.modalItemLast,
                        isSelected && { backgroundColor: c.selectedBg },
                      ]}
                      onPress={() => selectDropdownOption(item)}
                    >
                      <View style={styles.modalItemContent}>
                        <Text
                          style={[
                            styles.modalItemText,
                            { color: c.text },
                            isSelected && {
                              fontWeight: "700",
                              color: Colors.sky,
                            },
                          ]}
                        >
                          {item.name}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkmark}>
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color={Colors.sky}
                          />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.dropdownModal, { backgroundColor: c.card }]}>
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: c.handle }]} />
            </View>
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>
                {datePickerMode === "year"
                  ? "Select Year"
                  : datePickerMode === "month"
                    ? "Select Month"
                    : "Select Day"}
              </Text>
            </View>

            <View style={styles.datePickerContent}>
              <ScrollView
                style={styles.datePickerList}
                showsVerticalScrollIndicator={false}
              >
                {datePickerMode === "year" &&
                  generateYears().map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerItem,
                        { borderBottomColor: c.border },
                        tempYear === year && { backgroundColor: c.selectedBg },
                      ]}
                      onPress={() => {
                        setTempYear(year)
                        handleDatePickerNext()
                      }}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          { color: c.text },
                          tempYear === year && {
                            fontWeight: "700",
                            color: Colors.sky,
                          },
                        ]}
                      >
                        {year}
                      </Text>
                      {tempYear === year && (
                        <Ionicons name="checkmark" size={20} color={Colors.sky} />
                      )}
                    </TouchableOpacity>
                  ))}

                {datePickerMode === "month" &&
                  MONTHS.map((month, idx) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerItem,
                        { borderBottomColor: c.border },
                        tempMonth === idx && { backgroundColor: c.selectedBg },
                      ]}
                      onPress={() => {
                        setTempMonth(idx)
                        handleDatePickerNext()
                      }}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          { color: c.text },
                          tempMonth === idx && {
                            fontWeight: "700",
                            color: Colors.sky,
                          },
                        ]}
                      >
                        {month}
                      </Text>
                      {tempMonth === idx && (
                        <Ionicons name="checkmark" size={20} color={Colors.sky} />
                      )}
                    </TouchableOpacity>
                  ))}

                {datePickerMode === "day" &&
                  Array.from(
                    { length: getDaysInMonth(tempYear, tempMonth) },
                    (_, i) => i + 1
                  ).map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerItem,
                        { borderBottomColor: c.border },
                        tempDay === day && { backgroundColor: c.selectedBg },
                      ]}
                      onPress={() => setTempDay(day)}
                    >
                      <Text
                        style={[
                          styles.datePickerItemText,
                          { color: c.text },
                          tempDay === day && {
                            fontWeight: "700",
                            color: Colors.sky,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                      {tempDay === day && (
                        <Ionicons name="checkmark" size={20} color={Colors.sky} />
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            </View>

            <View
              style={[styles.datePickerActions, { borderTopColor: c.border }]}
            >
              {datePickerMode !== "year" && (
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={handleDatePickerPrev}
                >
                  <Text style={[styles.datePickerBtnText, { color: Colors.sky }]}>
                    Back
                  </Text>
                </TouchableOpacity>
              )}
              {datePickerMode !== "day" && (
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={handleDatePickerNext}
                >
                  <Text style={[styles.datePickerBtnText, { color: Colors.sky }]}>
                    Next
                  </Text>
                </TouchableOpacity>
              )}
              {datePickerMode === "day" && (
                <TouchableOpacity
                  style={styles.datePickerBtn}
                  onPress={handleDatePickerConfirm}
                >
                  <Text style={[styles.datePickerBtnText, { color: Colors.sky }]}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}
