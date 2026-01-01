<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import draggable from "vuedraggable";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const api = useApi();

interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  day: string;
  order: number;
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  githubRepoName?: string | null;
  githubLabels?: string | null;
  lastSyncedAt?: string | null;
}

interface TodoWeek {
  id: string;
  weekStart: string;
  weekEnd: string;
  todos: Todo[];
}

interface PageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

const week = ref<TodoWeek | null>(null);
const loading = ref(true);
const newTodoTitle = ref("");
const selectedDay = ref("Mon");
const pageSettings = ref<PageSettings>({
  id: "",
  cover: null,
  icon: null,
  title: "Weekly To-do List",
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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

const todosByDay = computed(() => {
  if (!week.value) return {};
  const grouped: Record<string, Todo[]> = {};
  days.forEach((day) => {
    grouped[day] = week.value!.todos.filter((t) => t.day === day);
  });
  return grouped;
});

const weekRange = computed(() => {
  if (!week.value) return "";
  const start = new Date(week.value.weekStart);
  const end = new Date(week.value.weekEnd);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
});

const addTodo = async () => {
  if (!newTodoTitle.value.trim()) return;
  await api.post("/todos", {
    title: newTodoTitle.value,
    day: selectedDay.value,
  });
  newTodoTitle.value = "";
  await loadWeek();
};

const toggleTodo = async (todo: Todo) => {
  await api.patch(`/todos/${todo.id}`, {
    isCompleted: !todo.isCompleted,
  });
  await loadWeek();
};

const deleteTodo = async (todoId: string) => {
  await api.delete(`/todos/${todoId}`);
  await loadWeek();
};

const createNewWeek = async () => {
  await api.post("/todos/new-week", {});
  await loadWeek();
};

const onDragEnd = async (day: string) => {
  const todos = todosByDay.value[day];
  const todoIds = todos?.map((t) => t.id) || [];
  try {
    await api.post("/todos/reorder", { day, todoIds });
  } catch (e) {
    console.error("Failed to reorder todos:", e);
    await loadWeek(); // Reload on error
  }
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
      0.9
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
      formData
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
      <UDashboardNavbar title="Todos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="overflow-y-auto h-full">
        <!-- Cover Image -->
        <div class="relative group">
          <div
            v-if="pageSettings.cover"
            class="h-32 sm:h-52 w-full bg-cover bg-center"
            :style="{ backgroundImage: `url(${pageSettings.cover})` }"
          >
            <div class="absolute inset-0 bg-black/30" />
          </div>
          <div
            v-else
            class="h-32 sm:h-52 w-full bg-linear-to-br from-blue-600 via-blue-700 to-blue-900"
          />

          <div
            class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md backdrop-blur-sm transition"
              @click="coverInput?.click()"
            >
              {{ pageSettings.cover ? "Change cover" : "Add cover" }}
            </button>
            <button
              v-if="pageSettings.cover"
              class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md backdrop-blur-sm transition"
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
            @change="selectCoverImage"
          />
        </div>

        <!-- Header -->
        <div class="px-4 sm:px-8 py-4 sm:py-6">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4"
          >
            <div class="flex-1">
              <input
                v-if="editingTitle"
                v-model="pageSettings.title"
                class="text-2xl sm:text-4xl font-bold bg-transparent border-none outline-none w-full"
                autofocus
                @blur="updateTitle"
                @keyup.enter="updateTitle"
              />
              <h1
                v-else
                class="text-2xl sm:text-4xl font-bold cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2 py-1 transition"
                @click="editingTitle = true"
              >
                {{ pageSettings.title }}
              </h1>
              <p v-if="weekRange" class="text-muted mt-2 text-sm sm:text-base">
                {{ weekRange }}
              </p>
            </div>
            <UButton
              icon="i-lucide-calendar-plus"
              variant="outline"
              size="sm"
              class="w-full sm:w-auto"
              @click="createNewWeek"
            >
              New Week
            </UButton>
          </div>

          <div
            v-if="editingDescription || pageSettings.description"
            class="mb-4"
          >
            <textarea
              v-if="editingDescription"
              v-model="pageSettings.description"
              placeholder="Add a description..."
              class="w-full bg-transparent border-none outline-none text-muted resize-none text-base"
              rows="2"
              autofocus
              @blur="updateDescription"
            />
            <p
              v-else
              class="text-sm text-muted cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2 py-1 transition"
              @click="editingDescription = true"
            >
              {{ pageSettings.description }}
            </p>
          </div>

          <p
            v-if="!editingDescription && !pageSettings.description"
            class="text-sm text-muted cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2 py-1 transition mb-6"
            @click="editingDescription = true"
          >
            Add a description...
          </p>
        </div>

        <!-- Add Todo -->
        <div class="px-4 sm:px-8 pb-4">
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              v-model="selectedDay"
              class="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-auto"
            >
              <option v-for="day in days" :key="day" :value="day">
                {{ day }}
              </option>
            </select>
            <div class="flex gap-2 flex-1">
              <input
                v-model="newTodoTitle"
                type="text"
                placeholder="Add a new to-do..."
                class="flex-1 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                @keyup.enter="addTodo"
              />
              <UButton icon="i-lucide-plus" color="primary" @click="addTodo">
                <span class="hidden sm:inline">Add</span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="px-4 sm:px-8 pb-8">
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4"
          >
            <USkeleton v-for="i in 7" :key="i" class="h-48 sm:h-64" />
          </div>
        </div>

        <!-- Todo Grid -->
        <div v-else class="px-4 sm:px-8 pb-8">
          <div
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4"
          >
            <div v-for="day in days" :key="day" class="space-y-2 sm:space-y-3">
              <!-- Day Header -->
              <div
                class="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted truncate"
              >
                {{ day }}
              </div>

              <!-- Todos - Draggable -->
              <draggable
                v-if="todosByDay[day]"
                v-model="todosByDay[day]"
                item-key="id"
                class="space-y-2 min-h-20 sm:min-h-25"
                :animation="200"
                ghost-class="opacity-50"
                drag-class="cursor-grabbing"
                @end="onDragEnd(day)"
              >
                <template #item="{ element: todo }">
                  <div
                    class="group flex items-start gap-2 p-2 sm:p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-primary-500 transition cursor-grab active:cursor-grabbing"
                  >
                    <input
                      type="checkbox"
                      :checked="todo.isCompleted"
                      class="mt-0.5 size-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500 shrink-0"
                      @change="toggleTodo(todo)"
                    />
                    <div class="flex-1 min-w-0">
                      <p
                        :class="[
                          'text-xs sm:text-sm break-words',
                          todo.isCompleted
                            ? 'line-through text-muted'
                            : 'text-zinc-900 dark:text-zinc-100',
                        ]"
                      >
                        {{ todo.title }}
                      </p>
                      <!-- GitHub Issue Info -->
                      <div
                        v-if="todo.githubIssueNumber"
                        class="flex items-center gap-2 mt-1"
                      >
                        <a
                          :href="todo.githubIssueUrl || '#'"
                          target="_blank"
                          class="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <UIcon name="i-lucide-github" class="size-3" />
                          #{{ todo.githubIssueNumber }}
                        </a>
                        <span
                          v-if="todo.githubLabels"
                          class="text-xs text-muted"
                        >
                          {{ todo.githubLabels }}
                        </span>
                      </div>
                    </div>
                    <button
                      class="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-red-500 hover:text-red-600 transition shrink-0"
                      @click="deleteTodo(todo.id)"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-4" />
                    </button>
                  </div>
                </template>
              </draggable>

              <!-- Empty State -->
              <div
                v-if="!todosByDay[day] || todosByDay[day].length === 0"
                class="p-3 sm:p-4 text-center text-xs sm:text-sm text-muted border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg"
              >
                No to-dos
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Image Cropper Modal -->
  <UModal v-model:open="showCropperModal">
    <template #content>
      <div class="bg-white dark:bg-zinc-950 w-full max-w-2xl mx-4 sm:mx-auto">
        <div class="p-3 sm:p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <h3 class="text-base sm:text-lg font-semibold">Crop Cover Image</h3>
            <button
              class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              @click="cancelCrop"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
        </div>

        <div class="p-3 sm:p-4">
          <ClientOnly>
            <Cropper
              v-if="selectedImage"
              :src="selectedImage"
              :stencil-props="{ aspectRatio: 6 / 1 }"
              class="h-48 sm:h-80"
              @change="handleCrop"
            />
          </ClientOnly>
        </div>

        <div
          class="p-3 sm:p-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col-reverse sm:flex-row justify-end gap-2"
        >
          <button
            :disabled="uploadingCover"
            class="px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50"
            @click="cancelCrop"
          >
            Cancel
          </button>
          <button
            :disabled="!croppedImage || uploadingCover"
            class="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
