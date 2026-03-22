export default defineNuxtPlugin(() => {
  const token = useCookie("auth_token", { maxAge: 60 * 15 }); // 15 minutes
  const refreshToken = useCookie("refresh_token", { maxAge: 60 * 60 * 24 * 7 }); // 7 days

  // Store the original fetch
  const originalFetch = globalThis.fetch;

  // Override fetch to intercept responses
  globalThis.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const response = await originalFetch(input, init);

    // Check if response contains new tokens
    const newAccessToken = response.headers.get("X-Access-Token");
    const newRefreshToken = response.headers.get("X-Refresh-Token");

    if (newAccessToken || newRefreshToken) {
      // Update tokens if provided
      if (newAccessToken) {
        token.value = newAccessToken;
      }
      if (newRefreshToken) {
        refreshToken.value = newRefreshToken;
      }
    }

    return response;
  };

  // Also provide a cleanup function
  onCleanup(() => {
    globalThis.fetch = originalFetch;
  });
});
function onCleanup(callback: () => void) {
  if (import.meta.server) return;
  onBeforeUnmount(callback);
}
