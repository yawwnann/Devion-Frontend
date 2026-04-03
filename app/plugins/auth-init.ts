/**
 * Auth Initialization Plugin
 *
 * This plugin runs on app initialization to restore authentication state
 * from cookies. It does NOT block app hydration - user fetching is handled
 * by the middleware on route navigation.
 */
export default defineNuxtPlugin(() => {
  const { token, refreshToken, user } = useAuth();

  // Only run on client side
  if (import.meta.client) {
    console.log("[AUTH INIT] Plugin started (non-blocking)");
    console.log("[AUTH INIT] Token exists:", !!token.value);
    console.log("[AUTH INIT] Refresh token exists:", !!refreshToken.value);
    console.log("[AUTH INIT] User state:", user.value?.email || "not loaded");

    // We do NOT call fetchUser() here anymore.
    // The middleware will handle user fetching on route navigation.
    // This prevents blocking the app hydration process.
  }
});
