import type {
  CalendarEvent,
  EventFormData,
  CalendarStats,
} from "~/types/calendar";

export const useCalendar = () => {
  const api = useApi();
  const toast = useToast();

  const events = ref<CalendarEvent[]>([]);
  const loading = ref(true);
  const showEventModal = ref(false);
  const selectedEvent = ref<CalendarEvent | null>(null);

  const filterType = ref("");
  const searchQuery = ref("");
  const debouncedSearch = ref("");

  let searchTimeout: NodeJS.Timeout;

  // Debounced search
  watch(searchQuery, (newValue) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      debouncedSearch.value = newValue;
    }, 300);
  });

  const eventForm = ref<EventFormData>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    allDay: false,
    color: "#10b981",
    eventType: "custom",
  });

  // Filtered Events
  const filteredEvents = computed(() => {
    let result = events.value;

    if (debouncedSearch.value) {
      const query = debouncedSearch.value.toLowerCase();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query),
      );
    }

    if (filterType.value) {
      result = result.filter((event) => event.eventType === filterType.value);
    }

    return result;
  });

  // Stats
  const stats = computed<CalendarStats>(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0]!;

    let total = 0;
    let todayCount = 0;
    let upcoming = 0;
    let past = 0;

    for (const event of events.value) {
      total++;
      const eventDate = event.startDate?.split("T")[0];

      if (eventDate && eventDate === today) {
        todayCount++;
      } else if (eventDate && eventDate > today) {
        upcoming++;
      } else if (eventDate && eventDate < today) {
        past++;
      }
    }

    return { total, today: todayCount, upcoming, past };
  });

  // Fetch Events
  const fetchEvents = async () => {
    try {
      loading.value = true;
      const response = await api.get<CalendarEvent[]>("/calendar");
      events.value = response;
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to load events",
        color: "error",
      });
    } finally {
      loading.value = false;
    }
  };

  // Create Event
  const createEvent = async () => {
    try {
      const response = await api.post<CalendarEvent>(
        "/calendar",
        eventForm.value,
      );
      events.value.push(response);
      showEventModal.value = false;
      resetForm();
      toast.add({
        title: "Success",
        description: "Event created successfully",
        color: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to create event",
        color: "error",
      });
    }
  };

  // Update Event
  const updateEvent = async () => {
    if (!selectedEvent.value) return;

    try {
      const response = await api.patch<CalendarEvent>(
        `/calendar/${selectedEvent.value.id}`,
        eventForm.value,
      );
      const index = events.value.findIndex(
        (e) => e.id === selectedEvent.value!.id,
      );
      if (index !== -1) {
        events.value[index] = response;
      }
      showEventModal.value = false;
      resetForm();
      toast.add({
        title: "Success",
        description: "Event updated successfully",
        color: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to update event",
        color: "error",
      });
    }
  };

  // Delete Event
  const deleteEvent = async () => {
    if (!selectedEvent.value) return;

    try {
      await api.delete(`/calendar/${selectedEvent.value.id}`);
      events.value = events.value.filter(
        (e) => e.id !== selectedEvent.value!.id,
      );
      showEventModal.value = false;
      resetForm();
      toast.add({
        title: "Success",
        description: "Event deleted successfully",
        color: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to delete event",
        color: "error",
      });
    }
  };

  // Sync Projects
  const syncProjects = async () => {
    try {
      await api.get("/calendar/sync/projects");
      await fetchEvents();
      toast.add({
        title: "Success",
        description: "Projects synced successfully",
        color: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to sync projects",
        color: "error",
      });
    }
  };

  // Sync Todos
  const syncTodos = async () => {
    try {
      await api.get("/calendar/sync/todos");
      await fetchEvents();
      toast.add({
        title: "Success",
        description: "Todos synced successfully",
        color: "success",
      });
    } catch (error) {
      toast.add({
        title: "Error",
        description: "Failed to sync todos",
        color: "error",
      });
    }
  };

  // Open New Event Modal
  const openNewEventModal = () => {
    resetForm();
    selectedEvent.value = null;
    showEventModal.value = true;
  };

  // Open Edit Event Modal
  const openEditEventModal = (event: CalendarEvent) => {
    selectedEvent.value = event;
    eventForm.value = {
      title: event.title,
      description: event.description,
      startDate: event.startDate ? event.startDate.substring(0, 10) : "",
      endDate: event.endDate ? event.endDate.substring(0, 10) : "",
      allDay: event.allDay,
      color: event.color,
      eventType: event.eventType,
    };
    showEventModal.value = true;
  };

  // Reset Form
  const resetForm = () => {
    eventForm.value = {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      allDay: false,
      color: "#10b981",
      eventType: "custom",
    };
    selectedEvent.value = null;
  };

  // Save Event (Create or Update)
  const saveEvent = async () => {
    if (selectedEvent.value) {
      await updateEvent();
    } else {
      await createEvent();
    }
  };

  return {
    // State
    events,
    loading,
    showEventModal,
    selectedEvent,
    filterType,
    searchQuery,
    debouncedSearch,
    eventForm,

    // Computed
    filteredEvents,
    stats,

    // Methods
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    syncProjects,
    syncTodos,
    openNewEventModal,
    openEditEventModal,
    resetForm,
    saveEvent,
  };
};
