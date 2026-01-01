<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

const api = useApi();

interface Category {
  id: string;
  name: string;
  color: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  color: string;
}

interface Project {
  id: string;
  name: string;
  order: string | null;
  status: string;
  information: string | null;
  orderNum: number;
  category?: Category | null;
  payment?: PaymentMethod | null;
  categoryId?: string | null;
  paymentId?: string | null;
  githubRepo?: string | null;
  githubUrl?: string | null;
  lastSyncedAt?: string | null;
  createdAt?: string;
}

interface PageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

const projects = ref<Project[]>([]);
const categories = ref<Category[]>([]);
const paymentMethods = ref<PaymentMethod[]>([]);
const pageSettings = ref<PageSettings>({
  id: "",
  cover: null,
  icon: null,
  title: "DATA PROJECT",
  description: null,
});

const loading = ref(true);
const showModal = ref(false);
const showCategoryModal = ref(false);
const showPaymentModal = ref(false);

// Multiple selection
const selectedProjects = ref<string[]>([]);
const selectAll = ref(false);
const editingTitle = ref(false);
const editingDescription = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);

// Image Cropper
const showCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const uploadingCover = ref(false);

// CSV Export/Import
const csvInput = ref<HTMLInputElement | null>(null);
const exporting = ref(false);
const importing = ref(false);

// Filter & Search
const searchQuery = ref("");
const filterStatus = ref("");
const filterCategory = ref("");
const filterPayment = ref("");

const form = ref({
  name: "",
  order: "",
  status: "TODO",
  categoryId: "",
  paymentId: "",
  information: "",
});

const categoryForm = ref({ name: "", color: "zinc" });
const paymentForm = ref({ name: "", color: "zinc" });

// GitHub Sync
const showGitHubModal = ref(false);
const githubRepoInput = ref("");
const selectedProject = ref<Project | null>(null);
const syncing = ref(false);

const colorOptions = [
  { label: "zinc", value: "zinc" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
  { label: "Purple", value: "purple" },
  { label: "Pink", value: "pink" },
];

// Inline editing state
const editingProjectId = ref<string | null>(null);
const editingField = ref<string | null>(null);

const statusOptions = [
  { label: "Todo", value: "TODO", color: "zinc" },
  { label: "Done", value: "DONE", color: "emerald" },
];

const getStatusColor = (status: string) =>
  statusOptions.find((s) => s.value === status)?.color || "zinc";

const getBadgeClasses = (color: string) => {
  const map: Record<string, string> = {
    zinc: "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100",
    red: "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100",
    orange:
      "bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100",
    yellow:
      "bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100",
    green: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
    emerald:
      "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100",
    purple:
      "bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100",
    pink: "bg-pink-200 text-pink-900 dark:bg-pink-800 dark:text-pink-100",
  };
  return map[color] || map.zinc;
};

const _getCategoryCardClasses = (color: string) => {
  const map: Record<string, string> = {
    zinc: "border-zinc-200 dark:border-zinc-800",
    red: "border-red-200 dark:border-red-900/50",
    orange: "border-orange-200 dark:border-orange-900/50",
    yellow: "border-yellow-200 dark:border-yellow-900/50",
    green: "border-green-200 dark:border-green-900/50",
    purple: "border-purple-200 dark:border-purple-900/50",
    pink: "border-pink-200 dark:border-pink-900/50",
  };
  return map[color] || map.zinc;
};

const _getCategoryTextColor = (color: string) => {
  const map: Record<string, string> = {
    zinc: "text-zinc-600 dark:text-zinc-400",
    red: "text-red-600 dark:text-red-400",
    orange: "text-orange-600 dark:text-orange-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-purple-600 dark:text-purple-400",
    pink: "text-pink-600 dark:text-pink-400",
  };
  return map[color] || map.zinc;
};

// Computed - Filtered Projects
const filteredProjects = computed(() => {
  let result = projects.value;

  // Search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.order?.toLowerCase().includes(query) ||
        p.information?.toLowerCase().includes(query)
    );
  }

  // Filter by status
  if (filterStatus.value) {
    result = result.filter((p) => p.status === filterStatus.value);
  }

  // Filter by category
  if (filterCategory.value) {
    result = result.filter((p) => p.categoryId === filterCategory.value);
  }

  // Filter by payment
  if (filterPayment.value) {
    result = result.filter((p) => p.paymentId === filterPayment.value);
  }

  return result;
});

// Computed - Stats
const stats = computed(() => {
  const total = projects.value.length;
  const todo = projects.value.filter(
    (p) => p.status === "TODO" || p.status === "IN_PROGRESS"
  ).length;
  const done = projects.value.filter((p) => p.status === "DONE").length;
  return { total, todo, done };
});

// Computed - Category Stats
const categoryStats = computed(() => {
  const stats = new Map<string, { count: number; category: Category }>();

  projects.value.forEach((project) => {
    if (project.category) {
      const existing = stats.get(project.category.id);
      if (existing) {
        existing.count++;
      } else {
        stats.set(project.category.id, {
          count: 1,
          category: project.category,
        });
      }
    }
  });

  return Array.from(stats.values()).sort((a, b) => b.count - a.count);
});

// Computed - Used Categories (only categories that are used in projects)
const usedCategories = computed(() => {
  const categoryIds = new Set(
    projects.value
      .filter((p) => p.categoryId)
      .map((p) => p.categoryId as string)
  );
  return categories.value
    .filter((c) => categoryIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Computed - Used Payment Methods (only payment methods that are used in projects)
const usedPaymentMethods = computed(() => {
  const paymentIds = new Set(
    projects.value.filter((p) => p.paymentId).map((p) => p.paymentId as string)
  );
  return paymentMethods.value
    .filter((pm) => paymentIds.has(pm.id))
    .sort((a, b) => a.name.localeCompare(b.name));
});

const loadData = async () => {
  loading.value = true;
  try {
    const [p, c, pm, s] = await Promise.all([
      api.get<Project[]>("/projects"),
      api.get<Category[]>("/project-categories"),
      api.get<PaymentMethod[]>("/payment-methods"),
      api.get<PageSettings>("/projects/settings"),
    ]);
    projects.value = p;
    // Sort categories and payment methods alphabetically
    categories.value = c.sort((a, b) => a.name.localeCompare(b.name));
    paymentMethods.value = pm.sort((a, b) => a.name.localeCompare(b.name));
    pageSettings.value = s;
  } finally {
    loading.value = false;
  }
};

const selectCoverImage = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  if (!file) return;

  // Read file as data URL for cropper
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showCropperModal.value = true;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const handleCrop = ({ canvas }: { canvas: HTMLCanvasElement }) => {
  // Cover uses h-52 (208px height) with full width
  // For typical screen width, this creates roughly a 6:1 aspect ratio
  const targetWidth = 1248; // 6 * 208
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
      "/projects/settings/cover",
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
    await api.delete("/projects/settings/cover");
    pageSettings.value.cover = null;
  } catch (e) {
    console.error("Failed to remove cover:", e);
  }
};

const updateTitle = async () => {
  editingTitle.value = false;
  try {
    await api.patch("/projects/settings", { title: pageSettings.value.title });
  } catch (e) {
    console.error("Failed to update title:", e);
  }
};

const updateDescription = async () => {
  editingDescription.value = false;
  try {
    await api.patch("/projects/settings", {
      description: pageSettings.value.description,
    });
  } catch (e) {
    console.error("Failed to update description:", e);
  }
};

// Inline editing functions
const startEdit = (projectId: string, field: string) => {
  editingProjectId.value = projectId;
  editingField.value = field;
};

const cancelEdit = () => {
  editingProjectId.value = null;
  editingField.value = null;
};

const updateProjectField = async (
  project: Project,
  field: string,
  value: unknown
) => {
  try {
    await api.patch(`/projects/${project.id}`, { [field]: value });
    await loadData();
    cancelEdit();
  } catch (e) {
    console.error("Failed to update project:", e);
  }
};

const createProject = async () => {
  await api.post("/projects", form.value);
  showModal.value = false;
  form.value = {
    name: "",
    order: "",
    status: "TODO",
    categoryId: "",
    paymentId: "",
    information: "",
  };
  await loadData();
};

// Multiple selection functions
const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProjects.value = filteredProjects.value.map((p) => p.id);
  } else {
    selectedProjects.value = [];
  }
};

const toggleProject = (projectId: string) => {
  const index = selectedProjects.value.indexOf(projectId);
  if (index > -1) {
    selectedProjects.value.splice(index, 1);
  } else {
    selectedProjects.value.push(projectId);
  }
  selectAll.value =
    selectedProjects.value.length === filteredProjects.value.length &&
    filteredProjects.value.length > 0;
};

const bulkDelete = async () => {
  if (selectedProjects.value.length === 0) return;
  if (!confirm(`Delete ${selectedProjects.value.length} selected projects?`))
    return;

  try {
    // Delete sequentially to avoid rate limiting
    for (const id of selectedProjects.value) {
      await api.delete(`/projects/${id}`);
      // Small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    selectedProjects.value = [];
    selectAll.value = false;
    await loadData();
  } catch (e) {
    console.error("Failed to delete projects:", e);
    alert("Failed to delete some projects. Please try again.");
  }
};

const bulkUpdateStatus = async (status: string) => {
  if (selectedProjects.value.length === 0) return;

  try {
    // Update sequentially to avoid rate limiting
    for (const id of selectedProjects.value) {
      await api.patch(`/projects/${id}`, { status });
      // Small delay to prevent rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    selectedProjects.value = [];
    selectAll.value = false;
    await loadData();
  } catch (e) {
    console.error("Failed to update projects:", e);
    alert("Failed to update some projects. Please try again.");
  }
};

const deleteProject = async (id: string) => {
  if (!confirm("Delete this project?")) return;
  await api.delete(`/projects/${id}`);
  await loadData();
};

const saveCategory = async () => {
  await api.post("/project-categories", categoryForm.value);
  showCategoryModal.value = false;
  categoryForm.value = { name: "", color: "zinc" };
  await loadData();
};

const savePaymentMethod = async () => {
  await api.post("/payment-methods", paymentForm.value);
  showPaymentModal.value = false;
  paymentForm.value = { name: "", color: "zinc" };
  await loadData();
};

const openNewProjectModal = () => {
  form.value = {
    name: "",
    order: "",
    status: "TODO",
    categoryId: "",
    paymentId: "",
    information: "",
  };
  showModal.value = true;
};

const clearFilters = () => {
  searchQuery.value = "";
  filterStatus.value = "";
  filterCategory.value = "";
  filterPayment.value = "";
};

// GitHub Sync Methods
const openGitHubModal = (project: Project) => {
  selectedProject.value = project;
  githubRepoInput.value = project.githubRepo || "";
  showGitHubModal.value = true;
};

const linkGitHubRepo = async () => {
  if (!selectedProject.value || !githubRepoInput.value.trim()) return;

  try {
    await api.post("/github/link-repo", {
      projectId: selectedProject.value.id,
      githubRepo: githubRepoInput.value.trim(),
    });

    // Reload projects to get updated data
    await loadData();
    showGitHubModal.value = false;
    githubRepoInput.value = "";
  } catch (e: any) {
    console.error("Failed to link GitHub repo:", e);
    alert(e.response?.data?.message || "Failed to link GitHub repository");
  }
};

const syncGitHubIssues = async (project: Project) => {
  if (!project.githubRepo) return;

  syncing.value = true;
  try {
    const result = await api.post<{ synced: number }>("/github/sync-issues", {
      projectId: project.id,
      githubRepo: project.githubRepo,
    });

    alert(`Synced ${result.synced} issues to todos!`);
    await loadData();
  } catch (e: any) {
    console.error("Failed to sync issues:", e);
    alert(e.response?.data?.message || "Failed to sync GitHub issues");
  } finally {
    syncing.value = false;
  }
};

const exportFile = async (format: "csv" | "xlsx") => {
  exporting.value = true;
  try {
    const config = useRuntimeConfig();
    const baseURL = config.public.apiBase || "http://localhost:3000/api";
    const response = await fetch(`${baseURL}/projects/export/${format}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projects-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (e) {
    console.error(`Failed to export ${format.toUpperCase()}:`, e);
    alert(`Failed to export ${format.toUpperCase()}`);
  } finally {
    exporting.value = false;
  }
};

const exportCsv = () => exportFile("csv");
const exportXlsx = () => exportFile("xlsx");

const importFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  if (!file) return;

  // Detect file type
  const isXlsx = file.name.endsWith(".xlsx");
  const endpoint = isXlsx ? "/projects/import/xlsx" : "/projects/import/csv";

  importing.value = true;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const result = await api.upload<{ imported: number; errors: string[] }>(
      endpoint,
      formData
    );

    if (result.errors.length > 0) {
      alert(
        `Imported ${result.imported} projects.\nErrors:\n${result.errors.join(
          "\n"
        )}`
      );
    } else {
      alert(`Successfully imported ${result.imported} projects!`);
    }

    await loadData();
  } catch (e) {
    console.error("Failed to import file:", e);
    alert("Failed to import file");
  } finally {
    importing.value = false;
    input.value = "";
  }
};

onMounted(loadData);
</script>

<template>
  <UDashboardPanel id="projects">
    <template #header>
      <UDashboardNavbar title="Projects">
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
            v-if="loading"
            class="h-48 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"
          />
          <div
            v-else-if="pageSettings.cover"
            class="h-48 w-full bg-cover bg-center"
            :style="{ backgroundImage: `url(${pageSettings.cover})` }"
          />
          <div
            v-else
            class="h-48 w-full bg-linear-to-br from-primary-500 to-primary-700"
          />

          <div
            v-if="!loading"
            class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md backdrop-blur-md transition border border-white/20"
              @click="coverInput?.click()"
            >
              {{ pageSettings.cover ? "Change" : "Add cover" }}
            </button>
            <button
              v-if="pageSettings.cover"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md backdrop-blur-md transition border border-white/20"
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

        <!-- Page Header -->
        <div class="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div class="mb-3">
            <input
              v-if="editingTitle"
              v-model="pageSettings.title"
              class="text-3xl font-bold bg-transparent border-none outline-none w-full"
              autofocus
              @blur="updateTitle"
              @keyup.enter="updateTitle"
            />
            <h1
              v-else
              class="text-3xl font-bold cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-2 -mx-2 py-1 transition inline-block"
              @click="editingTitle = true"
            >
              {{ pageSettings.title }}
            </h1>
          </div>

          <div v-if="editingDescription || pageSettings.description">
            <textarea
              v-if="editingDescription"
              v-model="pageSettings.description"
              placeholder="Add a description..."
              class="w-full bg-transparent border-none outline-none text-muted resize-none text-sm"
              rows="2"
              autofocus
              @blur="updateDescription"
            />
            <p
              v-else
              class="text-sm text-muted cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-2 -mx-2 py-1 transition"
              @click="editingDescription = true"
            >
              {{ pageSettings.description }}
            </p>
          </div>
          <button
            v-else
            class="text-sm text-muted hover:text-zinc-600 dark:hover:text-zinc-400 transition"
            @click="editingDescription = true"
          >
            Add description...
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="px-6 py-5 bg-zinc-50/50 dark:bg-zinc-900/20">
          <div class="grid grid-cols-3 gap-4">
            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-muted uppercase tracking-wider"
                  >Total</span
                >
                <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <UIcon
                    name="i-lucide-folder-kanban"
                    class="size-4 text-zinc-600 dark:text-zinc-400"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold">
                {{ stats.total }}
              </div>
            </div>

            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-orange-200 dark:border-orange-900/50"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-orange-600 uppercase tracking-wider"
                  >Todo</span
                >
                <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <UIcon
                    name="i-lucide-circle-dashed"
                    class="size-4 text-orange-600"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-orange-600">
                {{ stats.todo }}
              </div>
            </div>

            <div
              class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-green-200 dark:border-green-900/50"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-medium text-green-600 uppercase tracking-wider"
                  >Done</span
                >
                <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <UIcon
                    name="i-lucide-check-circle-2"
                    class="size-4 text-green-600"
                  />
                </div>
              </div>
              <div class="text-2xl font-bold text-green-600">
                {{ stats.done }}
              </div>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div
          class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10"
        >
          <!-- Bulk Actions Bar -->
          <div
            v-if="selectedProjects.length > 0"
            class="flex items-center gap-3 mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
          >
            <span class="text-sm font-medium">
              {{ selectedProjects.length }} selected
            </span>
            <div class="flex-1" />
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-check"
              @click="bulkUpdateStatus('DONE')"
            >
              Mark as Done
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-circle-dashed"
              @click="bulkUpdateStatus('TODO')"
            >
              Mark as Todo
            </UButton>
            <UButton
              variant="ghost"
              size="sm"
              color="error"
              icon="i-lucide-trash-2"
              @click="bulkDelete"
            >
              Delete
            </UButton>
            <button
              class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
              @click="
                selectedProjects = [];
                selectAll = false;
              "
            >
              <UIcon name="i-lucide-x" class="size-4" />
            </button>
          </div>

          <div class="flex items-center gap-3">
            <!-- Search -->
            <div class="flex-1 relative">
              <UIcon
                name="i-lucide-search"
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted"
              />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search projects..."
                class="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
              />
            </div>

            <!-- Filters -->
            <select
              v-model="filterStatus"
              class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[120px]"
            >
              <option value="">All Status</option>
              <option
                v-for="opt in statusOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </option>
            </select>

            <select
              v-model="filterCategory"
              class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[140px]"
            >
              <option value="">All Categories</option>
              <option
                v-for="cat in usedCategories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>

            <select
              v-model="filterPayment"
              class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[140px]"
            >
              <option value="">All Payments</option>
              <option
                v-for="pm in usedPaymentMethods"
                :key="pm.id"
                :value="pm.id"
              >
                {{ pm.name }}
              </option>
            </select>

            <!-- Clear Filters -->
            <UButton
              v-if="
                searchQuery || filterStatus || filterCategory || filterPayment
              "
              variant="ghost"
              size="sm"
              icon="i-lucide-x"
              @click="clearFilters"
            >
              Clear
            </UButton>

            <div class="h-6 w-px bg-zinc-200 dark:bg-zinc-800" />

            <!-- Actions -->
            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-download"
              :loading="exporting"
              @click="exportCsv"
            >
              CSV
            </UButton>

            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-file-spreadsheet"
              :loading="exporting"
              @click="exportXlsx"
            >
              Excel
            </UButton>

            <UButton
              variant="ghost"
              size="sm"
              icon="i-lucide-upload"
              @click="csvInput?.click()"
            >
              Import
            </UButton>
            <input
              ref="csvInput"
              type="file"
              accept=".csv,.xlsx"
              class="hidden"
              @change="importFile"
            />

            <UButton
              color="primary"
              size="sm"
              icon="i-lucide-plus"
              @click="openNewProjectModal()"
            >
              New Project
            </UButton>
          </div>
        </div>

        <!-- Table -->
        <div class="px-6 pb-6 mt-3">
          <div v-if="loading" class="space-y-2">
            <USkeleton v-for="i in 8" :key="i" class="h-14" />
          </div>

          <div
            v-else-if="filteredProjects.length === 0"
            class="text-center py-20"
          >
            <div
              class="inline-flex items-center justify-center size-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-4"
            >
              <UIcon
                name="i-lucide-folder-kanban"
                class="size-8 text-emerald-500"
              />
            </div>
            <h3 class="text-lg font-semibold mb-2">
              {{
                projects.length === 0 ? "No projects yet" : "No projects found"
              }}
            </h3>
            <p class="text-sm text-muted mb-6">
              {{
                projects.length === 0
                  ? "Create your first project to get started"
                  : "Try adjusting your filters"
              }}
            </p>
            <UButton
              v-if="projects.length === 0"
              icon="i-lucide-plus"
              color="success"
              @click="openNewProjectModal()"
            >
              Create Project
            </UButton>
            <UButton v-else variant="ghost" @click="clearFilters()">
              Clear Filters
            </UButton>
          </div>

          <!-- Table -->
          <div
            v-else
            class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
          >
            <table class="w-full">
              <thead class="bg-emerald-50 dark:bg-emerald-900/20">
                <tr
                  class="text-left text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider"
                >
                  <th class="px-4 py-3 w-12">
                    <input
                      v-model="selectAll"
                      type="checkbox"
                      class="size-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      @change="toggleSelectAll"
                    />
                  </th>
                  <th class="px-4 py-3 w-12">#</th>
                  <th class="px-4 py-3">Project</th>
                  <th class="px-4 py-3">Order</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Payment</th>
                  <th class="px-4 py-3">Category</th>
                  <th class="px-4 py-3">GitHub</th>
                  <th class="px-4 py-3">Information</th>
                  <th class="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr
                  v-for="(project, index) in filteredProjects"
                  :key="project.id"
                  class="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group"
                >
                  <td class="px-4 py-3">
                    <input
                      type="checkbox"
                      :checked="selectedProjects.includes(project.id)"
                      class="size-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                      @change="toggleProject(project.id)"
                    />
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-mono font-semibold"
                  >
                    {{ index + 1 }}
                  </td>

                  <!-- Project Name -->
                  <td class="px-4 py-3">
                    <input
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'name'
                      "
                      :value="project.name"
                      class="w-full px-2 py-1 text-sm font-medium bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @blur="(e) => updateProjectField(project, 'name', (e.target as HTMLInputElement).value)"
                      @keyup.enter="(e) => updateProjectField(project, 'name', (e.target as HTMLInputElement).value)"
                      @keyup.esc="cancelEdit"
                    />
                    <div
                      v-else
                      class="font-medium cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      @click="startEdit(project.id, 'name')"
                    >
                      {{ project.name }}
                    </div>
                  </td>

                  <!-- Order -->
                  <td class="px-4 py-3">
                    <input
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'order'
                      "
                      :value="project.order || ''"
                      class="w-full px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @blur="(e) => updateProjectField(project, 'order', (e.target as HTMLInputElement).value || null)"
                      @keyup.enter="(e) => updateProjectField(project, 'order', (e.target as HTMLInputElement).value || null)"
                      @keyup.esc="cancelEdit"
                    />
                    <div
                      v-else
                      class="text-sm text-muted cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      @click="startEdit(project.id, 'order')"
                    >
                      {{ project.order || "-" }}
                    </div>
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3">
                    <select
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'status'
                      "
                      :value="project.status"
                      class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @change="(e) => updateProjectField(project, 'status', (e.target as HTMLSelectElement).value)"
                      @blur="cancelEdit"
                    >
                      <option
                        v-for="opt in statusOptions"
                        :key="opt.value"
                        :value="opt.value"
                      >
                        {{ opt.label }}
                      </option>
                    </select>
                    <div
                      v-else
                      class="cursor-pointer"
                      @click="startEdit(project.id, 'status')"
                    >
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          getBadgeClasses(getStatusColor(project.status)),
                        ]"
                      >
                        {{
                          statusOptions.find((s) => s.value === project.status)
                            ?.label
                        }}
                      </span>
                    </div>
                  </td>

                  <!-- Payment -->
                  <td class="px-4 py-3">
                    <select
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'paymentId'
                      "
                      :value="project.paymentId || ''"
                      class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @change="(e) => updateProjectField(project, 'paymentId', (e.target as HTMLSelectElement).value || null)"
                      @blur="cancelEdit"
                    >
                      <option value="">No Payment</option>
                      <option
                        v-for="pm in paymentMethods"
                        :key="pm.id"
                        :value="pm.id"
                      >
                        {{ pm.name }}
                      </option>
                    </select>
                    <div
                      v-else
                      class="cursor-pointer"
                      @click="startEdit(project.id, 'paymentId')"
                    >
                      <span
                        v-if="project.payment"
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          getBadgeClasses(project.payment.color),
                        ]"
                      >
                        {{ project.payment.name }}
                      </span>
                      <span v-else class="text-sm text-muted">-</span>
                    </div>
                  </td>
                  <!-- Category -->
                  <td class="px-4 py-3">
                    <select
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'categoryId'
                      "
                      :value="project.categoryId || ''"
                      class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @change="(e) => updateProjectField(project, 'categoryId', (e.target as HTMLSelectElement).value || null)"
                      @blur="cancelEdit"
                    >
                      <option value="">No Category</option>
                      <option
                        v-for="cat in categories"
                        :key="cat.id"
                        :value="cat.id"
                      >
                        {{ cat.name }}
                      </option>
                    </select>
                    <div
                      v-else
                      class="cursor-pointer"
                      @click="startEdit(project.id, 'categoryId')"
                    >
                      <span
                        v-if="project.category"
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          getBadgeClasses(project.category.color),
                        ]"
                      >
                        {{ project.category.name }}
                      </span>
                      <span v-else class="text-sm text-muted">-</span>
                    </div>
                  </td>

                  <!-- GitHub -->
                  <td class="px-4 py-3">
                    <div
                      v-if="project.githubRepo"
                      class="flex items-center gap-2"
                    >
                      <a
                        :href="project.githubUrl || '#'"
                        target="_blank"
                        class="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        <UIcon name="i-lucide-github" class="size-3" />
                        {{ project.githubRepo }}
                      </a>
                      <button
                        :disabled="syncing"
                        class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded transition disabled:opacity-50"
                        @click="syncGitHubIssues(project)"
                      >
                        Sync
                      </button>
                    </div>
                    <button
                      v-else
                      class="text-xs text-muted hover:text-primary-600 dark:hover:text-primary-400 transition"
                      @click="openGitHubModal(project)"
                    >
                      Link Repo
                    </button>
                  </td>

                  <!-- Information -->
                  <td class="px-4 py-3">
                    <input
                      v-if="
                        editingProjectId === project.id &&
                        editingField === 'information'
                      "
                      :value="project.information || ''"
                      class="w-full px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                      autofocus
                      @blur="(e) => updateProjectField(project, 'information', (e.target as HTMLInputElement).value || null)"
                      @keyup.enter="(e) => updateProjectField(project, 'information', (e.target as HTMLInputElement).value || null)"
                      @keyup.esc="cancelEdit"
                    />
                    <div
                      v-else
                      class="text-sm text-muted cursor-text hover:text-emerald-600 dark:hover:text-emerald-400 transition max-w-xs truncate"
                      @click="startEdit(project.id, 'information')"
                    >
                      {{ project.information || "-" }}
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    <button
                      class="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded transition opacity-0 group-hover:opacity-100"
                      @click="deleteProject(project.id)"
                    >
                      <UIcon name="i-lucide-trash-2" class="size-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- New Project Modal (simplified) -->
  <UModal v-model:open="showModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-zinc-950 max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">New Project</h3>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            @click="showModal = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2.5">
              Project Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter project name"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <select
                v-model="form.categoryId"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option value="">No Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Payment</label>
              <select
                v-model="form.paymentId"
                class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option value="">No Payment</option>
                <option
                  v-for="pm in paymentMethods"
                  :key="pm.id"
                  :value="pm.id"
                >
                  {{ pm.name }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            class="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            @click="showModal = false"
          >
            Cancel
          </button>
          <button
            :disabled="!form.name"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition"
            @click="createProject"
          >
            Create
          </button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Category Modal -->
  <UModal v-model:open="showCategoryModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-zinc-950 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Category</h3>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            @click="showCategoryModal = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2.5">
              Category Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="Enter category name"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2.5">Badge Color</label>
            <select
              v-model="categoryForm.color"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
          <div>
            <label class="block text-sm font-medium mb-2">Preview</label>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
                getBadgeClasses(categoryForm.color),
              ]"
            >
              {{ categoryForm.name || "Category Name" }}
            </span>
          </div>
        </div>
        <div
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            @click="showCategoryModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!categoryForm.name"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition"
            @click="saveCategory"
          >
            Add Category
          </button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Payment Modal -->
  <UModal v-model:open="showPaymentModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-zinc-950 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Payment Method</h3>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            @click="showPaymentModal = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2.5">
              Payment Method Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="paymentForm.name"
              type="text"
              placeholder="Enter payment method name"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2.5">Badge Color</label>
            <select
              v-model="paymentForm.color"
              class="w-full px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
          <div>
            <label class="block text-sm font-medium mb-2">Preview</label>
            <span
              :class="[
                'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
                getBadgeClasses(paymentForm.color),
              ]"
            >
              {{ paymentForm.name || "Payment Method" }}
            </span>
          </div>
        </div>
        <div
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            @click="showPaymentModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!paymentForm.name"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition"
            @click="savePaymentMethod"
          >
            Add Payment
          </button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Image Cropper Modal -->
  <UModal v-model:open="showCropperModal">
    <template #content>
      <div class="bg-white dark:bg-zinc-950 w-full max-w-2xl">
        <div class="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Crop Cover Image</h3>
            <button
              class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              @click="cancelCrop"
            >
              <UIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
        </div>

        <div class="p-4">
          <ClientOnly>
            <Cropper
              v-if="selectedImage"
              :src="selectedImage"
              :stencil-props="{ aspectRatio: 6 / 1 }"
              class="h-80"
              @change="handleCrop"
            />
          </ClientOnly>
        </div>

        <div
          class="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2"
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
            class="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
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

  <!-- GitHub Repo Link Modal -->
  <UModal v-model:open="showGitHubModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-zinc-950 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-github" class="size-5 text-primary-600" />
            <h3 class="text-xl font-semibold">Link GitHub Repository</h3>
          </div>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            @click="showGitHubModal = false"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2.5">
              GitHub Repository <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <UIcon
                name="i-lucide-github"
                class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400"
              />
              <input
                v-model="githubRepoInput"
                type="text"
                placeholder="owner/repository"
                class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              />
            </div>
            <p class="text-xs text-muted mt-1.5 flex items-center gap-1">
              <UIcon name="i-lucide-info" class="size-3" />
              Format:
              <code
                class="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-primary-600"
                >owner/repo</code
              >
              (e.g. facebook/react)
            </p>
          </div>

          <div
            v-if="selectedProject?.githubRepo"
            class="p-3.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-link"
                class="size-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0"
              />
              <div class="text-sm">
                <p class="font-medium text-blue-900 dark:text-blue-100 mb-0.5">
                  Currently Linked
                </p>
                <code class="text-blue-700 dark:text-blue-400">{{
                  selectedProject.githubRepo
                }}</code>
              </div>
            </div>
          </div>
        </div>

        <div
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800"
        >
          <button
            type="button"
            class="px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            @click="showGitHubModal = false"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="!githubRepoInput.trim()"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition flex items-center gap-2"
            @click="linkGitHubRepo"
          >
            <UIcon name="i-lucide-link" class="size-4" />
            {{
              selectedProject?.githubRepo ? "Update Link" : "Link Repository"
            }}
          </button>
        </div>
      </div>
    </template>
  </UModal>
</template>
