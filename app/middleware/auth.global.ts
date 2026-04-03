/**
 * Global Auth Middleware
 *
 * Handles authentication checks for protected routes.
 * Supports both SSR and client-side navigation with request deduplication.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const { token, refreshToken, user, fetchUser, refreshAccessToken } = useAuth();

  // Public routes (landing page, articles)
  const publicRoutes = ["/", "/articles"];
  const isArticlesRoute = to.path.startsWith("/articles");

  // Auth routes that should be inaccessible when logged in
  const authRoutes = ["/login", "/register"];

  // Handle auth callback separately
  if (to.path === "/auth/callback") {
    return;
  }

  // Allow public routes without auth check
  if (publicRoutes.includes(to.path) || isArticlesRoute) {
    return;
  }

  // Check if trying to access auth pages while already authenticated
  if (authRoutes.includes(to.path)) {
    // If we have token and user, redirect to dashboard
    if (token.value && user.value) {
      return navigateTo("/dashboard", { replace: true });
    }

    // If we have token but no user, try to fetch (non-blocking for auth pages)
    if (token.value && !user.value) {
      fetchUser().catch(() => {
        // Silently fail - allow access to auth page
      });
    }

    return;
  }

  // For protected routes, check authentication
  console.log("[AUTH MIDDLEWARE] Protected route:", to.path);

  // If no token at all, redirect to login
  if (!token.value) {
    console.log("[AUTH MIDDLEWARE] No token, redirecting to login");
    return navigateTo("/login");
  }

  // If we have token and user already loaded, allow access immediately
  if (user.value) {
    console.log("[AUTH MIDDLEWARE] User already authenticated, allowing access");
    return;
  }

  // If we have token but no user, try to fetch user (with deduplication)
  console.log("[AUTH MIDDLEWARE] Token exists but no user, fetching user...");
  try {
    const userData = await fetchUser();
    if (userData) {
      console.log("[AUTH MIDDLEWARE] User fetched successfully, allowing access");
      return;
    }

    // If fetchUser failed but we have a refresh token, try refreshing
    if (refreshToken.value) {
      console.log("[AUTH MIDDLEWARE] Fetch failed, trying token refresh...");
      try {
        await refreshAccessToken();
        // After refresh, try fetching user again
        const refreshedUser = await fetchUser();
        if (refreshedUser) {
          console.log("[AUTH MIDDLEWARE] User fetched after refresh, allowing access");
          return;
        }
      } catch (refreshError) {
        console.error("[AUTH MIDDLEWARE] Token refresh failed:", refreshError);
        // If backend not responding, allow access with existing token
        if (
          refreshError instanceof Error &&
          (refreshError.message.includes("Invalid response") ||
           refreshError.message.includes("fetch failed") ||
           refreshError.message.includes("network"))
        ) {
          console.log("[AUTH MIDDLEWARE] Backend not responding, allowing access with existing token");
          return;
        }
      }
    }

    // If no refresh token and fetchUser failed, redirect to login
    console.log("[AUTH MIDDLEWARE] No refresh token and fetch failed, redirecting to login");
    return navigateTo("/login");
  } catch (error) {
    console.error("[AUTH MIDDLEWARE] Error in auth flow:", error);
    // On any error, if we have a token, allow access
    if (token.value) {
      console.log("[AUTH MIDDLEWARE] Error occurred but token exists, allowing access");
      return;
    }
    // Only redirect if no token at all
    return navigateTo("/login");
  }
});
