interface User {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  hasPassword: boolean;
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
    if (!token.value) return null;
    try {
      user.value = await api.get<User>("/auth/me");
      return user.value;
    } catch (error) {
      console.error("Failed to fetch user:", error);
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
    token.value = accessToken;
    refreshToken.value = refToken;
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
