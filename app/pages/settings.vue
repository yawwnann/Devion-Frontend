<script setup lang="ts">
const toast = useToast();
const api = useApi();
const { token, user, fetchUser } = useAuth();
const colorMode = useColorMode();

// Dropdown state
const openSection = ref<string | null>(null);
const loadingSections = ref({
  appearance: false,
  preferences: false,
  github: false,
  accounts: false,
  security: false,
});

// Appearance
const appearance = ref(colorMode.preference);
const appearanceLoaded = ref(false);

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
  // Check if it's localhost
  if (
    login.ipAddress === "::1" ||
    login.ipAddress === "127.0.0.1" ||
    login.country === "Local Network" ||
    login.city === "Localhost"
  ) {
    return "Local Development";
  }

  // Format normal location
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
  // Remove IPv6 prefix for localhost
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

  // Load section data if not loaded yet
  if (section === "appearance" && !appearanceLoaded.value) {
    loadingSections.value.appearance = true;
    // Appearance doesn't need API call, just mark as loaded
    appearanceLoaded.value = true;
    loadingSections.value.appearance = false;
  } else if (section === "github" && !githubLoaded.value) {
    await loadGithubData();
  } else if (section === "security" && !loginHistoryLoaded.value) {
    loadingSections.value.security = true;
    await fetchLoginHistory();
    loadingSections.value.security = false;
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
    // Get OAuth URL from backend
    const response = await api.get<{ url: string }>("/auth/google/link");
    // Redirect to Google OAuth
    window.location.href = response.url;
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: "Error",
      description: err.message || "Failed to link Google account",
      color: "error",
    });
    linkingGoogle.value = false;
  }
};

const unlinkGoogleAccount = async () => {
  if (!user.value?.hasPassword) {
    toast.add({
      title: "Error",
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
      title: "Success",
      description: "Google account unlinked successfully",
      color: "success",
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: "Error",
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
      title: "Error",
      description: "Passwords do not match",
      color: "error",
    });
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    toast.add({
      title: "Error",
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
      title: "Success",
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
      title: "Error",
      description: err.message || "Failed to change password",
      color: "error",
    });
  } finally {
    changingPassword.value = false;
  }
};

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

const saveGithubConfig = async () => {
  if (!githubUsername.value && !githubToken.value) {
    toast.add({
      title: "Error",
      description: "Please provide GitHub username or token",
      color: "error",
    });
    return;
  }

  savingGithub.value = true;
  try {
    // Set username if provided
    if (githubUsername.value) {
      await api.post("/github/username", { username: githubUsername.value });
    }

    // Set token if provided
    if (githubToken.value) {
      await api.post("/github/token", { token: githubToken.value });
      hasGithubToken.value = true;
    }

    // Refresh user data to get updated githubUsername
    await fetchUser();

    // Sync repos after configuration
    try {
      await api.post("/github/sync");
    } catch (syncError) {
      console.error("Failed to sync repos:", syncError);
    }

    toast.add({
      title: "Success",
      description: "GitHub configuration saved and repos synced",
      color: "success",
    });

    githubUsername.value = "";
    githubToken.value = "";
  } catch (error: unknown) {
    const err = error as { message?: string };
    toast.add({
      title: "Error",
      description: err.message || "Failed to save GitHub configuration",
      color: "error",
    });
  } finally {
    savingGithub.value = false;
  }
};

onMounted(() => {
  // Check for Google linking result
  const route = useRoute();
  if (route.query.linked === "success") {
    toast.add({
      title: "Success",
      description: "Google account linked successfully",
      color: "success",
    });
    // Refresh user data
    fetchUser();
    // Clean URL
    navigateTo("/settings", { replace: true });
  } else if (route.query.linked === "error") {
    toast.add({
      title: "Error",
      description: "Failed to link Google account",
      color: "error",
    });
    // Clean URL
    navigateTo("/settings", { replace: true });
  }
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
      <div class="p-6 space-y-3">
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
                <p class="font-medium text-sm">Appearance</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Theme and display preferences
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'appearance' }"
            />
          </button>

          <!-- Dropdown Content -->
          <div
            v-show="openSection === 'appearance'"
            class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
            :class="{ 'dropdown-open': openSection === 'appearance' }"
          >
            <div class="dropdown-inner">
              <div class="p-4 space-y-4">
                <div v-if="loadingSections.appearance">
                  <USkeleton class="h-20" />
                </div>
                <div v-else>
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
                        <span class="text-sm font-medium">{{
                          theme.label
                        }}</span>
                      </button>
                    </div>
                  </div>

                  <div class="pt-4 border-t border-default">
                    <p class="text-sm text-muted">
                      Choose how Devion looks to you. Select a single theme, or
                      sync with your system and automatically switch between day
                      and night themes.
                    </p>
                  </div>
                </div>
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
                <p class="font-medium text-sm">Preferences</p>
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

          <!-- Dropdown Content -->
          <div
            v-show="openSection === 'preferences'"
            class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
            :class="{ 'dropdown-open': openSection === 'preferences' }"
          >
            <div class="dropdown-inner">
              <div class="p-4 space-y-4">
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
                <p class="font-medium text-sm">GitHub Integration</p>
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

          <!-- Dropdown Content -->
          <div
            v-show="openSection === 'github'"
            class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
            :class="{ 'dropdown-open': openSection === 'github' }"
          >
            <div class="dropdown-inner">
              <div class="p-4">
                <div v-if="loadingSections.github">
                  <USkeleton class="h-32" />
                </div>
                <div v-else class="space-y-4">
                  <!-- GitHub Username -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <p class="font-medium">GitHub Username</p>
                      <UBadge v-if="user?.githubUsername" color="success">
                        <UIcon name="i-lucide-check" class="size-3 mr-1" />
                        @{{ user.githubUsername }}
                      </UBadge>
                      <UBadge v-else color="neutral">Not set</UBadge>
                    </div>
                    <p class="text-sm text-muted mb-3">
                      Your GitHub username for repository integration
                    </p>
                    <UInput
                      v-model="githubUsername"
                      placeholder="your-github-username"
                      class="w-full"
                      icon="i-lucide-github"
                    />
                  </div>

                  <!-- GitHub Token -->
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
                      <code class="text-xs bg-muted px-1 rounded">repo</code>
                      scope.
                    </p>
                    <UInput
                      v-model="githubToken"
                      type="password"
                      class="w-full"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    />
                  </div>

                  <!-- Save Button -->
                  <div class="flex justify-end pt-2">
                    <UButton
                      :loading="savingGithub"
                      @click="saveGithubConfig"
                      :disabled="!githubUsername && !githubToken"
                    >
                      Save GitHub Configuration
                    </UButton>
                  </div>
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
                <p class="font-medium text-sm">Connected Accounts</p>
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

          <!-- Dropdown Content -->
          <div
            v-show="openSection === 'accounts'"
            class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
            :class="{ 'dropdown-open': openSection === 'accounts' }"
          >
            <div class="dropdown-inner">
              <div class="p-4 space-y-4">
                <!-- Google Account -->
                <div
                  class="flex items-center justify-between p-4 border border-default rounded-lg"
                >
                  <div class="flex items-center gap-3">
                    <div class="p-2 bg-red-500/10 rounded-lg">
                      <UIcon
                        name="i-lucide-globe"
                        class="size-6 text-red-500"
                      />
                    </div>
                    <div>
                      <p class="font-medium">Google Account</p>
                      <p class="text-sm text-muted">
                        {{
                          user?.hasGoogleLinked ? "Connected" : "Not connected"
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
                      @click="unlinkGoogleAccount"
                      :disabled="!user?.hasPassword"
                    >
                      <UIcon name="i-lucide-unlink" class="size-4 mr-1" />
                      Unlink
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
                      Link Account
                    </UButton>
                  </div>
                </div>

                <!-- Info Message -->
                <div
                  v-if="user?.hasGoogleLinked && !user?.hasPassword"
                  class="p-3 bg-warning/10 border border-warning/20 rounded-lg"
                >
                  <div class="flex gap-2">
                    <UIcon
                      name="i-lucide-alert-triangle"
                      class="size-5 text-warning flex-shrink-0 mt-0.5"
                    />
                    <div class="text-sm">
                      <p class="font-medium text-warning mb-1">
                        Set a password to unlink
                      </p>
                      <p class="text-muted">
                        You need to set a password before you can unlink your
                        Google account. This ensures you can still access your
                        account.
                      </p>
                    </div>
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
                <p class="font-medium text-sm">Security</p>
                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                  Password and login history
                </p>
              </div>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition-transform duration-200"
              :class="{ 'rotate-180': openSection === 'security' }"
            />
          </button>

          <!-- Dropdown Content -->
          <div
            v-show="openSection === 'security'"
            class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
            :class="{ 'dropdown-open': openSection === 'security' }"
          >
            <div class="dropdown-inner">
              <div class="p-4 space-y-6">
                <!-- Change Password Form -->
                <div>
                  <h3 class="font-medium mb-3">Change Password</h3>
                  <div class="space-y-3">
                    <!-- Current Password -->
                    <div>
                      <label class="text-sm font-medium mb-2 block"
                        >Current Password</label
                      >
                      <UInput
                        v-model="passwordForm.currentPassword"
                        :type="showCurrentPassword ? 'text' : 'password'"
                        placeholder="Enter current password"
                        class="w-full"
                      >
                        <template #trailing>
                          <UButton
                            variant="link"
                            size="sm"
                            :icon="
                              showCurrentPassword
                                ? 'i-lucide-eye-off'
                                : 'i-lucide-eye'
                            "
                            @click="showCurrentPassword = !showCurrentPassword"
                          />
                        </template>
                      </UInput>
                    </div>

                    <!-- New Password -->
                    <div>
                      <label class="text-sm font-medium mb-2 block"
                        >New Password</label
                      >
                      <UInput
                        v-model="passwordForm.newPassword"
                        :type="showNewPassword ? 'text' : 'password'"
                        placeholder="Enter new password"
                        class="w-full"
                      >
                        <template #trailing>
                          <UButton
                            variant="link"
                            size="sm"
                            :icon="
                              showNewPassword
                                ? 'i-lucide-eye-off'
                                : 'i-lucide-eye'
                            "
                            @click="showNewPassword = !showNewPassword"
                          />
                        </template>
                      </UInput>
                    </div>

                    <!-- Confirm Password -->
                    <div>
                      <label class="text-sm font-medium mb-2 block"
                        >Confirm New Password</label
                      >
                      <UInput
                        v-model="passwordForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        placeholder="Confirm new password"
                        class="w-full"
                      >
                        <template #trailing>
                          <UButton
                            variant="link"
                            size="sm"
                            :icon="
                              showConfirmPassword
                                ? 'i-lucide-eye-off'
                                : 'i-lucide-eye'
                            "
                            @click="showConfirmPassword = !showConfirmPassword"
                          />
                        </template>
                      </UInput>
                    </div>

                    <!-- Save Button -->
                    <div class="flex justify-end pt-2">
                      <UButton
                        :loading="changingPassword"
                        @click="changePassword"
                        :disabled="
                          !passwordForm.currentPassword ||
                          !passwordForm.newPassword
                        "
                      >
                        Update Password
                      </UButton>
                    </div>
                  </div>
                </div>

                <!-- Login History -->
                <div class="border-t border-default pt-4">
                  <h3 class="font-medium mb-3">Login History</h3>
                  <div class="space-y-3">
                    <!-- Loading State -->
                    <div v-if="loadingSections.security" class="space-y-3">
                      <USkeleton v-for="i in 3" :key="i" class="h-16" />
                    </div>

                    <!-- Empty State -->
                    <div
                      v-else-if="loginHistory.length === 0"
                      class="text-center py-8"
                    >
                      <UIcon
                        name="i-lucide-history"
                        class="size-12 text-muted mx-auto mb-3"
                      />
                      <p class="text-muted">No login history available</p>
                    </div>

                    <!-- History List -->
                    <div v-else class="space-y-3">
                      <div
                        v-for="login in loginHistory"
                        :key="login.id"
                        class="flex items-start gap-4 p-3 rounded-lg border border-default hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <!-- Device Icon -->
                        <div
                          class="flex-shrink-0 size-10 rounded-lg flex items-center justify-center"
                          :class="
                            login.isSuccess
                              ? 'bg-success/10 text-success'
                              : 'bg-error/10 text-error'
                          "
                        >
                          <UIcon
                            :name="getDeviceIcon(login.device)"
                            class="size-5"
                          />
                        </div>

                        <!-- Login Details -->
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1">
                            <p class="font-medium text-sm">
                              {{ login.browser }} on {{ login.os }}
                            </p>
                            <UBadge
                              :color="login.isSuccess ? 'success' : 'error'"
                              size="xs"
                            >
                              {{ login.isSuccess ? "Success" : "Failed" }}
                            </UBadge>
                          </div>

                          <div class="text-xs text-muted space-y-1">
                            <div class="flex items-center gap-1">
                              <UIcon name="i-lucide-map-pin" class="size-3" />
                              <span>{{ formatLocation(login) }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <UIcon name="i-lucide-globe" class="size-3" />
                              <span>{{
                                formatIpAddress(login.ipAddress)
                              }}</span>
                            </div>
                            <div class="flex items-center gap-1">
                              <UIcon name="i-lucide-clock" class="size-3" />
                              <span>{{
                                formatLoginDate(login.createdAt)
                              }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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

<style scoped>
/* Smooth dropdown animation using CSS Grid */
.dropdown-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.dropdown-content.dropdown-open {
  grid-template-rows: 1fr;
}

.dropdown-inner {
  min-height: 0;
}
</style>
