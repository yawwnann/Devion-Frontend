interface User {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  hasPassword: boolean;
  hasGoogleLinked: boolean;
  githubUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useAuth = () => {
  // Use cookies with proper persistence - single source of truth
  const token = useCookie<string | null>("auth_token", {
    expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
  });

  const refreshToken = useCookie<string | null>("refresh_token", {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    sameSite: "lax",
    secure: import.meta.env.PROD,
    path: "/",
  });

  const user = useState<User | null>("auth_user", () => null);
  const api = useApi();

  // Deduplication state - prevent multiple simultaneous fetchUser calls
  // NOTE: We use a simple boolean flag, NOT a Promise, because useState 
  // cannot serialize Promises for SSR payload (devalue error)
  const fetchingUser = useState<boolean>("auth_fetching_user", () => false);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const fetchUser = async (): Promise<User | null> => {
    console.log("[AUTH] fetchUser called, token exists:", !!token.value);
    
    if (!token.value) {
      console.log("[AUTH] No token, returning null");
      return null;
    }

    // If already fetching, wait and return current user state (deduplication)
    if (fetchingUser.value) {
      console.log("[AUTH] Fetch already in progress, waiting...");
      // Simple deduplication: just return current user state
      // The ongoing fetch will update user.value when complete
      return user.value;
    }

    // Mark as fetching
    fetchingUser.value = true;

    try {
      console.log("[AUTH] Fetching user from /auth/me...");
      const userData = await api.get<User>("/auth/me");
      user.value = userData;
      console.log("[AUTH] User fetched successfully:", user.value?.email);
      return user.value;
    } catch (error) {
      console.error("[AUTH] Failed to fetch user:", error);
      // Check if it's a network error vs auth error
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (
          errorMessage.includes("fetch failed") ||
          errorMessage.includes("network") ||
          errorMessage.includes("econnrefused")
        ) {
          console.log("[AUTH] Network error, keeping existing user state");
          // Don't clear user on network errors - keep existing state
          return user.value;
        }
      }
      // Only clear user on actual auth failures (401, 403, etc)
      user.value = null;
      return null;
    } finally {
      // Reset fetching state
      fetchingUser.value = false;
    }
  };

  const refreshAccessToken = async (): Promise<string> => {
    if (!refreshToken.value) {
      throw new Error("No refresh token available");
    }

    try {
      const config = useRuntimeConfig();
      const apiUrl = config.public.apiUrl || "http://localhost:3000/api";

      const response = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format from server");
      }

      const data = await response.json();

      // Update tokens with proper expiration
      token.value = data.accessToken;
      refreshToken.value = data.refreshToken;

      console.log("[AUTH] Token refreshed successfully");
      return data.accessToken;
    } catch (error) {
      console.error("[AUTH] Failed to refresh token:", error);
      // Clear tokens but don't redirect here - let middleware handle it
      token.value = null;
      refreshToken.value = null;
      user.value = null;
      throw error;
    }
  };

  const logout = () => {
    token.value = null;
    refreshToken.value = null;
    user.value = null;
    navigateTo("/login");
  };

  const setTokens = (accessToken: string, refToken: string) => {
    console.log("[AUTH] setTokens called");
    console.log("[AUTH] Access token length:", accessToken?.length);
    console.log("[AUTH] Refresh token length:", refToken?.length);

    // Set tokens with proper expiration
    token.value = accessToken;
    refreshToken.value = refToken;

    console.log("[AUTH] Tokens set in cookies");
  };

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    fetchUser,
    refreshAccessToken,
    logout,
    setTokens,
  };
};
