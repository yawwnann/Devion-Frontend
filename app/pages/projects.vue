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
const editingProject = ref<Project | null>(null);
const showCategoryModal = ref(false);
const showPaymentModal = ref(false);
const editingTitle = ref(false);
const editingDescription = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);

// Image Cropper
const showCropperModal = ref(false);
const selectedImage = ref<string | null>(null);
const croppedImage = ref<Blob | null>(null);
const uploadingCover = ref(false);

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

const categoryForm = ref({ name: "", color: "gray" });
const paymentForm = ref({ name: "", color: "gray" });

const colorOptions = [
  { label: "Gray", value: "gray" },
  { label: "Red", value: "red" },
  { label: "Orange", value: "orange" },
  { label: "Yellow", value: "yellow" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
  { label: "Purple", value: "purple" },
  { label: "Pink", value: "pink" },
];

const statusOptions = [
  { label: "To Do", value: "TODO", color: "gray" },
  { label: "In Progress", value: "IN_PROGRESS", color: "orange" },
  { label: "Done", value: "DONE", color: "green" },
];

const getStatusColor = (status: string) =>
  statusOptions.find((s) => s.value === status)?.color || "gray";

const getBadgeClasses = (color: string) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    orange:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  };
  return map[color] || map.gray;
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
  const todo = projects.value.filter((p) => p.status === "TODO").length;
  const inProgress = projects.value.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const done = projects.value.filter((p) => p.status === "DONE").length;
  return { total, todo, inProgress, done };
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
    categories.value = c;
    paymentMethods.value = pm;
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

const handleCrop = ({ canvas }: any) => {
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

const saveProject = async () => {
  if (editingProject.value) {
    await api.patch(`/projects/${editingProject.value.id}`, form.value);
  } else {
    await api.post("/projects", form.value);
  }
  showModal.value = false;
  await loadData();
};

const deleteProject = async (id: string) => {
  if (!confirm("Delete this project?")) return;
  await api.delete(`/projects/${id}`);
  await loadData();
};

const saveCategory = async () => {
  await api.post("/project-categories", categoryForm.value);
  showCategoryModal.value = false;
  categoryForm.value = { name: "", color: "gray" };
  await loadData();
};

const savePaymentMethod = async () => {
  await api.post("/payment-methods", paymentForm.value);
  showPaymentModal.value = false;
  paymentForm.value = { name: "", color: "gray" };
  await loadData();
};

const openModal = (project?: Project) => {
  editingProject.value = project || null;
  form.value = project
    ? {
        name: project.name,
        order: project.order || "",
        status: project.status,
        categoryId: project.categoryId || "",
        paymentId: project.paymentId || "",
        information: project.information || "",
      }
    : {
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

onMounted(loadData);
</script>

<template>
  <UDashboardPanel id="projects" class="!overflow-y-auto">
    <!-- Cover Image -->
    <div class="relative group">
      <div
        v-if="pageSettings.cover"
        class="h-52 w-full bg-cover bg-center"
        :style="{ backgroundImage: `url(${pageSettings.cover})` }"
      >
        <div class="absolute inset-0 bg-black/30"></div>
      </div>
      <div
        v-else
        class="h-52 w-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900"
      ></div>

      <div
        class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <button
          @click="coverInput?.click()"
          class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md backdrop-blur-sm transition"
        >
          {{ pageSettings.cover ? "Change cover" : "Add cover" }}
        </button>
        <button
          v-if="pageSettings.cover"
          @click="removeCover"
          class="px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md backdrop-blur-sm transition"
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
    <div class="px-8 py-6">
      <div class="flex items-center gap-4 mb-3 text-sm text-muted">
        <button
          class="flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <UIcon name="i-lucide-smile" class="size-4" />
          <span>Add icon</span>
        </button>
        <button
          @click="editingDescription = true"
          class="flex items-center gap-1.5 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <UIcon name="i-lucide-align-left" class="size-4" />
          <span>Add description</span>
        </button>
      </div>

      <div class="mb-4">
        <input
          v-if="editingTitle"
          v-model="pageSettings.title"
          @blur="updateTitle"
          @keyup.enter="updateTitle"
          class="text-4xl font-bold bg-transparent border-none outline-none w-full"
          autofocus
        />
        <h1
          v-else
          @click="editingTitle = true"
          class="text-4xl font-bold cursor-text hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2 py-1 transition"
        >
          {{ pageSettings.title }}
        </h1>
      </div>

      <div v-if="editingDescription || pageSettings.description" class="mb-4">
        <textarea
          v-if="editingDescription"
          v-model="pageSettings.description"
          @blur="updateDescription"
          placeholder="Add a description..."
          class="w-full bg-transparent border-none outline-none text-muted resize-none text-base"
          rows="2"
          autofocus
        ></textarea>
        <p
          v-else
          @click="editingDescription = true"
          class="text-muted cursor-text hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg px-2 -mx-2 py-1 transition"
        >
          {{ pageSettings.description }}
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="px-8 pb-4">
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div class="text-2xl font-bold">{{ stats.total }}</div>
          <div class="text-sm text-muted">Total Projects</div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          <div class="text-2xl font-bold text-gray-600">{{ stats.todo }}</div>
          <div class="text-sm text-muted">To Do</div>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div class="text-2xl font-bold text-orange-600">
            {{ stats.inProgress }}
          </div>
          <div class="text-sm text-muted">In Progress</div>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div class="text-2xl font-bold text-green-600">{{ stats.done }}</div>
          <div class="text-sm text-muted">Done</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="px-8 pb-4">
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
            class="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
          />
        </div>

        <!-- Filter Status -->
        <select
          v-model="filterStatus"
          class="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
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

        <!-- Filter Category -->
        <select
          v-model="filterCategory"
          class="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
        >
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>

        <!-- Filter Payment -->
        <select
          v-model="filterPayment"
          class="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
        >
          <option value="">All Payments</option>
          <option v-for="pm in paymentMethods" :key="pm.id" :value="pm.id">
            {{ pm.name }}
          </option>
        </select>

        <!-- Clear Filters -->
        <button
          v-if="searchQuery || filterStatus || filterCategory || filterPayment"
          @click="clearFilters"
          class="px-3 py-2 text-sm text-muted hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          Clear
        </button>

        <!-- New Button -->
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-plus"
          @click="openModal()"
          >New</UButton
        >
      </div>
    </div>

    <!-- Table -->
    <div class="px-8 py-4">
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-12" />
      </div>

      <div v-else-if="filteredProjects.length === 0" class="text-center py-16">
        <UIcon
          name="i-lucide-folder-kanban"
          class="size-16 text-gray-300 dark:text-gray-700 mx-auto mb-4"
        />
        <h3 class="text-lg font-semibold mb-2">
          {{ projects.length === 0 ? "No projects yet" : "No projects found" }}
        </h3>
        <p class="text-muted mb-6">
          {{
            projects.length === 0
              ? "Create your first project to get started"
              : "Try adjusting your filters"
          }}
        </p>
        <UButton
          v-if="projects.length === 0"
          icon="i-lucide-plus"
          @click="openModal()"
          >Create Project</UButton
        >
        <UButton v-else variant="ghost" @click="clearFilters()"
          >Clear Filters</UButton
        >
      </div>

      <table v-else class="w-full">
        <thead>
          <tr
            class="text-left text-xs uppercase tracking-wider text-muted border-b border-gray-200 dark:border-gray-800"
          >
            <th class="pb-3 font-semibold w-16">#</th>
            <th class="pb-3 font-semibold">Project</th>
            <th class="pb-3 font-semibold">Category</th>
            <th class="pb-3 font-semibold">Order</th>
            <th class="pb-3 font-semibold">Status</th>
            <th class="pb-3 font-semibold">Payment</th>
            <th class="pb-3 font-semibold">Information</th>
            <th class="pb-3 font-semibold w-20"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in filteredProjects"
            :key="project.id"
            class="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors group"
          >
            <td class="py-3.5 text-sm text-muted font-mono">
              {{ project.orderNum }}
            </td>
            <td class="py-3.5 font-medium">{{ project.name }}</td>
            <td class="py-3.5">
              <span
                v-if="project.category"
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
                  getBadgeClasses(project.category.color),
                ]"
              >
                {{ project.category.name }}
              </span>
              <span v-else class="text-sm text-muted">-</span>
            </td>
            <td class="py-3.5 text-sm text-muted">
              {{ project.order || "-" }}
            </td>
            <td class="py-3.5">
              <span
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
                  getBadgeClasses(getStatusColor(project.status)),
                ]"
              >
                {{
                  statusOptions.find((s) => s.value === project.status)?.label
                }}
              </span>
            </td>
            <td class="py-3.5">
              <span
                v-if="project.payment"
                :class="[
                  'inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold',
                  getBadgeClasses(project.payment.color),
                ]"
              >
                {{ project.payment.name }}
              </span>
              <span v-else class="text-sm text-muted">-</span>
            </td>
            <td class="py-3.5 text-sm text-muted max-w-xs truncate">
              {{ project.information || "-" }}
            </td>
            <td class="py-3.5">
              <div
                class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <UButton
                  icon="i-lucide-pencil"
                  variant="ghost"
                  size="xs"
                  color="neutral"
                  @click="openModal(project)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  size="xs"
                  color="error"
                  @click="deleteProject(project.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UDashboardPanel>

  <!-- Project Modal -->
  <UModal v-model:open="showModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-gray-950 max-w-2xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">
            {{ editingProject ? "Edit Project" : "New Project" }}
          </h3>
          <button
            @click="showModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2"
              >Project Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="form.name"
              type="text"
              placeholder="Enter project name"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Order / Client</label>
            <input
              v-model="form.order"
              type="text"
              placeholder="Enter order or client name"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Status</label>
              <select
                v-model="form.status"
                class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
              >
                <option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <div class="flex gap-2">
                <select
                  v-model="form.categoryId"
                  class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
                <button
                  type="button"
                  @click="showCategoryModal = true"
                  class="px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                >
                  <UIcon name="i-lucide-plus" class="size-5" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Payment Method</label>
            <div class="flex gap-2">
              <select
                v-model="form.paymentId"
                class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
              <button
                type="button"
                @click="showPaymentModal = true"
                class="px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
              >
                <UIcon name="i-lucide-plus" class="size-5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Information</label>
            <textarea
              v-model="form.information"
              rows="3"
              placeholder="Additional notes..."
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition resize-none"
            ></textarea>
          </div>
        </div>
        <div
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <button
            type="button"
            @click="showModal = false"
            class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveProject"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
          >
            {{ editingProject ? "Update" : "Create" }}
          </button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Category Modal -->
  <UModal v-model:open="showCategoryModal">
    <template #content>
      <div class="p-6 bg-white dark:bg-gray-950 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Category</h3>
          <button
            @click="showCategoryModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2"
              >Category Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="Enter category name"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Badge Color</label>
            <select
              v-model="categoryForm.color"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <button
            type="button"
            @click="showCategoryModal = false"
            class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="saveCategory"
            :disabled="!categoryForm.name"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition"
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
      <div class="p-6 bg-white dark:bg-gray-950 max-w-md mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Payment Method</h3>
          <button
            @click="showPaymentModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2"
              >Payment Method Name <span class="text-red-500">*</span></label
            >
            <input
              v-model="paymentForm.name"
              type="text"
              placeholder="Enter payment method name"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Badge Color</label>
            <select
              v-model="paymentForm.color"
              class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition"
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
          class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <button
            type="button"
            @click="showPaymentModal = false"
            class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="savePaymentMethod"
            :disabled="!paymentForm.name"
            class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition"
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
      <div class="bg-white dark:bg-gray-950 w-full max-w-2xl">
        <div class="p-4 border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Crop Cover Image</h3>
            <button
              @click="cancelCrop"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
              @change="handleCrop"
              class="h-80"
            />
          </ClientOnly>
        </div>

        <div
          class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2"
        >
          <button
            @click="cancelCrop"
            :disabled="uploadingCover"
            class="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="uploadCroppedCover"
            :disabled="!croppedImage || uploadingCover"
            class="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
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
