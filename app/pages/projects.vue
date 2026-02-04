<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";
import PropertyEditor from "./projects/PropertyEditor.vue";
import PageHeader from "./projects/PageHeader.vue";
import StatsCards from "./projects/StatsCards.vue";
import ProjectFilters from "./projects/ProjectFilters.vue";
import BulkActionsBar from "./projects/BulkActionsBar.vue";
import ProjectsTable from "./projects/ProjectsTable.vue";
import type {
  Category,
  PaymentMethod,
  Project,
  PageSettings,
} from "./projects/types";
import { useProjectColors } from "./projects/composables/useProjectColors";

const api = useApi();

// Use color utilities from composable
const { colorOptions, statusOptions, getBadgeClasses, getStatusColor } =
  useProjectColors();

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
  startDate: "",
  dueDate: "",
});

const categoryForm = ref({ name: "", color: "zinc" });
const paymentForm = ref({ name: "", color: "zinc" });

// GitHub Sync
const showGitHubModal = ref(false);
const githubRepoInput = ref("");
const selectedProject = ref<Project | null>(null);
const syncing = ref(false);

// Inline editing state
const editingProjectId = ref<string | null>(null);
const editingField = ref<string | null>(null);

// Property editor state
const editingCategoryId = ref<string | null | "selector">(null);
const editingPaymentId = ref<string | null | "selector">(null);

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
        p.information?.toLowerCase().includes(query),
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
    (p) => p.status === "TODO" || p.status === "IN_PROGRESS",
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
      .map((p) => p.categoryId as string),
  );
  return categories.value
    .filter((c) => categoryIds.has(c.id))
    .sort((a, b) => a.name.localeCompare(b.name));
});

// Computed - Used Payment Methods (only payment methods that are used in projects)
const usedPaymentMethods = computed(() => {
  const paymentIds = new Set(
    projects.value.filter((p) => p.paymentId).map((p) => p.paymentId as string),
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
      "/projects/settings/cover",
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
    await api.delete("/projects/settings/cover");
    pageSettings.value.cover = null;
  } catch (e) {
    console.error("Failed to remove cover:", e);
  }
};

const handleCoverSelected = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedImage.value = e.target?.result as string;
    showCropperModal.value = true;
  };
  reader.readAsDataURL(file);
};

const updateTitle = async () => {
  try {
    await api.patch("/projects/settings", { title: pageSettings.value.title });
  } catch (e) {
    console.error("Failed to update title:", e);
  }
};

const updateDescription = async () => {
  try {
    await api.patch("/projects/settings", {
      description: pageSettings.value.description,
    });
  } catch (e) {
    console.error("Failed to update description:", e);
  }
};

const updateProjectField = async (
  project: Project,
  field: string,
  value: unknown,
) => {
  try {
    await api.patch(`/projects/${project.id}`, { [field]: value });
    await loadData();
    editingProjectId.value = null;
    editingField.value = null;
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
    startDate: "",
    dueDate: "",
  };
  await loadData();
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
    startDate: "",
    dueDate: "",
  };
  showModal.value = true;
};

const clearFilters = () => {
  searchQuery.value = "";
  filterStatus.value = "";
  filterCategory.value = "";
  filterPayment.value = "";
};

// Property Editor Functions
const updateCategory = async (category: {
  id: string;
  name: string;
  color: string;
}) => {
  try {
    await api.patch(`/project-categories/${category.id}`, {
      name: category.name,
      color: category.color,
    });
    await loadData();
    editingCategoryId.value = null;
  } catch (e: any) {
    console.error("Failed to update category:", e);
    alert(e.response?.data?.message || "Failed to update category");
  }
};

const deleteCategory = async (id: string) => {
  try {
    await api.delete(`/project-categories/${id}`);
    await loadData();
    editingCategoryId.value = null;
  } catch (e: any) {
    console.error("Failed to delete category:", e);
    alert(e.response?.data?.message || "Failed to delete category");
  }
};

const updatePaymentMethod = async (payment: {
  id: string;
  name: string;
  color: string;
}) => {
  try {
    await api.patch(`/payment-methods/${payment.id}`, {
      name: payment.name,
      color: payment.color,
    });
    await loadData();
    editingPaymentId.value = null;
  } catch (e: any) {
    console.error("Failed to update payment method:", e);
    alert(e.response?.data?.message || "Failed to update payment method");
  }
};

const deletePaymentMethod = async (id: string) => {
  try {
    await api.delete(`/payment-methods/${id}`);
    await loadData();
    editingPaymentId.value = null;
  } catch (e: any) {
    console.error("Failed to delete payment method:", e);
    alert(e.response?.data?.message || "Failed to delete payment method");
  }
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

const importFile = async (file: File) => {
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
      formData,
    );

    if (result.errors.length > 0) {
      alert(
        `Imported ${result.imported} projects.\nErrors:\n${result.errors.join(
          "\n",
        )}`,
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
        <PageHeader
          :page-settings="pageSettings"
          :loading="loading"
          @update:title="pageSettings.title = $event"
          @update:description="pageSettings.description = $event"
          @save:title="updateTitle"
          @save:description="updateDescription"
          @cover-selected="handleCoverSelected"
          @remove-cover="removeCover"
        />

        <StatsCards :stats="stats" :loading="loading" />

        <!-- Toolbar -->
        <div
          class="px-6 py-4 border-b border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 sticky top-0 z-10"
        >
          <!-- Bulk Actions Bar -->
          <BulkActionsBar
            v-if="selectedProjects.length > 0"
            :count="selectedProjects.length"
            @update:status="bulkUpdateStatus"
            @delete="bulkDelete"
            @clear="
              selectedProjects = [];
              selectAll = false;
            "
          />

          <ProjectFilters
            :search-query="searchQuery"
            :filter-status="filterStatus"
            :filter-category="filterCategory"
            :filter-payment="filterPayment"
            :used-categories="usedCategories"
            :used-payment-methods="usedPaymentMethods"
            :exporting="exporting"
            @update:search-query="searchQuery = $event"
            @update:filter-status="filterStatus = $event"
            @update:filter-category="filterCategory = $event"
            @update:filter-payment="filterPayment = $event"
            @clear="clearFilters"
            @export:csv="exportCsv"
            @export:xlsx="exportXlsx"
            @import="importFile"
            @new-project="openNewProjectModal()"
          />
        </div>

        <!-- Table -->
        <ProjectsTable
          v-model:editing-project-id="editingProjectId"
          v-model:editing-field="editingField"
          v-model:editing-category-id="editingCategoryId"
          v-model:editing-payment-id="editingPaymentId"
          :projects="filteredProjects"
          :selected-projects="selectedProjects"
          :select-all="selectAll"
          :loading="loading"
          :categories="categories"
          :payment-methods="paymentMethods"
          @update:selected-projects="selectedProjects = $event"
          @update:select-all="selectAll = $event"
          @update-project="updateProjectField"
          @delete-project="deleteProject"
          @open-github="openGitHubModal"
          @sync-github="syncGitHubIssues"
          @update-category="updateCategory"
          @delete-category="deleteCategory"
          @update-payment="updatePaymentMethod"
          @delete-payment="deletePaymentMethod"
        />
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
          <div>
            <label class="block text-sm font-medium mb-2.5">
              Nama Pemesan
            </label>
            <input
              v-model="form.order"
              type="text"
              placeholder="Enter customer/client name"
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
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Start Date</label>
              <DatePicker v-model="form.startDate" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Due Date</label>
              <DatePicker v-model="form.dueDate" />
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
