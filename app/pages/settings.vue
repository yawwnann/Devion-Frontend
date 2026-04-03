<script setup lang="ts">
const toast = useToast();
const api = useApi();
const { token, user, fetchUser } = useAuth();
const colorMode = useColorMode();
const { locale, setLocale, locales } = useI18n();
const { t } = useI18n();
const { updatePreferences } = usePreferences();

// Dropdown state
const openSection = ref<string | null>(null);
const loadingSections = ref({
  appearance: false,
  language: false,
  preferences: false,
  github: false,
  accounts: false,
  security: false,
  history: false,
});

// Appearance
const appearance = ref(colorMode.preference);
const appearanceLoaded = ref(false);

// Language
const currentLocale = ref(locale.value);
const languageLoaded = ref(false);

const changeLanguage = async (langCode: string) => {
  await setLocale(langCode as "id" | "en");
  currentLocale.value = langCode as "id" | "en";
  await updatePreferences({ language: langCode as "id" | "en" });
  toast.add({
    title: t("common.success"),
    description: "Language changed successfully",
    color: "success",
  });
};

// GitHub
const githubToken = ref("");
const githubUsername = ref("");
const hasGithubToken = ref(false);
const savingGithub = ref(false);
const githubLoaded = ref(false);

// Login History
interface LoginHistory {
  id: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  country?: string;
  city?: string;
  isSuccess: boolean;
  createdAt: string;
}

const loginHistory = ref<LoginHistory[]>([]);
const loginHistoryLoaded = ref(false);

// Google Account Linking
const linkingGoogle = ref(false);
const unlinkingGoogle = ref(false);

const fetchLoginHistory = async () => {
  try {
    loginHistory.value = await api.get<LoginHistory[]>(
      "/auth/login-history?limit=10",
    );
    loginHistoryLoaded.value = true;
  } catch (error) {
    console.error("Failed to fetch login history:", error);
  }
};

const formatLoginDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDeviceIcon = (device: string) => {
  if (device === "Mobile") return "i-lucide-smartphone";
  if (device === "Tablet") return "i-lucide-tablet";
  return "i-lucide-monitor";
};

const formatLocation = (login: LoginHistory) => {
  if (
    login.ipAddress === "::1" ||
    login.ipAddress === "127.0.0.1" ||
    login.country === "Local Network" ||
    login.city === "Localhost"
  ) {
    return "Local Development";
  }

  if (login.city && login.country) {
    return `${login.city}, ${login.country}`;
  }
  if (login.country) {
    return login.country;
  }
  return "Unknown location";
};

const formatIpAddress = (ip: string) => {
  if (ip === "::1") return "localhost (IPv6)";
  if (ip === "127.0.0.1") return "localhost (IPv4)";
  if (ip.includes("::ffff:127.0.0.1") || ip.includes("::ffff:localhost")) {
    return "localhost (IPv4)";
  }
  if (ip.startsWith("::ffff:") && ip.includes("127.0.0.1")) {
    return "localhost (IPv4)";
  }
  return ip;
};

const toggleSection = async (section: string) => {
  if (openSection.value === section) {
    openSection.value = null;
    return;
  }
  openSection.value = section;

  if (section === "appearance" && !appearanceLoaded.value) {
    loadingSections.value.appearance = true;
    appearanceLoaded.value = true;
    loadingSections.value.appearance = false;
  } else if (section === "language" && !languageLoaded.value) {
    loadingSections.value.language = true;
    languageLoaded.value = true;
    loadingSections.value.language = false;
  } else if (section === "github" && !githubLoaded.value) {
    await loadGithubData();
  } else if (section === "security") {
    // Security currently has no dynamic data to fetch
  } else if (section === "history" && !loginHistoryLoaded.value) {
    loadingSections.value.history = true;
    await fetchLoginHistory();
    loadingSections.value.history = false;
  }
};

const loadGithubData = async () => {
  loadingSections.value.github = true;
  try {
    await fetchTokenStatus();
    githubLoaded.value = true;
  } catch (e) {
    console.error("Failed to load github data:", e);
  } finally {
    loadingSections.value.github = false;
  }
};

const linkGoogleAccount = async () => {
  linkingGoogle.value = true;
  try {
    const response = await api.get<{ url: string }>("/auth/google/link");
    window.location.href = response.url;
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: t("common.error"),
      description: err.message || "Failed to link Google account",
      color: "error",
    });
    linkingGoogle.value = false;
  }
};

const unlinkGoogleAccount = async () => {
  if (!user.value?.hasPassword) {
    toast.add({
      title: t("common.error"),
      description: "Please set a password before unlinking Google account",
      color: "error",
    });
    return;
  }

  unlinkingGoogle.value = true;
  try {
    await api.post("/auth/unlink-google");
    await fetchUser();
    toast.add({
      title: t("common.success"),
      description: "Google account unlinked successfully",
      color: "success",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: t("common.error"),
      description: err.message || "Failed to unlink Google account",
      color: "error",
    });
  } finally {
    unlinkingGoogle.value = false;
  }
};

// Password form
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const changingPassword = ref(false);

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({
      title: t("common.error"),
      description: "Passwords do not match",
      color: "error",
    });
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    toast.add({
      title: t("common.error"),
      description: "Password must be at least 6 characters",
      color: "error",
    });
    return;
  }

  changingPassword.value = true;
  try {
    await api.post("/auth/change-password", {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    });

    toast.add({
      title: t("common.success"),
      description: "Password changed successfully",
      color: "success",
    });

    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: t("common.error"),
      description: err.message || "Failed to change password",
      color: "error",
    });
  } finally {
    changingPassword.value = false;
  }
};

watch(appearance, async (value) => {
  colorMode.preference = value;
  await updatePreferences({ theme: value });
});

const themes = [
  { value: "system", label: t("settings.system"), icon: "i-lucide-monitor" },
  { value: "light", label: t("settings.light"), icon: "i-lucide-sun" },
  { value: "dark", label: t("settings.dark"), icon: "i-lucide-moon" },
];

const fetchTokenStatus = async () => {
  try {
    const data = await api.get<{ hasToken: boolean }>("/github/token-status");
    hasGithubToken.value = data.hasToken;
  } catch {
    // Ignore errors
  }
};

const saveGithubConfig = async () => {
  if (!githubUsername.value && !githubToken.value) {
    toast.add({
      title: t("common.error"),
      description: "Please provide GitHub username or token",
      color: "error",
    });
    return;
  }

  savingGithub.value = true;
  try {
    if (githubUsername.value) {
      await api.post("/github/username", { username: githubUsername.value });
    }

    if (githubToken.value) {
      await api.post("/github/token", { token: githubToken.value });
      hasGithubToken.value = true;
    }

    await fetchUser();

    try {
      await api.post("/github/sync");
    } catch (syncError) {
      console.error("Failed to sync repos:", syncError);
    }

    toast.add({
      title: t("common.success"),
      description: "GitHub configuration saved and repos synced",
      color: "success",
    });

    githubUsername.value = "";
    githubToken.value = "";
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: t("common.error"),
      description: err.message || "Failed to save GitHub configuration",
      color: "error",
    });
  } finally {
    savingGithub.value = false;
  }
};

onMounted(() => {
  const route = useRoute();
  if (route.query.linked === "success") {
    toast.add({
      title: t("common.success"),
      description: "Google account linked successfully",
      color: "success",
    });
    fetchUser();
    navigateTo("/settings", { replace: true });
  } else if (route.query.linked === "error") {
    toast.add({
      title: t("common.error"),
      description: "Failed to link Google account",
      color: "error",
    });
    navigateTo("/settings", { replace: true });
  }
});
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <AppNavbar :title="t('settings.title')">
        <template #logo>
          <UIcon name="i-lucide-settings" class="size-5" />
        </template>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <!-- Page Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-white">
            {{ t("settings.title") }}
          </h1>
          <p class="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <!-- Appearance Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('appearance')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-palette"
                  class="size-5 text-blue-600 dark:text-blue-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.appearance") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  {{ t("settings.theme") }}
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'appearance' }"
            />
          </button>

          <div
            v-show="openSection === 'appearance'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4 space-y-4">
              <div v-if="loadingSections.appearance">
                <USkeleton class="h-20" />
              </div>
              <div v-else>
                <div>
                  <label class="text-sm font-medium mb-3 block">{{
                    t("settings.theme")
                  }}</label>
                  <div class="grid grid-cols-3 gap-3">
                    <button
                      v-for="theme in themes"
                      :key="theme.value"
                      class="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all"
                      :class="
                        appearance === theme.value
                          ? 'border-primary bg-primary/5'
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-primary/50'
                      "
                      @click="appearance = theme.value"
                    >
                      <UIcon :name="theme.icon" class="size-6" />
                      <span class="text-sm font-medium">{{ theme.label }}</span>
                    </button>
                  </div>
                </div>

                <div class="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    {{ t("settings.themeDescription") }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Language Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('language')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-languages"
                  class="size-5 text-green-600 dark:text-green-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.language") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Select your preferred language
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'language' }"
            />
          </button>

          <div
            v-show="openSection === 'language'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4 space-y-4">
              <div v-if="loadingSections.language">
                <USkeleton class="h-20" />
              </div>
              <div v-else class="grid grid-cols-2 gap-3">
                <button
                  v-for="availableLocale in locales"
                  :key="availableLocale.code"
                  class="flex flex-col items-center gap-2 p-4 rounded-lg border transition-all"
                  :class="
                    currentLocale === availableLocale.code
                      ? 'border-primary bg-primary/5'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-primary/50'
                  "
                  @click="changeLanguage(availableLocale.code)"
                >
                  <UIcon
                    :name="
                      availableLocale.code === 'id'
                        ? 'i-lucide-flag'
                        : 'i-lucide-globe'
                    "
                    class="size-6"
                  />
                  <span class="text-sm font-medium">{{
                    availableLocale.name
                  }}</span>
                </button>
              </div>

              <div class="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                <p class="text-sm text-zinc-500 dark:text-zinc-400">
                  Choose your preferred language for the Devion interface.
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Preferences Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('preferences')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-sliders"
                  class="size-5 text-purple-600 dark:text-purple-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.preferences") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  App behavior and animations
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'preferences' }"
            />
          </button>

          <div
            v-show="openSection === 'preferences'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">
                    {{ t("settings.showSidebarByDefault") }}
                  </p>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    {{ t("settings.keepSidebarOpen") }}
                  </p>
                </div>
                <UToggle />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">
                    {{ t("settings.enableAnimations") }}
                  </p>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    {{ t("settings.useAnimationsThroughout") }}
                  </p>
                </div>
                <UToggle :model-value="true" />
              </div>
            </div>
          </div>
        </UCard>

        <!-- GitHub Integration Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('github')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-github"
                  class="size-5 text-zinc-700 dark:text-zinc-300"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.githubIntegration") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Connect your GitHub account
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'github' }"
            />
          </button>

          <div
            v-show="openSection === 'github'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4">
              <div v-if="loadingSections.github">
                <USkeleton class="h-32" />
              </div>
              <div v-else class="space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <p class="font-medium">
                      {{ t("settings.githubUsername") }}
                    </p>
                    <UBadge v-if="user?.githubUsername" color="success">
                      <UIcon name="i-lucide-check" class="size-3 mr-1" />
                      @{{ user.githubUsername }}
                    </UBadge>
                    <UBadge v-else color="neutral">Not set</UBadge>
                  </div>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                    {{ t("settings.githubUsernameDescription") }}
                  </p>
                  <UInput
                    v-model="githubUsername"
                    :placeholder="t('settings.githubUsernamePlaceholder')"
                    class="w-full"
                    icon="i-lucide-github"
                  />
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <p class="font-medium">
                      {{ t("settings.personalAccessToken") }}
                    </p>
                    <UBadge v-if="hasGithubToken" color="success">
                      <UIcon name="i-lucide-check" class="size-3 mr-1" />
                      Connected
                    </UBadge>
                    <UBadge v-else color="neutral">Not set</UBadge>
                  </div>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                    {{ t("settings.personalAccessTokenDescription") }}
                    <a
                      href="https://github.com/settings/tokens/new"
                      target="_blank"
                      class="text-primary underline"
                    >
                      {{ t("settings.githubSettings") }}
                    </a>
                    {{ t("settings.withScope") }}
                    <code
                      class="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded"
                      >repo</code
                    >
                  </p>
                  <UInput
                    v-model="githubToken"
                    type="password"
                    class="w-full"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                <div class="flex justify-end pt-2">
                  <UButton
                    :loading="savingGithub"
                    :disabled="!githubUsername && !githubToken"
                    @click="saveGithubConfig"
                  >
                    {{ t("settings.saveGithubConfig") }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Connected Accounts Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('accounts')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-link"
                  class="size-5 text-red-600 dark:text-red-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.connectedAccounts") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Link or unlink your accounts
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'accounts' }"
            />
          </button>

          <div
            v-show="openSection === 'accounts'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4 space-y-4">
              <div
                class="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div class="p-2 bg-red-500/10 rounded-lg">
                    <UIcon name="i-lucide-globe" class="size-6 text-red-500" />
                  </div>
                  <div>
                    <p class="font-medium">{{ t("settings.googleAccount") }}</p>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      {{
                        user?.hasGoogleLinked
                          ? t("settings.connected")
                          : t("settings.notConnected")
                      }}
                    </p>
                  </div>
                </div>

                <div v-if="user?.hasGoogleLinked">
                  <UButton
                    color="error"
                    variant="outline"
                    size="sm"
                    :loading="unlinkingGoogle"
                    :disabled="!user?.hasPassword"
                    @click="unlinkGoogleAccount"
                  >
                    <UIcon name="i-lucide-unlink" class="size-4 mr-1" />
                    {{ t("settings.unlink") }}
                  </UButton>
                </div>
                <div v-else>
                  <UButton
                    color="primary"
                    variant="outline"
                    size="sm"
                    :loading="linkingGoogle"
                    @click="linkGoogleAccount"
                  >
                    <UIcon name="i-lucide-link" class="size-4 mr-1" />
                    {{ t("settings.linkAccount") }}
                  </UButton>
                </div>
              </div>

              <div
                v-if="user?.hasGoogleLinked && !user?.hasPassword"
                class="p-3 bg-warning/10 border border-warning/20 rounded-lg"
              >
                <div class="flex gap-2">
                  <UIcon
                    name="i-lucide-alert-triangle"
                    class="size-5 text-warning shrink-0 mt-0.5"
                  />
                  <div class="text-sm">
                    <p class="font-medium text-warning mb-1">
                      {{ t("settings.setPasswordToUnlink") }}
                    </p>
                    <p class="text-zinc-500 dark:text-zinc-400">
                      {{ t("settings.needPasswordToUnlink") }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Security Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('security')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-shield"
                  class="size-5 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.security") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  {{ t("settings.changePassword") }}
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'security' }"
            />
          </button>

          <div
            v-show="openSection === 'security'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4 space-y-4">
              <div class="space-y-3">
                <div>
                  <label class="text-sm font-medium mb-2 block">{{
                    t("settings.currentPassword")
                  }}</label>
                  <div class="relative">
                    <UInput
                      v-model="passwordForm.currentPassword"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      :placeholder="t('settings.enterCurrentPassword')"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <UIcon
                        :name="
                          showCurrentPassword
                            ? 'i-lucide-eye-off'
                            : 'i-lucide-eye'
                        "
                        class="size-4"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium mb-2 block">{{
                    t("settings.newPassword")
                  }}</label>
                  <div class="relative">
                    <UInput
                      v-model="passwordForm.newPassword"
                      :type="showNewPassword ? 'text' : 'password'"
                      :placeholder="t('settings.enterNewPassword')"
                      class="pr-10"
                    />
                    <button
                      type="button"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                      @click="showNewPassword = !showNewPassword"
                    >
                      <UIcon
                        :name="
                          showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'
                        "
                        class="size-4"
                      />
                    </button>
                  </div>
                </div>

                <div>
                  <label class="text-sm font-medium mb-2 block">{{
                    t("settings.confirmPassword")
                  }}</label>
                  <UInput
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    :placeholder="t('settings.confirmPassword')"
                  />
                </div>

                <div class="flex justify-end pt-2">
                  <UButton
                    color="primary"
                    :loading="changingPassword"
                    :disabled="
                      !passwordForm.currentPassword ||
                      !passwordForm.newPassword ||
                      !passwordForm.confirmPassword
                    "
                    @click="changePassword"
                  >
                    {{ t("settings.updatePassword") }}
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Login History Section -->
        <UCard class="overflow-hidden">
          <button
            class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
            @click="toggleSection('history')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="size-5 text-amber-600 dark:text-amber-400"
                />
              </div>
              <div class="text-left">
                <p class="font-medium">{{ t("settings.loginHistory") }}</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Recent login activity
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'history' }"
            />
          </button>

          <div
            v-show="openSection === 'history'"
            class="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div class="p-4">
              <div v-if="loadingSections.history">
                <USkeleton class="h-32" />
              </div>
              <div v-else-if="loginHistory.length === 0">
                <p
                  class="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4"
                >
                  No login history available
                </p>
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="login in loginHistory"
                  :key="login.id"
                  class="flex items-start justify-between p-3 border border-zinc-200 dark:border-zinc-700 rounded-lg"
                >
                  <div class="flex items-start gap-3">
                    <div
                      class="p-2 rounded-lg"
                      :class="
                        login.isSuccess
                          ? 'bg-green-100 dark:bg-green-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                      "
                    >
                      <UIcon
                        :name="getDeviceIcon(login.device)"
                        class="size-5"
                        :class="
                          login.isSuccess
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        "
                      />
                    </div>
                    <div>
                      <p class="font-medium text-sm">
                        {{ login.browser }} on {{ login.os }}
                      </p>
                      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {{ formatLocation(login) }} •
                        {{ formatIpAddress(login.ipAddress) }}
                      </p>
                      <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {{ formatLoginDate(login.createdAt) }}
                      </p>
                    </div>
                  </div>
                  <UBadge
                    :color="login.isSuccess ? 'success' : 'error'"
                    variant="subtle"
                    size="xs"
                  >
                    {{
                      login.isSuccess
                        ? t("settings.success")
                        : t("settings.failed")
                    }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.dropdown-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.dropdown-open {
  max-height: 1000px;
}

.dropdown-inner {
  background-color: inherit;
}
</style>
