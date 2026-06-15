import { z } from "zod"
import { LocationData } from "../services/addressService"

/* ------------------------------ Profile ------------------------------ */

const locationSchema = z.object({
  code: z.string(),
  name: z.string(),
  zipCode: z.string().optional(),
})

// A location dropdown that must be selected (non-null) to pass validation.
const requiredLocation = (label: string) =>
  locationSchema
    .nullable()
    .refine((v) => v != null, { message: `${label} is required.` })

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim(),
  middleName: z.string().trim(),
  phone: z.string().trim(),
  birthDate: z.string().min(1, "Birth date is required."),
  gender: z.string().min(1, "Gender is required."),
  occupation: z.string().trim().min(1, "Occupation is required."),
  workLocation: z.string().min(1, "Work location is required."),
  country: z.string().min(1, "Country is required."),
  streetAddress: z.string().trim().min(1, "Street / House No. is required."),
  zipCode: z.string().trim().min(1, "ZIP code is required."),
  region: requiredLocation("Region"),
  province: requiredLocation("Province"),
  city: requiredLocation("City / Municipality"),
  barangay: requiredLocation("Barangay"),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

// Pre-fills the form from the current user. Stored region/province/city/barangay
// are plain names on the user record, so we seed { code: name, name } and let the
// cascade overwrite them with real { code, name } pairs once the user re-picks.
export const buildProfileDefaults = (user: any): ProfileFormValues => {
  const initLocation = (value: any): LocationData | null =>
    value && value !== "Not specified" ? { code: value, name: value } : null

  return {
    firstName: user?.first_name || user?.name || "",
    lastName: user?.last_name || "",
    middleName: user?.middle_name || "",
    birthDate: user?.birth_date || "2000-01-01",
    gender: user?.gender
      ? user.gender.charAt(0).toUpperCase() +
        user.gender.slice(1).toLowerCase()
      : "Male",
    occupation: user?.occupation || "",
    workLocation: user?.work_location === "overseas" ? "Overseas" : "Local",
    country: user?.country || "Philippines",
    streetAddress: user?.address || "",
    zipCode: user?.zip_code || "",
    phone: user?.phone || "",
    region: initLocation(user?.region),
    province: initLocation(user?.province),
    city: initLocation(user?.city),
    barangay: initLocation(user?.barangay),
  }
}
