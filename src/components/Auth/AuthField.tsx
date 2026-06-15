import React, { forwardRef, memo, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native"
import Ionicons from "../ui/Icon"
import { Colors } from "../../constants/colors"

type IconName = string
type Variant = "dark" | "light"

export interface AuthFieldProps extends TextInputProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: IconName
  rightIcon?: IconName
  onRightIconPress?: () => void
  rightIconActive?: boolean
  variant?: Variant
  containerStyle?: ViewStyle
}

/**
 * Design-system auth input. Keeps its `focused` state LOCAL so focusing/typing
 * a field never re-renders the parent. Pair with `defaultValue` (uncontrolled)
 * or RHF's Controller via ControlledAuthField.
 *
 * `variant="dark"` for the video-background screens (Login / SignupScreen),
 * `variant="light"` for the light Register / OTP screens.
 */
const AuthField = forwardRef<TextInput, AuthFieldProps>(
  (
    {
      label,
      error,
      hint,
      required,
      leftIcon,
      rightIcon,
      onRightIconPress,
      rightIconActive,
      variant = "dark",
      containerStyle,
      onFocus,
      onBlur,
      style,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const t = variant === "light" ? light : dark

    return (
      <View style={[styles.field, containerStyle]}>
        <Text style={[styles.label, t.label]}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View
          style={[
            styles.inputRow,
            t.inputRow,
            focused && t.inputRowFocused,
            error ? styles.inputRowError : null,
          ]}
        >
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={18}
              color={focused ? Colors.sky : t.icon}
              style={styles.leftIcon}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, t.input, style]}
            placeholderTextColor={t.placeholder}
            selectionColor={Colors.sky}
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
          {rightIcon ? (
            <Pressable
              hitSlop={10}
              onPress={onRightIconPress}
              style={styles.iconBtn}
              accessibilityRole="button"
            >
              <Ionicons
                name={rightIcon}
                size={20}
                color={rightIconActive ? Colors.sky : t.icon}
              />
            </Pressable>
          ) : null}
        </View>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={[styles.hint, t.hint]}>{hint}</Text>
        ) : null}
      </View>
    )
  }
)

AuthField.displayName = "AuthField"

const styles = StyleSheet.create({
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  required: { color: Colors.error, fontWeight: "700" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 12,
  },
  inputRowError: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
    includeFontPadding: false,
  },
  leftIcon: { marginRight: 10 },
  iconBtn: { paddingLeft: 10, alignSelf: "center" },
  hint: { fontSize: 11, marginTop: 5, marginLeft: 2 },
  error: { fontSize: 12, color: Colors.error, marginTop: 5, marginLeft: 2 },
})

// Plain objects (not StyleSheet.create) because these bundle color tokens
// (placeholder/icon strings) alongside style objects.
const dark = {
  label: { color: "rgba(255,255,255,0.9)" } as const,
  inputRow: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.2)",
  } as const,
  inputRowFocused: {
    borderColor: Colors.sky,
    backgroundColor: "rgba(14,165,233,0.12)",
  } as const,
  input: { color: Colors.white } as const,
  placeholder: "rgba(255,255,255,0.4)",
  icon: "rgba(255,255,255,0.6)",
  hint: { color: "rgba(255,255,255,0.55)" } as const,
}

const light = {
  label: { color: Colors.text } as const,
  inputRow: { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" } as const,
  inputRowFocused: {
    borderColor: Colors.sky,
    backgroundColor: "rgba(14,165,233,0.06)",
  } as const,
  input: { color: Colors.text } as const,
  placeholder: "#9ca3af",
  icon: "#94a3b8",
  hint: { color: Colors.textSecondary } as const,
}

export default memo(AuthField)
