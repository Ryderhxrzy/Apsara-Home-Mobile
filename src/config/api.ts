export const API_CONFIG = {
  // Uses EXPO_PUBLIC_API_URL from .env when set (e.g. your PC's LAN IP for
  // local-backend testing on a phone). Falls back to production when unset.
  // ⚠️ Don't ship a LAN IP to production — leave it unset for release builds.
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL || "https://backend.afhome.ph/api",
}

export const MEILI_CONFIG = {
  HOST: "https://search.afhome.ph",
  SEARCH_KEY:
    "2851d047f5c7f6e736d301bdd672ae6fc47adf29537c603fa883f305ecb4d16f",
}
