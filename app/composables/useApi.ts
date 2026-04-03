import { ofetch, type FetchOptions } from "ofetch";
import { mockApi } from "~/utils/mockApi";

const API_URL = "http://localhost:3000/api";

// Shared token state - single source of truth
let token: ReturnType<typeof useCookie<string | null>>;
let refreshToken: ReturnType<typeof useCookie<string | null>>;

const getTokenCookies = () => {
  if (!token) {
    token = useCookie<string | null>("auth_token", {
      expires: new Date(Date.now() + 15 * 60 * 1000),
      sameSite: "lax",
      secure: import.meta.env.PROD,
      path: "/",
    });
  }
  if (!refreshToken) {
    refreshToken = useCookie<string | null>("refresh_token", {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      sameSite: "lax",
      secure: import.meta.env.PROD,
      path: "/",
    });
  }
  return { token, refreshToken };
};

const updateTokens = (
  newAccessToken?: string | null,
  newRefreshToken?: string | null,
) => {
  const { token: t, refreshToken: rt } = getTokenCookies();
  if (newAccessToken) {
    t.value = newAccessToken;
  }
  if (newRefreshToken) {
    rt.value = newRefreshToken;
  }
};

// Create the API client using $fetch.create()
const createApiClient = () => {
  const config = useRuntimeConfig();
  const useMock = config.public.useMock === "true";
  const { token: tokenCookie, refreshToken: refreshCookie } = getTokenCookies();

  // Mock API client
  if (useMock) {
    const mockFetch = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
      console.log("[API Mock] Calling:", endpoint);

      const method = (options.method || "GET").toUpperCase();
      const parts = endpoint.split("/").filter(Boolean);

      // Auth endpoints
      if (parts[0] === "auth") {
        if (parts[1] === "login" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.login(body.email, body.password) as Promise<T>;
        }
        if (parts[1] === "register" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.register(body.name, body.email, body.password) as Promise<T>;
        }
        if (parts[1] === "me") {
          return mockApi.getMe() as Promise<T>;
        }
        if (parts[1] === "refresh" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.refresh(body.refreshToken) as Promise<T>;
        }
        if (parts[1] === "statistics" && method === "GET") {
          return mockApi.getStatistics() as Promise<T>;
        }
      }

      // Pages endpoints
      if (parts[0] === "pages") {
        if (!parts[1] && method === "GET") return mockApi.getPages() as Promise<T>;
        if (parts[1] && method === "GET") return mockApi.getPage(parts[1]) as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createPage(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
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
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createBlock(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
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
        if (parts[1] === "sync-issues" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.syncGitHubIssues(body.projectId, body.githubRepo) as Promise<T>;
        }
        if (parts[1] === "username" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.setGitHubUsername(body.username) as Promise<T>;
        }
        if (parts[1] === "link-repo" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.linkGitHubRepo(body.projectId, body.githubRepo) as Promise<T>;
        }
      }

      // Analytics endpoints
      if (parts[0] === "analytics") {
        if (parts[1] === "stats" && method === "GET") {
          return mockApi.getStats() as Promise<T>;
        }
        const pageId = new URL(`http://dummy${endpoint}`).searchParams.get("pageId");
        if (method === "GET") {
          return mockApi.getAnalytics(pageId!) as Promise<T>;
        }
        if (method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.trackEvent(pageId!, body.event, body.metadata) as Promise<T>;
        }
      }

      // Projects endpoints
      if (parts[0] === "projects") {
        if (!parts[1] && method === "GET") return mockApi.getProjects() as Promise<T>;
        if (parts[1] === "stats" && method === "GET") return mockApi.getProjectStats() as Promise<T>;
        if (parts[1] === "settings" && method === "GET") return mockApi.getProjectSettings() as Promise<T>;
        if (parts[1] === "settings" && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updateProjectSettings(body) as Promise<T>;
        }
        if (parts[1] === "settings" && method === "DELETE") {
          return mockApi.deleteProjectCover() as Promise<T>;
        }
        if (parts[1] === "settings" && parts[2] === "cover" && method === "POST") {
          return mockApi.uploadProjectCover() as Promise<T>;
        }
        if (parts[1] && method === "GET") return mockApi.getProject(parts[1]) as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createProject(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updateProject(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deleteProject(parts[1]) as Promise<T>;
        }
      }

      // Project categories endpoints
      if (parts[0] === "project-categories") {
        if (!parts[1] && method === "GET") return mockApi.getProjectCategories() as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createProjectCategory(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updateProjectCategory(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deleteProjectCategory(parts[1]) as Promise<T>;
        }
      }

      // Payment methods endpoints
      if (parts[0] === "payment-methods") {
        if (!parts[1] && method === "GET") return mockApi.getPaymentMethods() as Promise<T>;
        if (!parts[1] && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createPaymentMethod(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updatePaymentMethod(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deletePaymentMethod(parts[1]) as Promise<T>;
        }
      }

      // Todos endpoints
      if (parts[0] === "todos") {
        if (parts[1] === "current-week" && method === "GET") {
          return mockApi.getCurrentWeek() as Promise<T>;
        }
        if (parts[1] === "new-week" && method === "POST") {
          return mockApi.createNewWeek() as Promise<T>;
        }
        if (parts[1] === "settings" && method === "GET") {
          return mockApi.getTodoSettings() as Promise<T>;
        }
        if (parts[1] === "settings" && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updateTodoSettings(body) as Promise<T>;
        }
        if (parts[1] === "reorder" && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.reorderTodos(body.todoIds) as Promise<T>;
        }
        if (!parts[1] && method === "POST") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.createTodo(body) as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updateTodo(parts[1], body) as Promise<T>;
        }
        if (parts[1] && method === "DELETE") {
          return mockApi.deleteTodo(parts[1]) as Promise<T>;
        }
      }

      // Preferences endpoints
      if (parts[0] === "preferences") {
        if (!parts[1] && method === "GET") {
          return mockApi.getPreferences() as Promise<T>;
        }
        if (!parts[1] && method === "PATCH") {
          const body = JSON.parse((options.body as string) || "{}");
          return mockApi.updatePreferences(body) as Promise<T>;
        }
      }

      // Notifications endpoints
      if (parts[0] === "notifications") {
        if (!parts[1] && method === "GET") {
          return mockApi.getNotifications() as Promise<T>;
        }
        if (parts[1] === "unread-count" && method === "GET") {
          return mockApi.getUnreadCount() as Promise<T>;
        }
        if (parts[1] === "mark-all-read" && method === "POST") {
          return mockApi.markAllRead() as Promise<T>;
        }
        if (parts[1] && method === "PATCH") {
          return mockApi.markNotificationRead(parts[1]) as Promise<T>;
        }
      }

      // Articles endpoints (alias for documentation/published)
      if (parts[0] === "articles" && method === "GET") {
        return mockApi.getPublishedPages() as Promise<T>;
      }

      throw new Error(`[API Mock] Endpoint not implemented: ${method} ${endpoint}`);
    };

    return {
      baseURL: API_URL,
      get: <T>(endpoint: string) => mockFetch<T>(endpoint),
      post: <T>(endpoint: string, body?: unknown) =>
        mockFetch<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),
      patch: <T>(endpoint: string, body?: unknown) =>
        mockFetch<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),
      delete: <T>(endpoint: string) =>
        mockFetch<T>(endpoint, { method: "DELETE" }),
      upload: async <T>(endpoint: string, _formData: FormData): Promise<T> => {
        // For mock mode, simulate upload
        return mockApi.uploadProjectCover() as Promise<T>;
      },
    };
  }

  // Real API client using $fetch.create()
  const apiClient = ofetch.create({
    baseURL: API_URL,
    
    // Hook: Inject Authorization header before each request
    onRequest({ options }) {
      const tokenValue = tokenCookie.value;
      if (tokenValue) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${tokenValue}`,
        };
      }
    },

    // Hook: Handle token refresh on 401 responses
    async onResponseError({ response, options, request }) {
      if (response.status === 401) {
        try {
          if (!refreshCookie.value) {
            throw new Error("No refresh token");
          }

          console.log("[API] 401 detected, attempting token refresh...");

          // Refresh the token
          const refreshResponse = await ofetch(`${API_URL}/auth/refresh`, {
            method: "POST",
            body: { refreshToken: refreshCookie.value },
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse as Record<string, string>;
          updateTokens(accessToken, newRefreshToken);

          console.log("[API] Token refreshed, retrying request...");

          // Get the request URL
          const requestUrl = typeof request === "string" 
            ? request 
            : request instanceof URL 
              ? request.toString() 
              : (request as Request)?.url || "";

          // Retry the original request with new token
          return ofetch(requestUrl, {
            method: options.method,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
            },
            body: options.body,
          });
        } catch (refreshError) {
          console.error("[API] Token refresh failed:", refreshError);
          // Clear tokens on refresh failure
          tokenCookie.value = null;
          refreshCookie.value = null;
          throw new Error("Authentication failed");
        }
      }
    },

    // Hook: Extract tokens from response headers
    onResponse({ response }) {
      const newAccessToken = response.headers.get("X-Access-Token");
      const newRefreshToken = response.headers.get("X-Refresh-Token");

      if (newAccessToken || newRefreshToken) {
        updateTokens(newAccessToken, newRefreshToken);
      }

      // Extract tokens from response body if present (_tokens property)
      const data = response._data;
      if (data && typeof data === "object" && "_tokens" in data) {
        const tokens = (data as Record<string, unknown>)._tokens as Record<string, string> | undefined;
        if (tokens?.accessToken) {
          updateTokens(tokens.accessToken, tokens.refreshToken || null);
          delete (data as Record<string, unknown>)._tokens;
        }
      }
    },
  });

  return {
    baseURL: API_URL,
    get: <T>(endpoint: string) => apiClient<T>(endpoint),
    post: <T>(endpoint: string, body?: unknown) =>
      apiClient<T>(endpoint, { method: "POST", body }),
    patch: <T>(endpoint: string, body?: unknown) =>
      apiClient<T>(endpoint, { method: "PATCH", body }),
    delete: <T>(endpoint: string) =>
      apiClient<T>(endpoint, { method: "DELETE" }),
    upload: async <T>(endpoint: string, formData: FormData): Promise<T> => {
      const tokenValue = tokenCookie.value;
      const headers: HeadersInit = {};
      if (tokenValue) {
        headers.Authorization = `Bearer ${tokenValue}`;
      }

      const response = await ofetch<T>(`${API_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

      return response;
    },
  };
};

// Export as a composable
export const useApi = () => {
  return createApiClient();
};
