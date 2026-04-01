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
  const user = useState<User | null>("auth_user", () => null);
  const token = useCookie("auth_token", { maxAge: 60 * 15 }); // 15 minutes
  const refreshToken = useCookie("refresh_token", { maxAge: 60 * 60 * 24 * 7 }); // 7 days
  const api = useApi();

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const fetchUser = async () => {
    console.log("🟡 [AUTH] fetchUser called, token exists:", !!token.value);
    if (!token.value) {
      console.log("🟡 [AUTH] No token, returning null");
      return null;
    }
    try {
      console.log("🟡 [AUTH] Fetching user from /auth/me...");
      user.value = await api.get<User>("/auth/me");
      console.log("🟡 [AUTH] User fetched successfully:", user.value?.email);
      return user.value;
    } catch (error) {
      console.error("🔴 [AUTH] Failed to fetch user:", error);
      // Don't clear token immediately, let the caller decide
      user.value = null;
      return null;
    }
  };

  const refreshAccessToken = async () => {
    if (!refreshToken.value) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshToken.value }),
      });

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();
      token.value = data.accessToken;
      refreshToken.value = data.refreshToken;
      return data.accessToken;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      // Clear tokens and redirect to login
      token.value = null;
      refreshToken.value = null;
      user.value = null;
      navigateTo("/login");
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
    console.log("🟡 [AUTH] setTokens called");
    console.log("🟡 [AUTH] Access token length:", accessToken?.length);
    console.log("🟡 [AUTH] Refresh token length:", refToken?.length);
    token.value = accessToken;
    refreshToken.value = refToken;
    console.log("🟡 [AUTH] Tokens set in cookies");
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
