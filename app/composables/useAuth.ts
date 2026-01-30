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
  const token = useCookie("auth_token", { maxAge: 60 * 60 * 24 * 7 }); // 7 days
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

  const logout = () => {
    token.value = null;
    user.value = null;
    navigateTo("/login");
  };

  const setToken = (newToken: string) => {
    token.value = newToken;
  };

  return {
    user,
    token,
    isAuthenticated,
    fetchUser,
    logout,
    setToken,
  };
};
