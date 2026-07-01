import AsyncStorage from "@react-native-async-storage/async-storage"

/**
 * Referral code helpers for guest checkout.
 *
 * Mirrors the web app's `libs/referral.ts` contract but uses regex parsing
 * instead of the `URL`/`searchParams` API (which is unreliable in React Native
 * without a polyfill) and AsyncStorage instead of localStorage.
 */

export const REFERRAL_STORAGE_KEY = "apsara_referral_code"

/**
 * Extract a plain referrer username from a raw value. Accepts:
 *  - a plain username ("johndoe")
 *  - a URL with `?ref=` or `?referred_by=` query param
 *  - a `/ref/username` path (or any URL — falls back to the last path segment)
 */
export function normalizeReferralCode(
  value: string | null | undefined
): string {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return ""

  // Plain code — no URL/query/path involved.
  if (
    !trimmed.includes("/") &&
    !trimmed.includes("?") &&
    !trimmed.includes("=")
  ) {
    return trimmed
  }

  // Query param: ?ref=foo or ?referred_by=foo (and &-joined variants)
  const queryMatch = trimmed.match(/[?&](?:ref|referred_by)=([^&#\s]+)/i)
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]).trim()
  }

  // Path form: /ref/username
  const refPathMatch = trimmed.match(/\/ref\/([^/?#\s]+)/i)
  if (refPathMatch?.[1]) {
    return decodeURIComponent(refPathMatch[1]).trim()
  }

  // Fallback: last non-empty path segment (strip query/hash first).
  const withoutQuery = trimmed.split(/[?#]/)[0]
  const segments = withoutQuery.split("/").filter(Boolean)
  if (segments.length > 0) {
    const last = segments[segments.length - 1].trim()
    // Avoid returning a scheme/host like "https:" or "www.afhome.ph"
    if (last && !last.includes(":") && !last.includes(".")) {
      return decodeURIComponent(last)
    }
  }

  return trimmed
}

export async function getStoredReferralCode(): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(REFERRAL_STORAGE_KEY)
    return normalizeReferralCode(raw)
  } catch {
    return ""
  }
}

export async function setStoredReferralCode(code: string): Promise<void> {
  try {
    const normalized = normalizeReferralCode(code)
    if (!normalized) {
      await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY)
      return
    }
    await AsyncStorage.setItem(REFERRAL_STORAGE_KEY, normalized)
  } catch {
    // best-effort persistence
  }
}

export async function clearStoredReferralCode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // ignore
  }
}
