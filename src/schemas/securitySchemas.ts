import { z } from "zod"

/* -------------------------- Change password -------------------------- */

// Matches the backend's password policy (8+ chars, upper, lower, number,
// special). Each message doubles as inline field feedback.
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "New password and confirmation do not match.",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "New password must be different from the current one.",
    path: ["newPassword"],
  })

export type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export const CHANGE_PASSWORD_DEFAULTS: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}
