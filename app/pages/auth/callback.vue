<script setup lang="ts">
// OAuth callback handler
definePageMeta({ layout: false });

const route = useRoute();
const { setToken, fetchUser } = useAuth();
const error = ref("");

onMounted(async () => {
  const token = route.query.token as string;
  if (token) {
    try {
      setToken(token);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for cookie to be set
      const userData = await fetchUser();

      if (userData) {
        await navigateTo("/dashboard");
      } else {
        error.value = "Failed to fetch user data";
        setTimeout(() => navigateTo("/login"), 2000);
      }
    } catch (err) {
      console.error("Auth callback error:", err);
      error.value = "Authentication failed";
      setTimeout(() => navigateTo("/login"), 2000);
    }
  } else {
    navigateTo("/login");
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
