import React from "react"
import { useController, Control, FieldValues, Path } from "react-hook-form"
import FormField, { FormFieldProps } from "./FormField"

type ControlledFormFieldProps<T extends FieldValues> = Omit<
  FormFieldProps,
  "error" | "defaultValue" | "value" | "onChangeText" | "onBlur"
> & {
  control: Control<T>
  name: Path<T>
}

/**
 * react-hook-form binding for FormField. Uses `useController` so only THIS field
 * re-renders on its own keystrokes — the parent form does not. Mirrors the auth
 * flow's ControlledAuthField, for the rest of the app's forms.
 */
export default function ControlledFormField<T extends FieldValues>({
  control,
  name,
  onFocus,
  ...rest
}: ControlledFormFieldProps<T>) {
  const { field, fieldState } = useController({ control, name })

  return (
    <FormField
      {...rest}
      value={field.value ?? ""}
      onChangeText={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      onFocus={onFocus}
    />
  )
}
