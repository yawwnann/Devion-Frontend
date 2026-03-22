<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import confetti from "canvas-confetti";
import { format, formatDistanceToNow, isPast } from "date-fns";
import TodoPageHeader from "./TodoPageHeader.vue";
import TodoColumn from "./TodoColumn.vue";
import CropperModal from "./CropperModal.vue";
import type { Todo, TodoWeek, PageSettings, Column } from "./types";

const api = useApi();

// State
const week = ref<TodoWeek | null>(null);
const loading = ref(true);
const newTodoTitle = ref("");
const selectedPriority = ref("MEDIUM");
const addingToColumn = ref<string | null>(null);
const newColumnTaskTitle = ref("");

// Page Settings
const pageSettings = ref<PageSettings>({
  id: "",
  cover: null,
  icon: null,
  title: "Weekly To-do List",
  description: null,
});
const editingTitle = ref(false);
const editingDescription = ref(false);

// Cropper
const showCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const uploadingCover = ref(false);

// Kanban Columns
const columns: Column[] = [
  {
    id: "TODO",
    label: "New task",
    headerClass: "text-zinc-900 dark:text-zinc-100",
    dotClass: "bg-zinc-300 dark:bg-zinc-600",
  },
  {
    id: "SCHEDULED",
    label: "Scheduled",
    headerClass: "text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  {
    id: "IN_PROGRESS",
    label: "In progress",
    headerClass: "text-orange-600 dark:text-orange-400",
    dotClass: "bg-orange-500",
  },
  {
    id: "DONE",
    label: "Completed",
    headerClass: "text-green-600 dark:text-green-400",
    dotClass: "bg-green-500",
  },
];

// Computed
const todosByStatus = computed(() => {
  if (!week.value)
    return { TODO: [], SCHEDULED: [], IN_PROGRESS: [], DONE: [] };

  const w = week.value;
  const grouped: Record<string, Todo[]> = {
    TODO: [],
    SCHEDULED: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  w.todos.forEach((t) => {
    let status = t.status
      ? t.status.toUpperCase()
      : t.isCompleted
        ? "DONE"
        : "TODO";

    if (!grouped[status]) {
      status = "TODO";
    }
    grouped[status]!.push(t);
  });

  Object.keys(grouped).forEach((k) => {
    grouped[k]!.sort((a, b) => a.order - b.order);
  });

  return grouped;
});

const weekRange = computed(() => {
  const w = week.value;
  if (!w) return "";
  const start = new Date(w.weekStart);
  const end = new Date(w.weekEnd);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
});

const completionStats = computed(() => {
  const w = week.value;
  if (!w) return { total: 0, completed: 0, percentage: 0 };
  const allTodos = w.todos;
  if (allTodos.length === 0) return { total: 0, completed: 0, percentage: 0 };

  const completed = allTodos.filter(
    (t) => t.isCompleted || t.status === "DONE",
  ).length;
  const percentage = Math.round((completed / allTodos.length) * 100);
  return { total: allTodos.length, completed, percentage };
});

// Methods
const loadWeek = async () => {
  loading.value = true;
  try {
    const [weekData, settings] = await Promise.all([
      api.get<TodoWeek>("/todos/current-week"),
      api.get<PageSettings>("/todos/settings").catch(() => ({
        id: "",
        cover: null,
        icon: null,
        title: "Weekly To-do List",
        description: null,
      })),
    ]);
    week.value = weekData;
    pageSettings.value = settings;
  } catch (e) {
    console.error("Failed to load week:", e);
  } finally {
    loading.value = false;
  }
};

const addTodo = async () => {
  if (!newTodoTitle.value.trim()) return;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay();
  const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const currentDay = days[dayIndex];

  await api.post("/todos", {
    title: newTodoTitle.value,
    day: currentDay,
    priority: selectedPriority.value,
    status: "TODO",
  });
  newTodoTitle.value = "";
  await loadWeek();
};

const enableAddTask = (columnId: string) => {
  addingToColumn.value = columnId;
  newColumnTaskTitle.value = "";
};

const cancelAddTask = () => {
  addingToColumn.value = null;
  newColumnTaskTitle.value = "";
};

const confirmAddTask = async (columnId: string) => {
  if (!newColumnTaskTitle.value.trim()) {
    cancelAddTask();
    return;
  }

  const title = newColumnTaskTitle.value;
  newColumnTaskTitle.value = "";

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay();
  const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const currentDay = days[dayIndex];

  try {
    await api.post("/todos", {
      title: title,
      day: currentDay,
      priority: "MEDIUM",
      status: columnId,
    });
    await loadWeek();
  } catch (e) {
    console.error("Failed to add task:", e);
  }
};

const updateTodoStatus = async (todo: Todo, newStatus: string) => {
  const oldStatus = todo.status;

  // Optimistic update
  todo.status = newStatus;
  todo.isCompleted = newStatus === "DONE";

  try {
    await api.patch(`/todos/${todo.id}`, {
      status: newStatus,
      isCompleted: newStatus === "DONE",
    });

    // Trigger confetti for completion
    if (newStatus === "DONE" && oldStatus !== "DONE") {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#6ee7b7"],
      });
    }

    // Reorder if needed
    const columnTodos = todosByStatus.value[newStatus];
    if (columnTodos) {
      const todoIds = columnTodos.map((t) => t.id);
      columnTodos.forEach((t, index) => {
        t.order = index;
      });
      await api.post("/todos/reorder", { todoIds });
    }
  } catch (e) {
    console.error("Failed to update todo status:", e);
    // Rollback
    todo.status = oldStatus;
    todo.isCompleted = oldStatus === "DONE";
    await loadWeek();
  }
};

const createNewWeek = async () => {
  await api.post("/todos/new-week", {});
  await loadWeek();
};

const handleTodoReorder = async (todos: Todo[]) => {
  // Get the todo IDs in the new order
  const todoIds = todos.map((t) => t.id);
  try {
    await api.post("/todos/reorder", { todoIds });
  } catch (e) {
    console.error("Failed to reorder todos:", e);
    await loadWeek(); // Revert on error
  }
};

// Cover Image Functions
const handleCoverSelected = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showCropperModal.value = true;
  };
  reader.readAsDataURL(file);
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
      "/todos/settings/cover",
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

const removeCover = async () => {
  try {
    await api.delete("/todos/settings/cover");
    pageSettings.value.cover = null;
  } catch (e) {
    console.error("Failed to remove cover:", e);
  }
};

const updateTitle = async () => {
  editingTitle.value = false;
  try {
    await api.patch("/todos/settings", { title: pageSettings.value.title });
  } catch (e) {
    console.error("Failed to update title:", e);
  }
};

const updateDescription = async () => {
  editingDescription.value = false;
  try {
    await api.patch("/todos/settings", {
      description: pageSettings.value.description,
    });
  } catch (e) {
    console.error("Failed to update description:", e);
  }
};

onMounted(loadWeek);
</script>

<template>
  <UDashboardPanel id="todos">
    <template #header>
      <UDashboardNavbar title="Board">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <div
              class="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5 focus-within:ring-2 ring-primary-500/20 transition-all"
            >
              <input
                v-model="newTodoTitle"
                type="text"
                placeholder="Add new task..."
                class="bg-transparent border-none outline-none text-sm w-48"
                @keyup.enter="addTodo"
              />
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="ghost"
                :disabled="!newTodoTitle.trim()"
                @click="addTodo"
              />
            </div>

            <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-2" />

            <UButton
              icon="i-lucide-calendar-plus"
              variant="outline"
              size="sm"
              @click="createNewWeek"
            >
              New Week
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="h-full flex flex-col overflow-hidden">
        <!-- Page Header -->
        <TodoPageHeader
          :editing-title="editingTitle"
          :editing-description="editingDescription"
          :page-settings="pageSettings"
          @update:editing-title="editingTitle = $event"
          @update:editing-description="editingDescription = $event"
          @update:title="pageSettings.title = $event"
          @update:description="pageSettings.description = $event"
          @save:title="updateTitle"
          @save:description="updateDescription"
          @cover-selected="handleCoverSelected"
          @remove-cover="removeCover"
        />

        <!-- Stats Bar -->
        <div
          class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
        >
          <div class="flex items-center gap-4 text-sm">
            <span class="text-muted">Week:</span>
            <span class="font-medium">{{ weekRange }}</span>
            <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />
            <span class="text-muted">Progress:</span>
            <span class="font-medium"
              >{{ completionStats.completed }}/{{ completionStats.total }} ({{
                completionStats.percentage
              }}%)</span
            >
            <UProgress
              :model-value="completionStats.percentage"
              class="w-24"
              size="sm"
            />
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="flex-1 overflow-x-auto p-4 sm:p-6">
          <div class="flex h-full gap-6 min-w-250">
            <TodoColumn
              v-for="col in columns"
              :key="col.id"
              :column="col"
              :todos="todosByStatus[col.id] || []"
              :adding-to-column="addingToColumn"
              :new-column-task-title="newColumnTaskTitle"
              @enable-add-task="enableAddTask"
              @cancel-add-task="cancelAddTask"
              @confirm-add-task="confirmAddTask"
              @update:todo-status="updateTodoStatus"
              @update:todo-order="handleTodoReorder"
              @update:new-column-task-title="newColumnTaskTitle = $event"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
  <!-- Cropper Modal -->
  <CropperModal
    :show="showCropperModal"
    :selected-image="selectedImage"
    :uploading="uploadingCover"
    @close="
      showCropperModal = false;
      selectedImage = null;
      croppedImage = null;
    "
    @crop="handleCrop"
    @upload="uploadCroppedCover"
  />
</template>
