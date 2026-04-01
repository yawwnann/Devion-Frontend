import { mockApi } from "~/utils/mockApi";

const API_URL = "http://localhost:3000/api";

export const useApi = () => {
  const config = useRuntimeConfig();
  const useMock = config.public.useMock === "true";
  const token = useCookie("auth_token");
  const refreshToken = useCookie("refresh_token");

  const getToken = () => {
    const token = useCookie("auth_token");
    return token.value;
  };

  const updateTokens = (
    newAccessToken?: string | null,
    newRefreshToken?: string | null,
  ) => {
    if (newAccessToken) {
      token.value = newAccessToken;
    }
    if (newRefreshToken) {
      refreshToken.value = newRefreshToken;
    }
  };

  const fetchApi = async <T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false,
  ): Promise<T> => {
    // Mock mode
    if (useMock) {
      console.log("🎭 Mock API:");

      // Parse endpoint and method
      const method = options.method || "GET";
      const parts = endpoint.split("/").filter(Boolean);

      // Auth endpoints

      if (parts[0] === "auth") {
        if (parts[1] === "login" && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.login(body.email, body.password) as Promise<T>;
        }
        if (parts[1] === "register" && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.register(
            body.name,
            body.email,
            body.password,
          ) as Promise<T>;
        }
        if (parts[1] === "me") {
          return mockApi.getMe() as Promise<T>;
        }
        if (parts[1] === "statistics" && method === "GET") {
          return mockApi.getStatistics() as Promise<T>;
        }
      }

      // Pages endpoints
      if (parts[0] === "pages") {
        if (!parts[1] && method === "GET")
          return mockApi.getPages() as Promise<T>;
        if (parts[1] && method === "GET")
          return mockApi.getPage(parts[1]) as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.createPage(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse(options.body as string);
          return mockApi.updatePage(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deletePage(parts[1]) as Promise<T>;
        }
      }

      // Documentation endpoints (alias for pages)
      if (parts[0] === "documentation") {
        if (parts[1] === "published" && method === "GET") {
          return mockApi.getPublishedPages() as Promise<T>;
        }
      }

      // Blocks endpoints
      if (parts[0] === "blocks") {
        if (parts[1] === "page" && parts[2] && method === "GET") {
          return mockApi.getBlocks(parts[2]) as Promise<T>;
        }
        if (!parts[1] && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.createBlock(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse(options.body as string);
          return mockApi.updateBlock(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deleteBlock(parts[1]) as Promise<T>;
        }
      }

      // GitHub endpoints
      if (parts[0] === "github") {
        if (parts[1] === "repos" && method === "GET") {
          return mockApi.getGitHubRepos() as Promise<T>;
        }
        if (parts[1] === "sync" && method === "POST") {
          return mockApi.syncGitHubRepos() as Promise<T>;
        }
        if (parts[1] === "username" && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.setGitHubUsername(body.username) as Promise<T>;
        }
      }

      // Analytics endpoints
      if (parts[0] === "analytics") {
        if (parts[1] === "stats" && method === "GET") {
          return mockApi.getStats() as Promise<T>;
        }
        const pageId = new URL(`http://dummy${endpoint}`).searchParams.get(
          "pageId",
        );
        if (method === "GET") {
          return mockApi.getAnalytics(pageId!) as Promise<T>;
        }
        if (method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.trackEvent(
            pageId!,
            body.event,
            body.metadata,
          ) as Promise<T>;
        }
      }

      // Projects endpoints
      if (parts[0] === "projects") {
        if (!parts[1] && method === "GET")
          return mockApi.getProjects() as Promise<T>;
        if (parts[1] === "stats" && method === "GET")
          return mockApi.getProjectStats() as Promise<T>;
        if (parts[1] && method === "GET")
          return mockApi.getProject(parts[1]) as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse(options.body as string);
          return mockApi.createProject(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse(options.body as string);
          return mockApi.updateProject(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deleteProject(parts[1]) as Promise<T>;
        }
      }

      throw new Error(`Mock endpoint not implemented: ${method} ${endpoint}`);
    }

    // Real API mode
    const tokenValue = getToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
      ...options.headers,
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401 && !isRetry) {
        // Try to refresh token
        try {
          if (!refreshToken.value) throw new Error("No refresh token");

          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: refreshToken.value }),
          });

          if (!refreshRes.ok) throw new Error("Refresh failed");

          const refreshData = await refreshRes.json();
          updateTokens(refreshData.accessToken, refreshData.refreshToken);

          // Retry the request with new token explicitly set in headers
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${refreshData.accessToken}`,
            },
          };
          return fetchApi<T>(endpoint, retryOptions, true);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          token.value = null;
          refreshToken.value = null;
          navigateTo("/login");
          throw new Error("Authentication failed");
        }
      }
      let errorMessage = `API Error: ${res.status}`;
      try {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message;
        }
      } catch (e) {
        // Ignore json parse error
      }
      throw new Error(errorMessage);
    }

    // Extract tokens from response headers (auto-refresh from backend)
    const newAccessToken = res.headers.get("X-Access-Token");
    const newRefreshToken = res.headers.get("X-Refresh-Token");

    if (newAccessToken || newRefreshToken) {
      updateTokens(newAccessToken, newRefreshToken);
    }

    const data = await res.json();

    // Also extract tokens from response body if present (_tokens property)
    if (data?._tokens) {
      updateTokens(data._tokens.accessToken, data._tokens.refreshToken);
      // Remove _tokens from response to avoid leaking to UI
      delete data._tokens;
    }

    return data;
  };

  return {
    baseURL: API_URL,
    get: <T>(endpoint: string) => fetchApi<T>(endpoint),
    post: <T>(endpoint: string, body?: unknown) =>
      fetchApi<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
    patch: <T>(endpoint: string, body?: unknown) =>
      fetchApi<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) =>
      fetchApi<T>(endpoint, { method: "DELETE" }),
    upload: async <T>(
      endpoint: string,
      formData: FormData,
      isRetry = false,
    ): Promise<T> => {
      const tokenValue = getToken();
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          ...(tokenValue ? { Authorization: `Bearer ${tokenValue}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 401 && !isRetry) {
          try {
            if (!refreshToken.value) throw new Error("No refresh token");

            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken: refreshToken.value }),
            });

            if (!refreshRes.ok) throw new Error("Refresh failed");

            const refreshData = await refreshRes.json();
            updateTokens(refreshData.accessToken, refreshData.refreshToken);

            // Retry with new token explicitly
            const newHeaders = new Headers();
            if (formData) {
              newHeaders.append(
                "Authorization",
                `Bearer ${refreshData.accessToken}`,
              );
            }

            const retryRes = await fetch(`${API_URL}${endpoint}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${refreshData.accessToken}`,
              },
              body: formData,
            });

            if (!retryRes.ok) {
              throw new Error(`API Error on retry: ${retryRes.status}`);
            }

            const newAccessToken = retryRes.headers.get("X-Access-Token");
            const newRefreshToken = retryRes.headers.get("X-Refresh-Token");
            if (newAccessToken || newRefreshToken) {
              updateTokens(newAccessToken, newRefreshToken);
            }
            return retryRes.json();
          } catch (refreshError) {
            token.value = null;
            refreshToken.value = null;
            navigateTo("/login");
            throw new Error("Authentication failed");
          }
        }
        let errorMessage = `API Error: ${res.status}`;
        try {
          const errorData = await res.json();
          if (errorData.message) {
            errorMessage = Array.isArray(errorData.message)
              ? errorData.message.join(", ")
              : errorData.message;
          }
        } catch (e) {
          // Ignore JSON parse error
        }
        throw new Error(errorMessage);
      }

      // Extract tokens from response headers
      const newAccessToken = res.headers.get("X-Access-Token");
      const newRefreshToken = res.headers.get("X-Refresh-Token");

      if (newAccessToken || newRefreshToken) {
        updateTokens(newAccessToken, newRefreshToken);
      }

      return res.json();
    },
  };
};
