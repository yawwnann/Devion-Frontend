<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const api = useApi();
const { user, logout, fetchUser } = useAuth();
const token = useCookie("auth_token");

// Stats
const stats = ref({ projects: 0, todos: 0, pages: 0 });
const loadingStats = ref(true);

// Edit states
const editingProfile = ref(false);
const uploadingAvatar = ref(false);
const uploadingCover = ref(false);

// Image cropper
const showAvatarCropperModal = ref(false);
const showCoverCropperModal = ref(false);
const showLogoutDialog = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);

// Dropdown sections
const openSection = ref<string | null>(null);
const loadingSections = ref({
  settings: false,
  github: false,
  security: false,
  loginHistory: false,
});

// Section data
const settingsData = ref<{
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;
} | null>(null);

const githubData = ref<{
  connected: boolean;
  username: string | null;
  repos: any[];
  lastSync: string | null;
} | null>(null);

const securityData = ref<{
  passwordLastChanged: string | null;
  activeSessions: number;
  recoveryEmail: string | null;
} | null>(null);

const loginHistoryData = ref<{
  logins: Array<{
    id: string;
    timestamp: string;
    ip: string;
    device: string;
    location: string;
    success: boolean;
  }>;
} | null>(null);

// Forms
const profileForm = ref({
  name: "",
  bio: "",
  githubUsername: "",
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const toggleSection = async (section: string) => {
  if (openSection.value === section) {
    openSection.value = null;
    return;
  }
  openSection.value = section;

  // Fetch data for the section if not loaded yet
  if (section === "settings" && !settingsData.value) {
    await loadSettingsData();
  } else if (section === "github" && !githubData.value) {
    await loadGithubData();
  } else if (section === "security" && !securityData.value) {
    await loadSecurityData();
  } else if (section === "loginHistory" && !loginHistoryData.value) {
    await loadLoginHistoryData();
  }
};

const loadSettingsData = async () => {
  loadingSections.value.settings = true;
  try {
    // Mock data - replace with actual API call
    settingsData.value = {
      emailNotifications: true,
      twoFactorEnabled: false,
      language: "en",
      timezone: "UTC",
    };
  } catch (e) {
    console.error("Failed to load settings:", e);
  } finally {
    loadingSections.value.settings = false;
  }
};

const loadGithubData = async () => {
  loadingSections.value.github = true;
  try {
    const repos = await api.get("/github/repos");
    githubData.value = {
      connected: !!user.value?.githubUsername,
      username: user.value?.githubUsername || null,
      repos: Array.isArray(repos) ? repos : [],
      lastSync: user.value?.updatedAt || null,
    };
  } catch (e) {
    console.error("Failed to load github data:", e);
    githubData.value = {
      connected: false,
      username: null,
      repos: [],
      lastSync: null,
    };
  } finally {
    loadingSections.value.github = false;
  }
};

const loadSecurityData = async () => {
  loadingSections.value.security = true;
  try {
    // Mock data - replace with actual API call
    securityData.value = {
      passwordLastChanged: user.value?.createdAt || null,
      activeSessions: 1,
      recoveryEmail: null,
    };
  } catch (e) {
    console.error("Failed to load security data:", e);
  } finally {
    loadingSections.value.security = false;
  }
};

const loadLoginHistoryData = async () => {
  loadingSections.value.loginHistory = true;
  try {
    // Mock data - replace with actual API call
    loginHistoryData.value = {
      logins: [
        {
          id: "1",
          timestamp: new Date().toISOString(),
          ip: "192.168.1.1",
          device: "Chrome on Windows",
          location: "Jakarta, Indonesia",
          success: true,
        },
      ],
    };
  } catch (e) {
    console.error("Failed to load login history:", e);
  } finally {
    loadingSections.value.loginHistory = false;
  }
};

const loadStats = async () => {
  try {
    stats.value = await api.get("/auth/statistics");
  } catch (e) {
    console.error("Failed to load stats:", e);
  } finally {
    loadingStats.value = false;
  }
};

const startEditProfile = () => {
  profileForm.value = {
    name: user.value?.name || "",
    bio: user.value?.bio || "",
    githubUsername: user.value?.githubUsername || "",
  };
  editingProfile.value = true;
};

const cancelEditProfile = () => {
  editingProfile.value = false;
};

const saveProfile = async () => {
  try {
    await api.patch("/auth/profile", profileForm.value);
    await fetchUser();
    editingProfile.value = false;
  } catch (e) {
    console.error("Failed to update profile:", e);
  }
};

// Avatar upload
const handleAvatarSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showAvatarCropperModal.value = true;
  };
  reader.readAsDataURL(file);
};

const cropAvatar = ({ canvas }: any) => {
  canvas.toBlob((blob: Blob) => {
    croppedImage.value = blob;
  });
};

const uploadAvatar = async () => {
  if (!croppedImage.value) return;

  uploadingAvatar.value = true;
  try {
    const formData = new FormData();
    formData.append("file", croppedImage.value, "avatar.jpg");

    await api.upload("/auth/upload-avatar", formData);
    await fetchUser();
    showAvatarCropperModal.value = false;
    croppedImage.value = null;
  } catch (e) {
    console.error("Failed to upload avatar:", e);
  } finally {
    uploadingAvatar.value = false;
  }
};

// Cover upload
const handleCoverSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showCoverCropperModal.value = true;
  };
  reader.readAsDataURL(file);
};

const cropCover = ({ canvas }: any) => {
  canvas.toBlob((blob: Blob) => {
    croppedImage.value = blob;
  });
};

const uploadCover = async () => {
  if (!croppedImage.value) return;

  uploadingCover.value = true;
  try {
    const formData = new FormData();
    formData.append("file", croppedImage.value, "cover.jpg");

    await api.upload("/auth/upload-cover", formData);
    await fetchUser();
    showCoverCropperModal.value = false;
    croppedImage.value = null;
  } catch (e) {
    console.error("Failed to upload cover:", e);
  } finally {
    uploadingCover.value = false;
  }
};

const removeCover = async () => {
  try {
    await api.patch("/auth/profile", { cover: null });
    await fetchUser();
  } catch (e) {
    console.error("Failed to remove cover:", e);
  }
};

onMounted(async () => {
  console.log(
    "📄 Profile mounted, user exists:",
    !!user.value,
    "token exists:",
    !!token.value,
  );
  // Always fetch user data when profile page loads
  console.log("🔄 Fetching user data...");
  await fetchUser();
  await loadStats();
});
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="overflow-y-auto h-full bg-zinc-50 dark:bg-zinc-950">
        <!-- Hero Section with Cover & Avatar -->
        <div class="relative">
          <!-- Cover Image -->
          <div class="relative h-56 group">
            <div
              v-if="user?.cover"
              class="absolute inset-0 bg-cover bg-center"
              :style="{ backgroundImage: `url(${user.cover})` }"
            />
            <div
              v-else
              class="absolute inset-0 bg-linear-to-br from-emerald-500 via-emerald-600 to-teal-700"
            />
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/20" />

            <!-- Cover Actions -->
            <div
              class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <button
                class="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-xs rounded-lg backdrop-blur-sm transition border border-white/20 dark:border-zinc-700 font-medium"
                @click="coverInput?.click()"
              >
                <UIcon name="i-lucide-image" class="size-3 mr-1" />
                {{ user?.cover ? "Change" : "Add" }} Cover
              </button>
              <button
                v-if="user?.cover"
                class="px-3 py-1.5 bg-white/90 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 text-xs rounded-lg backdrop-blur-sm transition border border-white/20 dark:border-zinc-700 font-medium text-red-600"
                @click="removeCover"
              >
                <UIcon name="i-lucide-trash-2" class="size-3" />
              </button>
            </div>
            <input
              ref="coverInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleCoverSelect"
            />
          </div>

          <!-- Profile Card -->
          <div class="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
            <UCard>
              <div class="flex flex-col md:flex-row gap-6">
                <!-- Avatar Section -->
                <div class="relative group shrink-0">
                  <div class="relative">
                    <UAvatar
                      :src="user?.avatar || undefined"
                      :alt="user?.name || 'User'"
                      size="2xl"
                      class="ring-4 ring-white dark:ring-zinc-900 size-32"
                    />
                    <button
                      class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      @click="avatarInput?.click()"
                    >
                      <UIcon name="i-lucide-camera" class="size-6 text-white" />
                    </button>
                    <input
                      ref="avatarInput"
                      type="file"
                      accept="image/*"
                      class="hidden"
                      @change="handleAvatarSelect"
                    />
                  </div>
                </div>

                <!-- Profile Info -->
                <div class="flex-1 min-w-0">
                  <div v-if="!editingProfile" class="space-y-3">
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <h1 class="text-2xl font-bold truncate">
                          {{ user?.name || "Anonymous User" }}
                        </h1>
                        <UButton
                          icon="i-lucide-pencil"
                          variant="ghost"
                          size="xs"
                          @click="startEditProfile"
                        />
                      </div>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400">
                        {{ user?.email }}
                      </p>
                    </div>

                    <p
                      v-if="user?.bio"
                      class="text-sm text-zinc-600 dark:text-zinc-300"
                    >
                      {{ user.bio }}
                    </p>
                    <p
                      v-else
                      class="text-sm text-zinc-400 dark:text-zinc-500 italic"
                    >
                      No bio yet
                    </p>

                    <!-- Quick Info -->
                    <div class="flex flex-wrap gap-4 pt-2">
                      <div
                        v-if="user?.githubUsername"
                        class="flex items-center gap-2 text-sm"
                      >
                        <UIcon
                          name="i-lucide-github"
                          class="size-4 text-zinc-400"
                        />
                        <span class="text-zinc-600 dark:text-zinc-300"
                          >@{{ user.githubUsername }}</span
                        >
                      </div>
                      <div class="flex items-center gap-2 text-sm">
                        <UIcon
                          name="i-lucide-calendar"
                          class="size-4 text-zinc-400"
                        />
                        <span class="text-zinc-600 dark:text-zinc-300"
                          >Joined
                          {{
                            user?.createdAt ? formatDate(user.createdAt) : "-"
                          }}</span
                        >
                      </div>
                    </div>
                  </div>

                  <!-- Edit Form -->
                  <div v-else class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium mb-2">Name</label>
                      <UInput
                        v-model="profileForm.name"
                        placeholder="Your name"
                        size="lg"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Bio</label>
                      <UTextarea
                        v-model="profileForm.bio"
                        placeholder="Write a short bio about yourself"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2"
                        >GitHub Username</label
                      >
                      <UInput
                        v-model="profileForm.githubUsername"
                        placeholder="github-username"
                        icon="i-lucide-github"
                        size="lg"
                      />
                    </div>
                    <div class="flex gap-2 pt-2">
                      <UButton @click="saveProfile"> Save Changes </UButton>
                      <UButton variant="ghost" @click="cancelEditProfile">
                        Cancel
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Content Area -->
        <div class="max-w-7xl mx-auto px-6 py-6 space-y-4">
          <!-- Statistics Grid -->
          <div class="grid grid-cols-3 gap-4">
            <UCard v-if="loadingStats">
              <USkeleton class="h-16" />
            </UCard>
            <UCard
              v-else
              class="text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div class="text-3xl font-bold text-emerald-600">
                {{ stats.projects }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Projects
              </div>
            </UCard>

            <UCard v-if="loadingStats">
              <USkeleton class="h-16" />
            </UCard>
            <UCard
              v-else
              class="text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div class="text-3xl font-bold text-emerald-600">
                {{ stats.todos }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Todos
              </div>
            </UCard>

            <UCard v-if="loadingStats">
              <USkeleton class="h-16" />
            </UCard>
            <UCard
              v-else
              class="text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer"
            >
              <div class="text-3xl font-bold text-emerald-600">
                {{ stats.pages }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Pages
              </div>
            </UCard>
          </div>

          <!-- Dropdown Sections -->
          <div class="space-y-2">
            <!-- Settings Section -->
            <UCard class="overflow-hidden">
              <button
                class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                @click="toggleSection('settings')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-settings"
                      class="size-5 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-sm">Settings</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      Manage your preferences
                    </p>
                  </div>
                </div>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-5 text-zinc-400 transition-transform duration-200"
                  :class="{ 'rotate-180': openSection === 'settings' }"
                />
              </button>

              <!-- Dropdown Content -->
              <div
                v-show="openSection === 'settings'"
                class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
                :class="{ 'dropdown-open': openSection === 'settings' }"
              >
                <div class="dropdown-inner">
                  <div class="p-4">
                    <div v-if="loadingSections.settings">
                      <USkeleton class="h-20" />
                    </div>
                    <div v-else-if="settingsData" class="space-y-4">
                      <div
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div>
                          <p class="text-sm font-medium">Email Notifications</p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            Receive email updates
                          </p>
                        </div>
                        <UToggle v-model="settingsData.emailNotifications" />
                      </div>
                      <div
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div>
                          <p class="text-sm font-medium">Two-Factor Auth</p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            Extra security layer
                          </p>
                        </div>
                        <UToggle v-model="settingsData.twoFactorEnabled" />
                      </div>
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            class="text-xs text-zinc-500 dark:text-zinc-400"
                            >Language</label
                          >
                          <USelect
                            v-model="settingsData.language"
                            :options="[
                              { label: 'English', value: 'en' },
                              { label: 'Indonesia', value: 'id' },
                            ]"
                            class="w-full mt-1"
                          />
                        </div>
                        <div>
                          <label
                            class="text-xs text-zinc-500 dark:text-zinc-400"
                            >Timezone</label
                          >
                          <USelect
                            v-model="settingsData.timezone"
                            :options="[
                              { label: 'UTC', value: 'UTC' },
                              { label: 'WIB (UTC+7)', value: 'Asia/Jakarta' },
                            ]"
                            class="w-full mt-1"
                          />
                        </div>
                      </div>
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
                      <USkeleton class="h-20" />
                    </div>
                    <div v-else-if="githubData" class="space-y-4">
                      <div
                        v-if="githubData.connected"
                        class="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      >
                        <UIcon
                          name="i-lucide-circle-check"
                          class="size-5 text-green-600 dark:text-green-400"
                        />
                        <div>
                          <p
                            class="text-sm font-medium text-green-800 dark:text-green-200"
                          >
                            GitHub Connected
                          </p>
                          <p class="text-xs text-green-600 dark:text-green-400">
                            @{{ githubData.username }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-else
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <p class="text-sm text-zinc-600 dark:text-zinc-300">
                          Not connected to GitHub
                        </p>
                        <UButton size="sm" icon="i-lucide-github">
                          Connect
                        </UButton>
                      </div>
                      <div v-if="githubData.repos.length > 0">
                        <p class="text-xs font-medium text-zinc-500 mb-2">
                          Repositories ({{ githubData.repos.length }})
                        </p>
                        <div class="space-y-2">
                          <div
                            v-for="repo in githubData.repos.slice(0, 3)"
                            :key="repo.id"
                            class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 text-sm"
                          >
                            {{ repo.name }}
                          </div>
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
                      name="i-lucide-shield-check"
                      class="size-5 text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-sm">Security</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      Password and sessions
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
                  <div class="p-4">
                    <div v-if="loadingSections.security">
                      <USkeleton class="h-20" />
                    </div>
                    <div v-else-if="securityData" class="space-y-3">
                      <div
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div>
                          <p class="text-sm font-medium">Password</p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            {{
                              user?.hasPassword
                                ? "Last changed recently"
                                : "OAuth login - password not available"
                            }}
                          </p>
                        </div>
                        <UButton
                          v-if="user?.hasPassword"
                          variant="outline"
                          size="sm"
                          icon="i-lucide-key"
                        >
                          Change
                        </UButton>
                      </div>
                      <div
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div>
                          <p class="text-sm font-medium">Active Sessions</p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            Devices currently logged in
                          </p>
                        </div>
                        <UBadge :label="String(securityData.activeSessions)" />
                      </div>
                      <div
                        class="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div>
                          <p class="text-sm font-medium text-red-600">
                            Log Out
                          </p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            Sign out from all devices
                          </p>
                        </div>
                        <UButton
                          variant="ghost"
                          color="error"
                          size="sm"
                          icon="i-lucide-log-out"
                          @click="showLogoutDialog = true"
                        >
                          Log Out
                        </UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Login History Section -->
            <UCard class="overflow-hidden">
              <button
                class="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                @click="toggleSection('loginHistory')"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center"
                  >
                    <UIcon
                      name="i-lucide-clock"
                      class="size-5 text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div class="text-left">
                    <p class="font-medium text-sm">Login History</p>
                    <p class="text-xs text-zinc-500 dark:text-zinc-400">
                      Recent login activity
                    </p>
                  </div>
                </div>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-5 text-zinc-400 transition-transform duration-200"
                  :class="{ 'rotate-180': openSection === 'loginHistory' }"
                />
              </button>

              <!-- Dropdown Content -->
              <div
                v-show="openSection === 'loginHistory'"
                class="dropdown-content border-t border-zinc-200 dark:border-zinc-800"
                :class="{ 'dropdown-open': openSection === 'loginHistory' }"
              >
                <div class="dropdown-inner">
                  <div class="p-4">
                    <div v-if="loadingSections.loginHistory">
                      <USkeleton class="h-20" />
                    </div>
                    <div v-else-if="loginHistoryData" class="space-y-3">
                      <div
                        v-for="login in loginHistoryData.logins"
                        :key="login.id"
                        class="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50"
                      >
                        <div
                          :class="[
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            login.success
                              ? 'bg-green-100 dark:bg-green-900/20'
                              : 'bg-red-100 dark:bg-red-900/20',
                          ]"
                        >
                          <UIcon
                            :name="
                              login.success ? 'i-lucide-check' : 'i-lucide-x'
                            "
                            :class="[
                              'size-4',
                              login.success
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-red-600 dark:text-red-400',
                            ]"
                          />
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">
                            {{ login.device }}
                          </p>
                          <p class="text-xs text-zinc-500 dark:text-zinc-400">
                            {{ login.location }} • {{ login.ip }}
                          </p>
                          <p
                            class="text-xs text-zinc-400 dark:text-zinc-500 mt-1"
                          >
                            {{ formatDate(login.timestamp) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Avatar Cropper Modal -->
  <UModal v-model:open="showAvatarCropperModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold">Crop Avatar</h3>
        </template>
        <Cropper
          v-if="selectedImage"
          :src="selectedImage"
          :stencil-props="{ aspectRatio: 1 }"
          class="h-96"
          @change="cropAvatar"
        />
        <div class="flex justify-end gap-2 mt-4">
          <UButton variant="ghost" @click="showAvatarCropperModal = false">
            Cancel
          </UButton>
          <UButton :loading="uploadingAvatar" @click="uploadAvatar">
            Upload
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Cover Cropper Modal -->
  <UModal v-model:open="showCoverCropperModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold">Crop Cover Image</h3>
        </template>
        <Cropper
          v-if="selectedImage"
          :src="selectedImage"
          :stencil-props="{ aspectRatio: 21 / 9 }"
          class="h-96"
          @change="cropCover"
        />
        <div class="flex justify-end gap-2 mt-4">
          <UButton variant="ghost" @click="showCoverCropperModal = false">
            Cancel
          </UButton>
          <UButton :loading="uploadingCover" @click="uploadCover">
            Upload
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>

  <!-- Logout Confirmation Dialog -->
  <UModal v-model:open="showLogoutDialog">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Icon -->
              <div
                class="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
              >
                <UIcon
                  name="i-lucide-log-out"
                  class="size-5 text-red-600 dark:text-red-400"
                />
              </div>

              <!-- Title -->
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                Log out
              </h3>
            </div>

            <!-- Close Button -->
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showLogoutDialog = false"
            />
          </div>
        </template>

        <!-- Content -->
        <div class="py-4">
          <p class="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to log out? You will need to sign in again to
            access your account and data.
          </p>
        </div>

        <template #footer>
          <div class="flex gap-3 justify-end">
            <UButton
              variant="outline"
              color="neutral"
              @click="showLogoutDialog = false"
            >
              Cancel
            </UButton>
            <UButton color="error" icon="i-lucide-log-out" @click="logout">
              Log out
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
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
