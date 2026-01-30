<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const api = useApi();
const toast = useToast();

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  eventType: string;
  projectId?: string | null;
  todoId?: string | null;
  githubIssueId?: string | null;
}

interface PageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

const events = ref<CalendarEvent[]>([]);
const loading = ref(true);
const showEventModal = ref(false);
const selectedEvent = ref<CalendarEvent | null>(null);
const calendarRef = ref();

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

// Filter state
const filterType = ref("");
const searchQuery = ref("");

// Debounced search untuk performa lebih baik
const debouncedSearch = ref("");
let searchTimeout: NodeJS.Timeout;

watch(searchQuery, (newValue) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newValue;
  }, 300); // 300ms delay
});

const eventForm = ref({
  title: "",
  description: "",
  startDate: "",
  endDate: "",
  allDay: false,
  color: "#10b981",
  eventType: "custom",
});

const eventTypeOptions = [
  { label: "Custom Event", value: "custom", icon: "i-lucide-calendar" },
  { label: "Project", value: "project", icon: "i-lucide-folder" },
  { label: "Todo", value: "todo", icon: "i-lucide-check-square" },
  { label: "GitHub Issue", value: "github", icon: "i-lucide-github" },
];

const colorOptions = [
  { label: "Emerald", value: "#10b981" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Pink", value: "#ec4899" },
];

// Computed - Filtered Events (menggunakan debounced search)
const filteredEvents = computed(() => {
  let result = events.value;

  if (debouncedSearch.value) {
    const query = debouncedSearch.value.toLowerCase();
    result = result.filter(
      (e) =>
        e.title.toLowerCase().includes(query) ||
        e.description.toLowerCase().includes(query),
    );
  }

  if (filterType.value) {
    result = result.filter((e) => e.eventType === filterType.value);
  }

  return result;
});

// Computed - Stats (memoized)
const stats = computed(() => {
  const total = events.value.length;
  const now = new Date();
  let upcoming = 0;
  let past = 0;
  let today = 0;

  // Single loop untuk efisiensi
  events.value.forEach((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);

    if (start <= now && end >= now) {
      today++;
    } else if (start > now) {
      upcoming++;
    } else if (end < now) {
      past++;
    }
  });

  return { total, upcoming, past, today };
});

const loadEvents = async () => {
  loading.value = true;
  try {
    const response = await api.get<CalendarEvent[]>("/calendar");
    events.value = response as CalendarEvent[];
  } catch (error) {
    console.error("Failed to load events:", error);
    toast.add({
      title: "Error",
      description: "Failed to load calendar events",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};

const handleDateClick = (date: Date) => {
  const dateStr = date.toISOString().split("T")[0] ?? "";
  eventForm.value = {
    title: "",
    description: "",
    startDate: dateStr,
    endDate: dateStr,
    allDay: true,
    color: "#10b981",
    eventType: "custom",
  };
  selectedEvent.value = null;
  showEventModal.value = true;
};

const handleEventClick = (event: CalendarEvent) => {
  selectedEvent.value = event;
  // Convert ISO dates to YYYY-MM-DD format for date inputs
  const startDateFormatted = event.startDate
    ? event.startDate.substring(0, 10)
    : "";
  const endDateFormatted = event.endDate ? event.endDate.substring(0, 10) : "";

  eventForm.value = {
    title: event.title,
    description: event.description,
    startDate: startDateFormatted,
    endDate: endDateFormatted,
    allDay: event.allDay,
    color: event.color,
    eventType: event.eventType,
  };
  showEventModal.value = true;
};

const saveEvent = async () => {
  try {
    if (selectedEvent.value) {
      await api.patch(`/calendar/${selectedEvent.value.id}`, eventForm.value);
      toast.add({
        title: "Success",
        description: "Event updated successfully",
        color: "success",
      });
    } else {
      await api.post("/calendar", eventForm.value);
      toast.add({
        title: "Success",
        description: "Event created successfully",
        color: "success",
      });
    }
    showEventModal.value = false;
    await loadEvents();
  } catch (error) {
    console.error("Failed to save event:", error);
    toast.add({
      title: "Error",
      description: "Failed to save event",
      color: "error",
    });
  }
};

const deleteEvent = async () => {
  if (!selectedEvent.value) return;
  if (!confirm("Delete this event?")) return;

  try {
    await api.delete(`/calendar/${selectedEvent.value.id}`);
    toast.add({
      title: "Success",
      description: "Event deleted successfully",
      color: "success",
    });
    showEventModal.value = false;
    await loadEvents();
  } catch (error) {
    console.error("Failed to delete event:", error);
    toast.add({
      title: "Error",
      description: "Failed to delete event",
      color: "error",
    });
  }
};

const syncProjects = async () => {
  try {
    await api.get("/calendar/sync/projects");
    await loadEvents();
    toast.add({
      title: "Success",
      description: "Projects synced to calendar",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to sync projects:", error);
    toast.add({
      title: "Error",
      description: "Failed to sync projects",
      color: "error",
    });
  }
};

const syncTodos = async () => {
  try {
    await api.get("/calendar/sync/todos");
    await loadEvents();
    toast.add({
      title: "Success",
      description: "Todos synced to calendar",
      color: "success",
    });
  } catch (error) {
    console.error("Failed to sync todos:", error);
    toast.add({
      title: "Error",
      description: "Failed to sync todos",
      color: "error",
    });
  }
};

const getEventTypeIcon = (type: string) => {
  const option = eventTypeOptions.find((opt) => opt.value === type);
  return option?.icon || "i-lucide-calendar";
};

// Cover image functions
const selectCoverImage = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showCropperModal.value = true;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const handleCrop = ({ canvas }: { canvas: HTMLCanvasElement }) => {
  const targetWidth = 1248;
  const targetHeight = 208;
  const targetCanvas = document.createElement("canvas");
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;

  const ctx = targetCanvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    targetCanvas.toBlob(
      (blob: Blob | null) => {
        if (blob) {
          croppedImage.value = blob;
        }
      },
      "image/jpeg",
      0.9,
    );
  }
};

const uploadCroppedCover = async () => {
  if (!croppedImage.value) return;
  uploadingCover.value = true;
  try {
    const formData = new FormData();
    formData.append("file", croppedImage.value, "cover.jpg");
    const result = await api.upload<PageSettings>(
      "/calendar/settings/cover",
      formData,
    );
    pageSettings.value = result;
    showCropperModal.value = false;
    selectedImage.value = null;
    croppedImage.value = null;
  } catch (e) {
    console.error("Failed to upload cover:", e);
  } finally {
    uploadingCover.value = false;
  }
};

const cancelCrop = () => {
  showCropperModal.value = false;
  selectedImage.value = null;
  croppedImage.value = null;
};

const removeCover = async () => {
  try {
    await api.delete("/calendar/settings/cover");
    pageSettings.value.cover = null;
  } catch (e) {
    console.error("Failed to remove cover:", e);
  }
};

const updateTitle = async () => {
  editingTitle.value = false;
  try {
    await api.patch("/calendar/settings", { title: pageSettings.value.title });
  } catch (e) {
    console.error("Failed to update title:", e);
  }
};

const updateDescription = async () => {
  editingDescription.value = false;
  try {
    await api.patch("/calendar/settings", {
      description: pageSettings.value.description,
    });
  } catch (e) {
    console.error("Failed to update description:", e);
  }
};

const clearFilters = () => {
  searchQuery.value = "";
  filterType.value = "";
};

onMounted(async () => {
  await loadEvents();
});

interface EventForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  eventType: string;
}

// Helper function to open new event modal
const openNewEventModal = () => {
  eventForm.value = {
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0] || "",
    endDate: new Date().toISOString().split("T")[0] || "",
    allDay: false,
    color: "#10b981",
    eventType: "custom",
  };
  selectedEvent.value = null;
  showEventModal.value = true;
};
</script>

<!-- eslint-disable vue/no-parsing-error -->
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
      <div class="overflow-y-auto h-full">
        <!-- Stats Cards -->
        <div class="px-6 py-5 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Total Events
                </span>
                <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <UIcon
                    name="i-lucide-calendar"
                    class="size-4 text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-zinc-900 dark:text-white">
                {{ stats.total }}
              </div>
            </div>

            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Today
                </span>
                <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <UIcon
                    name="i-lucide-calendar-check"
                    class="size-4 text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-zinc-900 dark:text-white">
                {{ stats.today }}
              </div>
            </div>

            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/50 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-emerald-600 uppercase tracking-wider"
                >
                  Upcoming
                </span>
                <div
                  class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"
                >
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-emerald-600"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-emerald-600">
                {{ stats.upcoming }}
              </div>
            </div>

            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                >
                  Past
                </span>
                <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <UIcon
                    name="i-lucide-check-circle-2"
                    class="size-4 text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-zinc-900 dark:text-white">
                {{ stats.past }}
              </div>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div
          class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 shadow-sm"
        >
          <div
            class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
          >
            <!-- Search -->
            <div
              class="flex-1 relative border border-zinc-200 dark:border-zinc-800 rounded-lg"
            >
              <UIcon
                name="i-lucide-search"
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search events..."
                class="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm"
              />
            </div>

            <!-- Filter by Type -->
            <select
              v-model="filterType"
              class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 transition text-sm min-w-[140px]"
            >
              <option value="">All Types</option>
              <option
                v-for="type in eventTypeOptions"
                :key="type.value"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>

            <!-- Clear Filters -->
            <UButton
              v-if="searchQuery || filterType"
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              @click="clearFilters"
            >
              Clear
            </UButton>

            <div
              class="hidden sm:block h-6 w-px bg-zinc-200 dark:bg-zinc-800"
            />

            <!-- Sync Actions -->
            <div class="flex items-center gap-2">
              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-folder"
                @click="syncProjects"
              >
                <span class="hidden lg:inline">Sync Projects</span>
                <span class="lg:hidden">Projects</span>
              </UButton>

              <UButton
                variant="ghost"
                size="sm"
                icon="i-lucide-check-square"
                @click="syncTodos"
              >
                <span class="hidden lg:inline">Sync Todos</span>
                <span class="lg:hidden">Todos</span>
              </UButton>

              <UButton
                color="primary"
                size="sm"
                icon="i-lucide-plus"
                @click="openNewEventModal"
              >
                New Event
              </UButton>
            </div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="px-6 pb-6 mt-3">
          <div v-if="loading" class="space-y-2">
            <USkeleton v-for="i in 8" :key="i" class="h-14 rounded-lg" />
          </div>

          <!-- Custom Calendar - Always show -->
          <div
            v-else
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <CustomCalendar
              :events="events"
              @event-click="handleEventClick"
              @date-click="handleDateClick"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Event Modal -->
  <UModal v-model:open="showEventModal">
    <template #content>
      <div class="p-6 w-full mx-auto rounded-xl">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600"
            >
              <UIcon
                :name="
                  selectedEvent ? 'i-lucide-pencil' : 'i-lucide-calendar-plus'
                "
                class="size-5 text-white"
              />
            </div>
            <h3 class="text-xl font-semibold text-zinc-900 dark:text-white">
              {{ selectedEvent ? "Edit Event" : "New Event" }}
            </h3>
          </div>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
            @click="showEventModal = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <label
              class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2.5"
            >
              Event Title <span class="text-red-500">*</span>
            </label>
            <input
              v-model="eventForm.title"
              type="text"
              placeholder="Enter event title"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label
              class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2.5"
            >
              Description
              <span class="text-xs text-zinc-400 font-normal">(Optional)</span>
            </label>
            <textarea
              v-model="eventForm.description"
              placeholder="Add event description..."
              rows="3"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Start Date
              </label>
              <input
                v-model="eventForm.startDate"
                type="date"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
            <div>
              <label
                class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                End Date
              </label>
              <input
                v-model="eventForm.endDate"
                type="date"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Event Type
              </label>
              <select
                v-model="eventForm.eventType"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option
                  v-for="type in eventTypeOptions"
                  :key="type.value"
                  :value="type.value"
                >
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div>
              <label
                class="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Color
              </label>
              <select
                v-model="eventForm.color"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option
                  v-for="color in colorOptions"
                  :key="color.value"
                  :value="color.value"
                >
                  {{ color.label }}
                </option>
              </select>
            </div>
          </div>

          <div
            class="flex items-center justify-between px-4 py-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800 dark:to-zinc-800/50 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 shadow-sm"
              >
                <UIcon
                  name="i-lucide-clock"
                  class="size-5 text-zinc-600 dark:text-zinc-400"
                />
              </div>
              <label
                class="text-sm font-semibold text-zinc-900 dark:text-white cursor-pointer"
              >
                All Day Event
              </label>
            </div>
            <input
              v-model="eventForm.allDay"
              type="checkbox"
              class="w-11 h-6 bg-zinc-200 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
            />
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-between gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            v-if="selectedEvent"
            type="button"
            class="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
            @click="deleteEvent"
          >
            Delete Event
          </button>
          <div v-else />
          <div class="flex gap-3">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              @click="showEventModal = false"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="!eventForm.title"
              class="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
              @click="saveEvent"
            >
              {{ selectedEvent ? "Update" : "Create" }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Image Cropper Modal -->
  <UModal v-model:open="showCropperModal">
    <template #content>
      <div
        class="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-xl overflow-hidden"
      >
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/25"
              >
                <UIcon name="i-lucide-crop" class="size-5 text-white" />
              </div>
              <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                Crop Cover Image
              </h3>
            </div>
            <button
              class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
              @click="cancelCrop"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
        </div>

        <div class="p-4 bg-zinc-50 dark:bg-zinc-900/50">
          <ClientOnly>
            <Cropper
              v-if="selectedImage"
              :src="selectedImage"
              :stencil-props="{ aspectRatio: 6 / 1 }"
              class="h-80 rounded-lg overflow-hidden"
              @change="handleCrop"
            />
          </ClientOnly>
        </div>

        <div
          class="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3"
        >
          <button
            :disabled="uploadingCover"
            class="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
            @click="cancelCrop"
          >
            Cancel
          </button>
          <button
            :disabled="!croppedImage || uploadingCover"
            class="px-6 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
            @click="uploadCroppedCover"
          >
            <UIcon
              v-if="uploadingCover"
              name="i-lucide-loader-2"
              class="size-4 animate-spin"
            />
            {{ uploadingCover ? "Uploading..." : "Upload" }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
