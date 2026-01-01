export default defineNuxtRouteMiddleware(async (to) => {
  const { token, user, fetchUser } = useAuth();

  // Public routes (landing page and auth pages)
  const publicRoutes = ["/", "/login", "/register", "/auth/callback"];
  if (publicRoutes.includes(to.path)) {
    return;
  }

  // Check if authenticated
  if (!token.value) {
    return navigateTo("/login");
  }

  // Fetch user if not loaded
  if (!user.value) {
    const userData = await fetchUser();
    if (!userData) {
      return navigateTo("/login");
    }
  }
});
