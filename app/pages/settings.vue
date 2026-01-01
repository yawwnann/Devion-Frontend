<script setup lang="ts">
const toast = useToast();
const api = useApi();
const { token } = useAuth();
const colorMode = useColorMode();

const appearance = ref(colorMode.preference);
const githubToken = ref("");
const hasGithubToken = ref(false);
const savingToken = ref(false);

watch(appearance, (value) => {
  colorMode.preference = value;
});

const themes = [
  { value: "system", label: "System", icon: "i-lucide-monitor" },
  { value: "light", label: "Light", icon: "i-lucide-sun" },
  { value: "dark", label: "Dark", icon: "i-lucide-moon" },
];

const fetchTokenStatus = async () => {
  try {
    const data = await api.get<{ hasToken: boolean }>("/github/token-status");
    hasGithubToken.value = data.hasToken;
  } catch {
    // Ignore errors
  }
};

const saveGithubToken = async () => {
  savingToken.value = true;
  try {
    await api.post("/github/token", { token: githubToken.value || null });
    toast.add({
      title: "Success",
      description: githubToken.value
        ? "GitHub token saved"
        : "GitHub token removed",
      color: "success",
    });
    hasGithubToken.value = !!githubToken.value;
    githubToken.value = "";
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: "Error",
      description: err.message || "Failed to save GitHub token",
      color: "error",
    });
  } finally {
    savingToken.value = false;
  }
};

onMounted(() => {
  fetchTokenStatus();
});
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings">
        <template #logo>
          <UIcon name="i-lucide-settings" class="size-5" />
        </template>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Appearance Section -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-palette" class="size-5" />
              Appearance
            </h2>
          </template>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium mb-3 block">Theme</label>
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="theme in themes"
                  :key="theme.value"
                  class="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all"
                  :class="
                    appearance === theme.value
                      ? 'border-primary bg-primary/5'
                      : 'border-default hover:border-primary/50'
                  "
                  @click="appearance = theme.value"
                >
                  <UIcon :name="theme.icon" class="size-6" />
                  <span class="text-sm font-medium">{{ theme.label }}</span>
                </button>
              </div>
            </div>

            <div class="pt-4 border-t border-default">
              <p class="text-sm text-muted">
                Choose how Devion looks to you. Select a single theme, or sync
                with your system and automatically switch between day and night
                themes.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Preferences Section -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-sliders" class="size-5" />
              Preferences
            </h2>
          </template>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Show sidebar by default</p>
                <p class="text-sm text-muted">
                  Keep the sidebar open when you visit the app
                </p>
              </div>
              <UToggle />
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">Enable animations</p>
                <p class="text-sm text-muted">
                  Use animations and transitions throughout the app
                </p>
              </div>
              <UToggle :model-value="true" />
            </div>
          </div>
        </UCard>

        <!-- GitHub Integration Section -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-github" class="size-5" />
              GitHub Integration
            </h2>
          </template>

          <div class="space-y-4">
            <div>
              <div class="flex items-center justify-between mb-2">
                <p class="font-medium">Personal Access Token</p>
                <UBadge v-if="hasGithubToken" color="success">
                  <UIcon name="i-lucide-check" class="size-3 mr-1" />
                  Connected
                </UBadge>
                <UBadge v-else color="neutral">Not set</UBadge>
              </div>
              <p class="text-sm text-muted mb-3">
                Required for Code Review Center. Generate a token at
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  class="text-primary underline"
                >
                  GitHub Settings
                </a>
                with
                <code class="text-xs bg-muted px-1 rounded">repo</code> scope.
              </p>
              <div class="flex gap-2">
                <UInput
                  v-model="githubToken"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  class="flex-1"
                />
                <UButton :loading="savingToken" @click="saveGithubToken">
                  {{ githubToken ? "Save" : "Remove" }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- About Section -->
        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-info" class="size-5" />
              About
            </h2>
          </template>

          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-muted">Version</span>
              <span class="font-medium">1.0.0</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">Built with</span>
              <span class="font-medium">Nuxt 4 + NestJS</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted">License</span>
              <span class="font-medium">MIT</span>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
