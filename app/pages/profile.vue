<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import ProfileTabs from "~/components/profile/ProfileTabs.vue";
import OverviewTab from "~/components/profile/OverviewTab.vue";
import ActivityTab from "~/components/profile/ActivityTab.vue";
import BadgesTab from "~/components/profile/BadgesTab.vue";

const api = useApi();
const { user, logout, fetchUser } = useAuth();

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
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const avatarInput = ref<HTMLInputElement | null>(null);
const coverInput = ref<HTMLInputElement | null>(null);

// Active tab
const activeTab = ref('overview');

// Forms
const profileForm = ref({
  name: "",
  bio: "",
  githubUsername: "",
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const loadStats = async () => {
  try {
    const data: any = await api.get("/auth/statistics");
    stats.value = data;
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
  await fetchUser();
  await loadStats();
});
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <AppNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div class="overflow-y-auto h-full bg-zinc-50 dark:bg-zinc-900">
        <!-- Hero Section with Cover & Avatar -->
        <div class="relative">
          <!-- Cover Image -->
          <div class="relative h-48 md:h-56 group">
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
          <div class="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
            <UCard class="overflow-visible">
              <div class="flex flex-col md:flex-row gap-6 items-start">
                <!-- Avatar Section -->
                <div class="relative group shrink-0 -mt-16 md:-mt-20">
                  <div class="relative">
                    <UAvatar
                      :src="user?.avatar || undefined"
                      :alt="user?.name || 'User'"
                      size="2xl"
                      class="ring-4 ring-white dark:ring-zinc-900 size-24 md:size-32"
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
                <div class="flex-1 min-w-0 pt-2">
                  <div v-if="!editingProfile" class="space-y-3">
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <h1 class="text-xl md:text-2xl font-bold truncate">
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
                        size="md"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2">Bio</label>
                      <UTextarea
                        v-model="profileForm.bio"
                        placeholder="Write a short bio about yourself"
                        :rows="3"
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
                        size="md"
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

        <!-- Content Area with Tabs -->
        <div class="max-w-5xl mx-auto px-6 py-6">
          <!-- Tab Navigation -->
          <ProfileTabs v-model="activeTab" />

          <!-- Tab Content -->
          <component
            :is="activeTab === 'overview' ? OverviewTab : activeTab === 'activity' ? ActivityTab : BadgesTab"
            :stats="stats"
            :loading-stats="loadingStats"
          />
        </div>
      </div>

      <!-- Avatar Cropper Modal -->
      <UModal v-model:open="showAvatarCropperModal" :ui="{ content: 'sm:max-w-2xl' }">
        <template #content>
          <div class="p-6">
            <h3 class="font-semibold text-lg mb-4">Crop Avatar</h3>
            <div class="h-80 mb-4">
              <Cropper
                v-if="selectedImage"
                :src="selectedImage"
                :stencil-props="{ aspectRatio: 1 }"
                class="h-full w-full"
                @change="cropAvatar"
              />
            </div>
            <div class="flex gap-2 justify-end">
              <UButton variant="ghost" @click="showAvatarCropperModal = false">
                Cancel
              </UButton>
              <UButton @click="uploadAvatar" :loading="uploadingAvatar">
                Upload
              </UButton>
            </div>
          </div>
        </template>
      </UModal>

      <!-- Cover Cropper Modal -->
      <UModal v-model:open="showCoverCropperModal" :ui="{ content: 'sm:max-w-2xl' }">
        <template #content>
          <div class="p-6">
            <h3 class="font-semibold text-lg mb-4">Crop Cover Image</h3>
            <div class="h-80 mb-4">
              <Cropper
                v-if="selectedImage"
                :src="selectedImage"
                :stencil-props="{ aspectRatio: 16 / 9 }"
                class="h-full w-full"
                @change="cropCover"
              />
            </div>
            <div class="flex gap-2 justify-end">
              <UButton variant="ghost" @click="showCoverCropperModal = false">
                Cancel
              </UButton>
              <UButton @click="uploadCover" :loading="uploadingCover">
                Upload
              </UButton>
            </div>
          </div>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
