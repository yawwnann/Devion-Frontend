<script setup lang="ts">
// OAuth callback handler
definePageMeta({ layout: false });

const route = useRoute();
const { setTokens, fetchUser } = useAuth();
const error = ref("");

onMounted(async () => {
  console.log("🟢 [CALLBACK] Callback page mounted");
  console.log("🟢 [CALLBACK] Route query:", route.query);

  const token = route.query.token as string;
  const refreshToken = route.query.refreshToken as string;

  console.log("🟢 [CALLBACK] Token exists:", !!token);
  console.log("🟢 [CALLBACK] RefreshToken exists:", !!refreshToken);

  if (token && refreshToken) {
    try {
      console.log("🟢 [CALLBACK] Setting tokens in cookies...");
      // Set tokens in cookies
      setTokens(token, refreshToken);

      console.log("🟢 [CALLBACK] Waiting for cookies to be set...");
      // Wait for cookies to be set (increased timeout for reliability)
      await new Promise((resolve) => setTimeout(resolve, 300));

      console.log("🟢 [CALLBACK] Fetching user data...");
      
      // Retry logic for fetching user data
      let userData = null;
      let lastError = null;
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🟢 [CALLBACK] Fetch attempt ${attempt}/${maxRetries}...`);
          userData = await fetchUser();
          
          if (userData) {
            console.log("🟢 [CALLBACK] User data fetched successfully:", userData.email);
            break; // Success, exit retry loop
          }
        } catch (fetchError) {
          lastError = fetchError;
          console.warn(`🟡 [CALLBACK] Fetch attempt ${attempt} failed:`, fetchError);
          
          if (attempt < maxRetries) {
            // Wait before retry (exponential backoff)
            const waitTime = attempt * 500;
            console.log(`🟡 [CALLBACK] Retrying in ${waitTime}ms...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
        }
      }

      if (userData) {
        console.log("🟢 [CALLBACK] Redirecting to dashboard...");
        // Redirect to dashboard
        await navigateTo("/dashboard");
      } else {
        console.error("🔴 [CALLBACK] Failed to fetch user data after retries");
        console.error("🔴 [CALLBACK] Last error:", lastError);
        error.value = "Failed to fetch user data. Please try again.";
        setTimeout(() => navigateTo("/login"), 3000);
      }
    } catch (err) {
      console.error("🔴 [CALLBACK] Auth callback error:", err);
      error.value = "Authentication failed";
      setTimeout(() => navigateTo("/login"), 3000);
    }
  } else {
    console.error("🔴 [CALLBACK] Missing authentication tokens");
    error.value = "Missing authentication tokens";
    setTimeout(() => navigateTo("/login"), 3000);
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-black">
    <div class="text-center">
      <UIcon
        v-if="!error"
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-emerald-500 mx-auto"
      />
      <UIcon
        v-else
        name="i-lucide-alert-circle"
        class="size-8 text-red-500 mx-auto"
      />
      <p class="mt-4 text-white">
        {{ error || "Signing you in..." }}
      </p>
    </div>
  </div>
</template>
