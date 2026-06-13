import React, { forwardRef, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { getColors, radius } from "../../theme/theme"

type IconName = keyof typeof Ionicons.glyphMap

export interface FormFieldProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: IconName
  /** Renders a show/hide eye toggle and manages `secureTextEntry` internally. */
  isPassword?: boolean
  isDarkMode?: boolean
  containerStyle?: ViewStyle
}

/**
 * Themed, design-system text input for the app's forms (the non-auth counterpart
 * of AuthField). Keeps `focused` state LOCAL so focusing/typing a field never
 * re-renders the parent form, and draws a sky focus border + soft tint on focus.
 * Pair with `ControlledFormField` for react-hook-form binding.
 */
const FormField = forwardRef<TextInput, FormFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      leftIcon,
      isPassword,
      isDarkMode = false,
      containerStyle,
      onFocus,
      onBlur,
      style,
      secureTextEntry,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const [hidden, setHidden] = useState(true)
    const c = getColors(isDarkMode)

    const borderColor = error
      ? c.danger
      : focused
        ? c.primary
        : c.border
    const backgroundColor = error
      ? c.dangerSoft
      : focused
        ? c.primarySoft
        : c.surface

    return (
      <View style={[styles.field, containerStyle]}>
        {label ? (
          <Text style={[styles.label, { color: c.textSecondary }]}>
            {label}
            {required ? <Text style={{ color: c.danger }}> *</Text> : null}
          </Text>
        ) : null}
        <View style={[styles.inputRow, { borderColor, backgroundColor }]}>
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? c.primary : c.textSecondary}
              style={styles.leftIcon}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, { color: c.text }, style]}
            placeholderTextColor={c.textMuted}
            selectionColor={c.primary}
            secureTextEntry={isPassword ? hidden : secureTextEntry}
            onFocus={(e) => {
              setFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              onBlur?.(e)
            }}
            {...rest}
          />
          {isPassword ? (
            <Pressable
              hitSlop={10}
              onPress={() => setHidden((h) => !h)}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel={hidden ? "Show password" : "Hide password"}
            >
              <Ionicons
                name={hidden ? "eye-off" : "eye"}
                size={20}
                color={c.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : hint ? (
          <Text style={[styles.hint, { color: c.textSecondary }]}>{hint}</Text>
        ) : null}
      </View>
    )
  }
)

FormField.displayName = "FormField"

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingLeft: 14,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    includeFontPadding: false,
  },
  leftIcon: { marginRight: 10 },
  iconBtn: { paddingLeft: 10, alignSelf: "center" },
  hint: { fontSize: 11, marginTop: 5, marginLeft: 2 },
  error: { fontSize: 12, marginTop: 5, marginLeft: 2, fontWeight: "500" },
})

export default FormField
