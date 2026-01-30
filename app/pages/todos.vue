<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import draggable from "vuedraggable";
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import confetti from "canvas-confetti";
import { format, formatDistanceToNow, isPast } from 'date-fns';

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
  dueDate?: string | null;
  priority?: string;
  status?: string;
  commitCount?: number;
}

interface GitHubCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string | null;
  htmlUrl: string;
  additions: number;
  deletions: number;
  committedAt: string;
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
const selectedPriority = ref("MEDIUM"); // Default priority
const isInputFocused = ref(false);

// GitHub Commit Tracking
const selectedTodoForCommits = ref<Todo | null>(null);
const showCommitsModal = ref(false);
const commits = ref<GitHubCommit[]>([]);
const loadingCommits = ref(false);
const commitCounts = ref<Record<string, number>>({});

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

// Kanban Columns
const columns = [
  { 
    id: 'TODO', 
    label: 'New task', 
    headerClass: 'text-zinc-900 dark:text-zinc-100',
    dotClass: 'bg-zinc-300 dark:bg-zinc-600'
  },
  { 
    id: 'SCHEDULED', 
    label: 'Scheduled', 
    headerClass: 'text-blue-600 dark:text-blue-400',
    dotClass: 'bg-blue-500' 
  },
  { 
    id: 'IN_PROGRESS', 
    label: 'In progress', 
    headerClass: 'text-orange-600 dark:text-orange-400',
    dotClass: 'bg-orange-500' 
  },
  { 
    id: 'DONE', 
    label: 'Completed', 
    headerClass: 'text-green-600 dark:text-green-400',
    dotClass: 'bg-green-500' 
  }
];

// Image Cropper
const showCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const uploadingCover = ref(false);

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

const todosByStatus = computed(() => {
  if (!week.value) return { TODO: [], SCHEDULED: [], IN_PROGRESS: [], DONE: [] };
  
  const w = week.value;
  const grouped: Record<string, Todo[]> = {
    TODO: [],
    SCHEDULED: [],
    IN_PROGRESS: [],
    DONE: []
  };
  
  w.todos.forEach((t) => {
    // Default to TODO if generic or unknown
    let status = t.status ? t.status.toUpperCase() : (t.isCompleted ? 'DONE' : 'TODO');
    
    // Safety check for unknown statuses
    if (!grouped[status]) {
        status = 'TODO';
    }
    grouped[status]!.push(t);
  });

  // Sort by order
  Object.keys(grouped).forEach(k => {
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
  
  const completed = allTodos.filter(t => t.isCompleted || t.status === 'DONE').length;
  const percentage = Math.round((completed / allTodos.length) * 100);
  return { total: allTodos.length, completed, percentage };
});

const addTodo = async () => {
  if (!newTodoTitle.value.trim()) return;
  
  // Default to today for required day field
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIndex = new Date().getDay(); // 0=Sun
  const dayIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const currentDay = days[dayIndex];

  await api.post("/todos", {
    title: newTodoTitle.value,
    day: currentDay, 
    priority: selectedPriority.value,
    status: 'TODO'
  });
  newTodoTitle.value = "";
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

// Drag and Drop Handler
const onDragChange = async (event: any, newStatus: string) => {
  // Handle moving within same column or reordering after adding
  if (event.moved) {
    const todo = event.moved.element;
    const newIndex = event.moved.newIndex;
    
    // Get the updated list from the UI state (draggable mutates the array passed to it)
    // We need to map the current column's todos to just their IDs
    const columnTodos = todosByStatus.value[newStatus];
    if (columnTodos) {
       const todoIds = columnTodos.map(t => t.id);
       
       // Update local order to match UI ordering (so computed property doesn't snap back)
       columnTodos.forEach((t, index) => {
           t.order = index;
       });

       try {
           await api.post('/todos/reorder', { todoIds });
       } catch (e) {
           console.error("Failed to reorder", e);
           await loadWeek(); // Revert
       }
    }
  }

  if (event.added) {
    const todo = event.added.element;
    const newIndex = event.added.newIndex;
    
    // Optimistic update status
    todo.status = newStatus;
    if (newStatus === 'DONE') {
        todo.isCompleted = true;
         confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        todo.isCompleted = false;
    }

    try {
        // First update status
        await api.patch(`/todos/${todo.id}`, {
            status: newStatus,
            isCompleted: newStatus === 'DONE'
        });

        // Then reorder if inserted in specific position
        const columnTodos = todosByStatus.value[newStatus];
        if (columnTodos) {
           const todoIds = columnTodos.map(t => t.id);
           
           // Update local order
           columnTodos.forEach((t, index) => {
               t.order = index;
           });

           await api.post('/todos/reorder', { todoIds });
        }
    } catch (e) {
        console.error("Failed to update status/order", e);
        await loadWeek(); // Revert on error
    }
  }
};

const updateTodoDate = async (todo: Todo, dateStr: string) => {
  const val = dateStr || undefined;
  await api.patch(`/todos/${todo.id}`, {
    dueDate: val,
  });
  await loadWeek();
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

// Utils
const getPriorityColor = (priority?: string) => {
  switch(priority) {
    case 'HIGH': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'LOW': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default: return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'; // MEDIUM
  }
};

const getPriorityLabel = (priority?: string) => {
  switch(priority) {
    case 'HIGH': return 'ASAP';
    case 'LOW': return 'Low';
    default: return 'Medium';
  }
};

// GitHub Commit Functions
const loadCommits = async (todo: Todo) => {
  if (!todo.githubIssueNumber || !todo.githubRepoName) return;
  
  selectedTodoForCommits.value = todo;
  showCommitsModal.value = true;
  loadingCommits.value = true;
  
  try {
    commits.value = await api.get<GitHubCommit[]>(`/todos/${todo.id}/commits`);
    commitCounts.value[todo.id] = commits.value.length;
  } catch (error) {
    console.error('Failed to load commits:', error);
    commits.value = [];
  } finally {
    loadingCommits.value = false;
  }
};

const syncCommits = async (todo: Todo) => {
  if (!todo.githubIssueNumber || !todo.githubRepoName) return;
  
  loadingCommits.value = true;
  try {
    const result = await api.post<{ synced: number; commits: GitHubCommit[] }>(
      `/todos/${todo.id}/commits/sync`,
      {}
    );
    commits.value = result.commits;
    commitCounts.value[todo.id] = result.commits.length;
  } catch (error) {
    console.error('Failed to sync commits:', error);
  } finally {
    loadingCommits.value = false;
  }
};

const closeCommitsModal = () => {
  showCommitsModal.value = false;
  selectedTodoForCommits.value = null;
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
                 <!-- Add Task (Quick) -->
                 <div class="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2 py-1.5 focus-within:ring-2 ring-primary-500/20 transition-all">
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
        <!-- Cover & Header -->
        <div class="flex-shrink-0 relative group">
          <div
            v-if="pageSettings.cover"
            class="h-32 w-full bg-cover bg-center transition-all duration-700"
            :style="{ backgroundImage: `url(${pageSettings.cover})` }"
          >
            <div class="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent opacity-80" />
          </div>
          <div
            v-else
            class="h-32 w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90"
          >
              <div class="absolute inset-0 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent" />
          </div>

          <!-- Cover Controls -->
          <div class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
             <button
              class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-full backdrop-blur-sm transition"
              @click="coverInput?.click()"
            >
              {{ pageSettings.cover ? "Change cover" : "Add cover" }}
            </button>
            <button
              v-if="pageSettings.cover"
              class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-xs font-medium rounded-full backdrop-blur-sm transition"
              @click="removeCover"
            >
              Remove
            </button>
          </div>
           <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="selectCoverImage" />
           
          <!-- Title Overlay -->
          <div class="absolute bottom-2 left-4 sm:left-8 right-4 z-20">
             <div class="flex flex-col">
                 <input
                  v-if="editingTitle"
                  v-model="pageSettings.title"
                  class="text-3xl font-black bg-transparent border-none outline-none w-full text-zinc-900 dark:text-white placeholder-zinc-400"
                  autofocus
                  @blur="updateTitle"
                  @keyup.enter="updateTitle"
                />
                <h1
                  v-else
                  class="text-3xl font-black cursor-text text-zinc-900 dark:text-white tracking-tight"
                  @click="editingTitle = true"
                >
                  {{ pageSettings.title }}
                </h1>
                
                <p 
                  class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 cursor-text hover:text-zinc-800 dark:hover:text-zinc-200" 
                  @click="editingDescription = true"
                >
                  {{ pageSettings.description || 'Add a description...' }}
                </p>
                <textarea
                  v-if="editingDescription"
                  v-model="pageSettings.description"
                  class="absolute top-8 left-0 w-full max-w-lg bg-zinc-50 dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg z-50 text-sm"
                  rows="3"
                  @blur="updateDescription"
                />
             </div>
          </div>
        </div>

        <!-- Kanban Board -->
        <div class="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6">
          <div class="flex h-full gap-6 min-w-[1000px]">
            <!-- Columns -->
            <div 
              v-for="col in columns" 
              :key="col.id"
              class="flex-1 flex flex-col min-w-[300px] h-full bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50"
            >
              <!-- Column Header -->
              <div class="flex items-center justify-between p-3 pb-2">
                <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full ring-2 ring-opacity-50" :class="[col.dotClass, `ring-${col.id === 'TODO' ? 'zinc' : col.id === 'SCHEDULED' ? 'blue' : col.id === 'IN_PROGRESS' ? 'orange' : 'green'}-500/20`]" />
                    <h3 class="font-semibold text-sm" :class="col.headerClass">
                        {{ col.label }}
                    </h3>
                    <span class="px-1.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-500 text-xs font-medium shadow-sm border border-zinc-200/50 dark:border-zinc-700/50">
                        {{ todosByStatus[col.id]?.length || 0 }}
                    </span>
                </div>
                <div class="flex gap-1">
                     <UButton icon="i-lucide-more-horizontal" color="neutral" variant="ghost" size="xs" class="hover:bg-zinc-200 dark:hover:bg-zinc-800" />
                </div>
              </div>

               <!-- Add Button (Visible at Top) -->
               <div class="px-3 pb-2">
                   <button 
                    class="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-lg transition-colors border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
                    @click="isInputFocused = true" 
                   >
                       <UIcon name="i-lucide-plus" class="size-4" />
                       <span class="font-medium">Add task</span>
                   </button>
               </div>

              <!-- Draggable Area -->
              <div class="flex-1 overflow-y-auto px-3 pb-3 scrollbar-hide relative">
                 <!-- Empty State (Absolute positioned behind draggable) -->
                 <div 
                    v-if="!todosByStatus[col.id]?.length"
                    class="absolute inset-x-3 top-3 h-40 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 border-2 border-dashed border-zinc-200 dark:border-zinc-800/50 rounded-xl pointer-events-none"
                 >
                     <UIcon name="i-lucide-clipboard-list" class="size-8 mb-2 opacity-50" />
                     <p class="text-xs font-medium">No tasks yet</p>
                 </div>

                 <draggable
                  :list="todosByStatus[col.id] || []"
                  group="todos"
                  item-key="id"
                  class="flex flex-col gap-3 min-h-full relative z-10"
                  :animation="200"
                  ghost-class="opacity-50"
                  drag-class="card-drag-active"
                  @change="(e: any) => onDragChange(e, col.id)"
                 >
                    <template #item="{ element: todo }">
                       <div 
                          class="bg-white dark:bg-zinc-900 border-l-[3px] border-y border-r border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative"
                          :class="{
                              'border-l-red-500 dark:border-l-red-500': todo.priority === 'HIGH',
                              'border-l-blue-500 dark:border-l-blue-500': todo.priority === 'LOW',
                              'border-l-orange-400 dark:border-l-orange-400': todo.priority === 'MEDIUM' || !todo.priority
                          }"
                       >
                          <!-- Card Header -->
                         <div class="flex items-start justify-between mb-2">
                             <!-- Priority Badge (Mini) -->
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                    {{ getPriorityLabel(todo.priority) }}
                                </span>
                            </div>
                            
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-white dark:bg-zinc-900 rounded-md shadow-sm border border-zinc-100 dark:border-zinc-800">
                                <button @click="deleteTodo(todo.id)" class="p-1 text-zinc-400 hover:text-red-500 transition">
                                    <UIcon name="i-lucide-trash-2" class="size-3.5" />
                                </button>
                            </div>
                         </div>

                         <!-- Title -->
                         <p class="text-sm font-medium text-zinc-800 dark:text-zinc-100 mb-3 leading-snug">
                             {{ todo.title }}
                         </p>

                         <!-- Meta -->
                         <div class="flex items-center justify-between mt-auto">
                             <!-- Date -->
                              <DatePicker :model-value="todo.dueDate" @update:model-value="val => updateTodoDate(todo, val || '')">
                                <div 
                                    class="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1 rounded-md"
                                    :class="{'text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10': todo.dueDate && new Date(todo.dueDate) < new Date()}"
                                >
                                    <UIcon name="i-lucide-calendar" class="size-3" />
                                    <span>
                                        {{ todo.dueDate ? formatDistanceToNow(new Date(todo.dueDate), { addSuffix: true }) : 'Set date' }}
                                    </span>
                                </div>
                              </DatePicker>
                            
                             <div class="flex items-center gap-2">
                                 <!-- GitHub Badge with Commit Count -->
                                 <button
                                    v-if="todo.githubIssueNumber"
                                    @click.stop="loadCommits(todo)"
                                    class="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition group/gh"
                                 >
                                     <UIcon name="i-lucide-github" class="size-3 text-zinc-600 dark:text-zinc-400 group-hover/gh:text-zinc-900 dark:group-hover/gh:text-white" />
                                     <span v-if="commitCounts[todo.id]" class="font-medium text-zinc-700 dark:text-zinc-300">
                                       {{ commitCounts[todo.id] }}
                                     </span>
                                     <span v-else class="text-zinc-500">#{{ todo.githubIssueNumber }}</span>
                                 </button>
                             </div>
                         </div>
                       </div>
                    </template>
                 </draggable>
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
      <div class="bg-white dark:bg-zinc-950 w-full max-w-2xl mx-4 sm:mx-auto rounded-xl overflow-hidden">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h3 class="font-semibold">Adjust Cover</h3>
            <button @click="cancelCrop">
                <UIcon name="i-lucide-x" class="size-5" />
            </button>
        </div>
        <div class="p-4 bg-zinc-100 dark:bg-zinc-900">
            <ClientOnly>
                <Cropper
                v-if="selectedImage"
                :src="selectedImage"
                :stencil-props="{ aspectRatio: 6 / 1 }"
                class="h-64 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800"
                @change="handleCrop"
                />
            </ClientOnly>
        </div>
        <div class="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
             <UButton variant="ghost" @click="cancelCrop">Cancel</UButton>
             <UButton :loading="uploadingCover" @click="uploadCroppedCover">Save Cover</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Scrollbar Styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}

.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}
.overflow-x-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}

.card-drag-active {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
  cursor: grabbing;
}
</style>
