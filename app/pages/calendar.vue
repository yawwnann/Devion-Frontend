<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const {
  events,
  loading,
  showEventModal,
  selectedEvent,
  filterType,
  searchQuery,
  eventForm,
  filteredEvents,
  stats,
  fetchEvents,
  deleteEvent,
  syncProjects,
  syncTodos,
  openNewEventModal,
  openEditEventModal,
  saveEvent,
} = useCalendar();

const api = useApi();
const toast = useToast();

interface PageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

const pageSettings = ref<PageSettings>({
  id: "",
  cover: null,
  icon: null,
  title: "Calendar",
  description: null,
});

const editingTitle = ref(false);
const editingDescription = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);

// Image Cropper
const showCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const uploadingCover = ref(false);

// Cover Image Handlers
const triggerCoverUpload = () => {
  coverInput.value?.click();
};

const handleCoverSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedImage.value = e.target?.result as string;
      showCropperModal.value = true;
    };
    reader.readAsDataURL(file);
  }
};

const handleCrop = ({ canvas }: any) => {
  canvas.toBlob((blob: Blob) => {
    croppedImage.value = blob;
  });
};

const uploadCover = async () => {
  if (!croppedImage.value) return;

  uploadingCover.value = true;
  const formData = new FormData();
  formData.append("cover", croppedImage.value, "cover.jpg");

  try {
    const response = await api.post<PageSettings>(
      "/pages/calendar/cover",
      formData,
    );
    pageSettings.value.cover = response.cover;
    showCropperModal.value = false;
    toast.add({
      title: "Success",
      description: "Cover updated successfully",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to upload cover",
      color: "error",
    });
  } finally {
    uploadingCover.value = false;
  }
};

const removeCover = async () => {
  try {
    await api.delete("/pages/calendar/cover");
    pageSettings.value.cover = null;
    toast.add({
      title: "Success",
      description: "Cover removed successfully",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to remove cover",
      color: "error",
    });
  }
};

const updateTitle = async () => {
  try {
    await api.patch("/pages/calendar", { title: pageSettings.value.title });
    editingTitle.value = false;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to update title",
      color: "error",
    });
  }
};

const updateDescription = async () => {
  try {
    await api.patch("/pages/calendar", {
      description: pageSettings.value.description,
    });
    editingDescription.value = false;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to update description",
      color: "error",
    });
  }
};

const handleEventClick = (event: any) => {
  openEditEventModal(event);
};

const handleDateClick = (date: Date) => {
  const dateStr = date.toISOString().split("T")[0]!;
  eventForm.value = {
    title: "",
    description: "",
    startDate: dateStr,
    endDate: dateStr,
    allDay: false,
    color: "#10b981",
    eventType: "custom",
  };
  selectedEvent.value = null;
  showEventModal.value = true;
};

onMounted(() => {
  fetchEvents();
});
</script>

<template>
  <UDashboardPanel id="calendar">
    <template #header>
      <UDashboardNavbar title="Calendar">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full overflow-hidden">
        <!-- Cover Image -->
        <div
          class="relative h-48 bg-gradient-to-br from-emerald-500 to-emerald-600 group"
        >
          <img
            v-if="pageSettings.cover"
            :src="pageSettings.cover"
            alt="Cover"
            class="w-full h-full object-cover"
          />
          <div
            class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          >
            <button
              class="px-4 py-2 bg-white/90 hover:bg-white text-zinc-900 rounded-lg font-medium transition"
              @click="triggerCoverUpload"
            >
              Change Cover
            </button>
            <button
              v-if="pageSettings.cover"
              class="px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white rounded-lg font-medium transition"
              @click="removeCover"
            >
              Remove
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

        <!-- Page Header -->
        <div
          class="px-6 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <div v-if="!editingTitle" class="flex items-center gap-3 group">
            <h1 class="text-3xl font-bold text-zinc-900 dark:text-white">
              {{ pageSettings.title }}
            </h1>
            <button
              class="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
              @click="editingTitle = true"
            >
              <UIcon name="i-lucide-pencil" class="size-4 text-zinc-500" />
            </button>
          </div>
          <input
            v-else
            v-model="pageSettings.title"
            type="text"
            class="text-3xl font-bold bg-transparent border-b-2 border-emerald-500 outline-none"
            @blur="updateTitle"
            @keyup.enter="updateTitle"
          />

          <div
            v-if="!editingDescription"
            class="flex items-center gap-3 group mt-2"
          >
            <p class="text-zinc-600 dark:text-zinc-400">
              {{ pageSettings.description || "Add a description..." }}
            </p>
            <button
              class="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
              @click="editingDescription = true"
            >
              <UIcon name="i-lucide-pencil" class="size-4 text-zinc-500" />
            </button>
          </div>
          <input
            v-else
            v-model="pageSettings.description"
            type="text"
            class="w-full mt-2 bg-transparent border-b-2 border-emerald-500 outline-none text-zinc-600 dark:text-zinc-400"
            @blur="updateDescription"
            @keyup.enter="updateDescription"
          />
        </div>

        <!-- Stats -->
        <CalendarStats :stats="stats" />

        <!-- Toolbar -->
        <CalendarToolbar
          v-model:search-query="searchQuery"
          v-model:filter-type="filterType"
          @sync-projects="syncProjects"
          @sync-todos="syncTodos"
          @new-event="openNewEventModal"
        />

        <!-- Calendar -->
        <div class="px-6 pb-6 mt-3 flex-1 overflow-auto">
          <div v-if="loading" class="space-y-2">
            <USkeleton v-for="i in 8" :key="i" class="h-14 rounded-lg" />
          </div>

          <div
            v-else
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <CustomCalendar
              :events="filteredEvents"
              @event-click="handleEventClick"
              @date-click="handleDateClick"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Event Modal -->
  <EventModal
    v-model="showEventModal"
    :event-form="eventForm"
    :is-editing="!!selectedEvent"
    @save="saveEvent"
    @delete="deleteEvent"
  />

  <!-- Cropper Modal -->
  <UModal v-model:open="showCropperModal">
    <template #content>
      <div class="p-6">
        <h2 class="text-xl font-bold mb-4">Crop Cover Image</h2>
        <Cropper
          v-if="selectedImage"
          :src="selectedImage"
          :stencil-props="{ aspectRatio: 16 / 9 }"
          @change="handleCrop"
        />
        <div class="flex justify-end gap-3 mt-4">
          <UButton variant="ghost" @click="showCropperModal = false">
            Cancel
          </UButton>
          <UButton :loading="uploadingCover" @click="uploadCover">
            Upload
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
