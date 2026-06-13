import { z } from "zod"

/* ------------------------------ Address ------------------------------ */

// Only the free-text fields live in the form; region/province/city/barangay are
// dependent dropdowns kept in component state and validated on submit.
export const addressSchema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name."),
  contactNumber: z
    .string()
    .trim()
    .refine(
      (v) => v.replace(/\D/g, "").length >= 10,
      "Enter a valid contact number."
    ),
})

export type AddressValues = z.infer<typeof addressSchema>

export const ADDRESS_DEFAULTS: AddressValues = {
  fullName: "",
  contactNumber: "",
}
