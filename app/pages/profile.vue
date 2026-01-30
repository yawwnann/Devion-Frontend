<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const api = useApi();
const { user, logout, fetchUser } = useAuth();

// Stats
const stats = ref({ projects: 0, todos: 0, pages: 0 });
const loadingStats = ref(true);

// Edit states
const editingProfile = ref(false);
const editingPassword = ref(false);
const uploadingAvatar = ref(false);
const uploadingCover = ref(false);

// Image cropper
const showAvatarCropperModal = ref(false);
const showCoverCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);

// Forms
const profileForm = ref({
  name: "",
  bio: "",
  githubUsername: "",
});

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  try {
    await api.post("/auth/change-password", {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    });
    editingPassword.value = false;
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };
  } catch (e) {
    console.error("Failed to change password:", e);
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
  if (!user.value) {
    await fetchUser();
  }
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

          <!-- Security Section -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-shield-check" class="size-5" />
                <h3 class="font-semibold">Security</h3>
              </div>
            </template>

            <div v-if="!editingPassword" class="space-y-4">
              <div
                class="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <p class="font-medium text-sm">Password</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
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
                  @click="editingPassword = true"
                >
                  Change
                </UButton>
              </div>

              <div
                class="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <p class="font-medium text-sm text-red-600">Log Out</p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Sign out from your account
                  </p>
                </div>
                <UButton
                  variant="ghost"
                  color="error"
                  size="sm"
                  icon="i-lucide-log-out"
                  @click="logout"
                >
                  Log Out
                </UButton>
              </div>
            </div>

            <!-- Change Password Form -->
            <div v-else>
              <div class="flex justify-between mb-4">
                <UInput
                  v-model="passwordForm.currentPassword"
                  type="password"
                  placeholder="Current password"
                  label="Current Password"
                  size="lg"
                />
                <UInput
                  v-model="passwordForm.newPassword"
                  type="password"
                  placeholder="New password"
                  label="New Password"
                  size="lg"
                />
                <UInput
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  label="Confirm Password"
                  size="lg"
                />
              </div>
              <div class="flex gap-2 pt-2">
                <UButton size="sm" @click="changePassword">
                  Update Password
                </UButton>
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="
                    editingPassword = false;
                    passwordForm = {
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    };
                  "
                >
                  Cancel
                </UButton>
              </div>
            </div>
          </UCard>
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
</template>
