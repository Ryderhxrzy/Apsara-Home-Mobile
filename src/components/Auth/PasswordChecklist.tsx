import React from "react"
import { View, Text, StyleSheet } from "react-native"
import Ionicons from "../ui/Icon"
import { useWatch, Control, FieldValues, Path } from "react-hook-form"
import { PASSWORD_RULES } from "../../schemas/authSchemas"

interface PasswordChecklistProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  /** When provided, adds a "passwords match" row comparing this field. */
  confirmName?: Path<T>
  rules?: { label: string; test: (v: string) => boolean }[]
  matchLabel?: string
  variant?: "dark" | "light"
}

const PASS = "#10b981"

/**
 * Live password rule checklist. Isolated with `useWatch` so it re-renders on
 * password keystrokes WITHOUT re-rendering the parent form.
 */
export default function PasswordChecklist<T extends FieldValues>({
  control,
  name,
  confirmName,
  rules = PASSWORD_RULES,
  matchLabel = "Passwords match",
  variant = "dark",
}: PasswordChecklistProps<T>) {
  const value = (useWatch({ control, name }) as string) || ""
  // Always call useWatch (stable hook order); falls back to `name` when no confirm.
  const confirmValue =
    (useWatch({ control, name: confirmName ?? name }) as string) || ""

  const pending = variant === "light" ? "#94a3b8" : "rgba(255,255,255,0.6)"
  const items = rules.map((r) => ({ label: r.label, ok: r.test(value) }))
  if (confirmName) {
    items.push({
      label: matchLabel,
      ok: value.length > 0 && value === confirmValue,
    })
  }

  return (
    <View
      style={[styles.box, variant === "light" ? styles.boxLight : styles.boxDark]}
    >
      {items.map((item) => (
        <View key={item.label} style={styles.row}>
          <Ionicons
            name={item.ok ? "checkmark-circle" : "ellipse-outline"}
            size={15}
            color={item.ok ? PASS : pending}
          />
          <Text style={[styles.text, { color: item.ok ? PASS : pending }]}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    marginTop: 2,
    marginBottom: 14,
  },
  boxDark: { backgroundColor: "rgba(255,255,255,0.06)" },
  boxLight: { backgroundColor: "#f1f5f9" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  text: { fontSize: 12, fontWeight: "500" },
})
