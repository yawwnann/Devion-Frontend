export default defineNuxtRouteMiddleware(async (to) => {
  const { token, refreshToken, user, fetchUser, refreshAccessToken } =
    useAuth();

  // Public routes (landing page, auth pages, and articles)
  const publicRoutes = ["/", "/login", "/register", "/auth/callback"];
  const isArticlesRoute = to.path.startsWith("/articles");

  if (publicRoutes.includes(to.path) || isArticlesRoute) {
    return;
  }

  // Check if authenticated
  if (!token.value) {
    if (refreshToken.value) {
      try {
        await refreshAccessToken();
      } catch (e) {
        return navigateTo("/login");
      }
    } else {
      return navigateTo("/login");
    }
  }

  // Fetch user if not loaded
  if (!user.value) {
    const userData = await fetchUser();
    if (!userData) {
      return navigateTo("/login");
    }
  }
});
