<script setup lang="ts">
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

const pageSettings = ref({
  title: "Calendar",
  description: null,
});

const editingTitle = ref(false);
const editingDescription = ref(false);

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
      <div class="flex flex-col min-h-full overflow-y-auto">
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
        <div class="px-6 pb-6 mt-3">
          <div v-if="loading" class="space-y-2">
            <USkeleton v-for="i in 8" :key="i" class="h-14 rounded-lg" />
          </div>

          <div
            v-else
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
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
</template>
