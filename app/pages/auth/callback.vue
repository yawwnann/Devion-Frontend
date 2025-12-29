<script setup lang="ts">
// OAuth callback handler
definePageMeta({ layout: false });

const route = useRoute();
const { setToken, fetchUser } = useAuth();

onMounted(async () => {
  const token = route.query.token as string;
  if (token) {
    setToken(token);
    await fetchUser();
    navigateTo("/");
  } else {
    navigateTo("/login");
  }
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
      <p class="mt-2 text-muted">Signing you in...</p>
    </div>
  </div>
</template>
