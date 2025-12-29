<script setup lang="ts">
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
const uploadingCover = ref(false);
const editingTitle = ref(false);
const editingDescription = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);

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
  { label: "In Progress", value: "IN_PROGRESS", color: "blue" },
  { label: "Done", value: "DONE", color: "green" },
];

const getStatusColor = (status: string) => {
  return statusOptions.find((s) => s.value === status)?.color || "gray";
};

const getBadgeClasses = (color: string) => {
  const colorMap: Record<string, string> = {
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
  return colorMap[color] || colorMap.gray;
};

const loadData = async () => {
  loading.value = true;
  try {
    const [projectsData, categoriesData, paymentMethodsData, settingsData] =
      await Promise.all([
        api.get<Project[]>("/projects"),
        api.get<Category[]>("/project-categories"),
        api.get<PaymentMethod[]>("/payment-methods"),
        api.get<PageSettings>("/projects/settings"),
      ]);
    projects.value = projectsData;
    categories.value = categoriesData;
    paymentMethods.value = paymentMethodsData;
    pageSettings.value = settingsData;
  } catch (e) {
    console.error("Failed to load data:", e);
  } finally {
    loading.value = false;
  }
};

const uploadCover = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  uploadingCover.value = true;
  try {
    const formData = new FormData();
    formData.append("file", input.files[0]);
    const result = await api.upload<PageSettings>(
      "/projects/settings/cover",
      formData
    );
    pageSettings.value = result;
  } catch (e) {
    console.error("Failed to upload cover:", e);
  } finally {
    uploadingCover.value = false;
    input.value = "";
  }
};

const removeCover = async () => {
  try {
    const result = await api.delete<PageSettings>("/projects/settings/cover");
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

const updateIcon = async (icon: string) => {
  pageSettings.value.icon = icon;
  try {
    await api.patch("/projects/settings", { icon });
  } catch (e) {
    console.error("Failed to update icon:", e);
  }
};

const openModal = (project?: Project) => {
  if (project) {
    editingProject.value = project;
    form.value = {
      name: project.name,
      order: project.order || "",
      status: project.status,
      categoryId: project.categoryId || "",
      paymentId: project.paymentId || "",
      information: project.information || "",
    };
  } else {
    editingProject.value = null;
    form.value = {
      name: "",
      order: "",
      status: "TODO",
      categoryId: "",
      paymentId: "",
      information: "",
    };
  }
  showModal.value = true;
};

const saveProject = async () => {
  try {
    if (editingProject.value) {
      await api.patch(`/projects/${editingProject.value.id}`, form.value);
    } else {
      await api.post("/projects", form.value);
    }
    showModal.value = false;
    await loadData();
  } catch (e) {
    console.error("Failed to save project:", e);
  }
};

const deleteProject = async (id: string) => {
  if (!confirm("Delete this project?")) return;
  try {
    await api.delete(`/projects/${id}`);
    await loadData();
  } catch (e) {
    console.error("Failed to delete project:", e);
  }
};

const saveCategory = async () => {
  try {
    await api.post("/project-categories", categoryForm.value);
    await loadData();
    showCategoryModal.value = false;
    categoryForm.value = { name: "", color: "gray" };
  } catch (e) {
    console.error("Failed to save category:", e);
  }
};

const savePaymentMethod = async () => {
  try {
    await api.post("/payment-methods", paymentForm.value);
    await loadData();
    showPaymentModal.value = false;
    paymentForm.value = { name: "", color: "gray" };
  } catch (e) {
    console.error("Failed to save payment method:", e);
  }
};

onMounted(loadData);
</script>

<template>
  <UDashboardPanel id="projects" class="!overflow-y-auto">
    <!-- Cover Image -->
    <div class="relative group">
      <div
        v-if="pageSettings.cover"
        class="h-48 w-full bg-cover bg-center"
        :style="{ backgroundImage: `url(${pageSettings.cover})` }"
      >
        <div class="absolute inset-0 bg-black/20" />
      </div>
      <div
        v-else
        class="h-48 w-full bg-gradient-to-r from-gray-800 to-gray-900"
      />

      <!-- Cover Actions -->
      <div
        class="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition"
      >
        <button
          @click="coverInput?.click()"
          class="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-md backdrop-blur-sm transition"
        >
          {{ pageSettings.cover ? "Change cover" : "Add cover" }}
        </button>
        <button
          v-if="pageSettings.cover"
          @click="removeCover"
          class="px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white text-sm rounded-md backdrop-blur-sm transition"
        >
          Remove
        </button>
      </div>
      <input
        ref="coverInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="uploadCover"
      />
    </div>

    <!-- Page Header -->
    <div class="px-6 -mt-6 relative z-10">
      <!-- Icon -->
      <div class="flex items-center gap-3 mb-4">
        <button
          class="text-4xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition"
          @click="updateIcon(pageSettings.icon === '📊' ? '📁' : '📊')"
        >
          {{ pageSettings.icon || "📊" }}
        </button>
        <button
          class="text-sm text-muted hover:text-gray-600 dark:hover:text-gray-400"
          @click="editingDescription = true"
        >
          + Add description
        </button>
      </div>

      <!-- Title -->
      <div class="mb-2">
        <input
          v-if="editingTitle"
          v-model="pageSettings.title"
          @blur="updateTitle"
          @keyup.enter="updateTitle"
          class="text-3xl font-bold bg-transparent border-none outline-none w-full"
          autofocus
        />
        <h1
          v-else
          @click="editingTitle = true"
          class="text-3xl font-bold cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1"
        >
          {{ pageSettings.title }}
        </h1>
      </div>

      <!-- Description -->
      <div v-if="editingDescription || pageSettings.description" class="mb-6">
        <textarea
          v-if="editingDescription"
          v-model="pageSettings.description"
          @blur="updateDescription"
          placeholder="Add a description..."
          class="w-full bg-transparent border-none outline-none text-muted resize-none"
          rows="2"
          autofocus
        />
        <p
          v-else
          @click="editingDescription = true"
          class="text-muted cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -mx-1"
        >
          {{ pageSettings.description }}
        </p>
      </div>
    </div>
  </UDashboardPanel>
</template>

    <!-- Toolbar -->
    <div class="px-6 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center gap-2">
        <UButton variant="ghost" size="sm" icon="i-lucide-layout-grid">
          Show All
        </UButton>
      </div>
      <div class="flex items-center gap-2">
        <UButton variant="ghost" size="sm" icon="i-lucide-filter" />
        <UButton variant="ghost" size="sm" icon="i-lucide-arrow-up-down" />
        <UButton variant="ghost" size="sm" icon="i-lucide-search" />
        <UButton color="primary" size="sm" icon="i-lucide-plus" @click="openModal()">
          New
        </UButton>
      </div>
    </div>

    <!-- Table -->
    <div class="px-6 py-4">
      <div v-if="loading" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-12" />
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-folder-kanban" class="size-12 text-muted mx-auto mb-4" />
        <h3 class="font-semibold mb-2">No projects yet</h3>
        <p class="text-muted mb-4">Create your first project to get started</p>
        <UButton icon="i-lucide-plus" @click="openModal()">Create Project</UButton>
      </div>

      <table v-else class="w-full">
        <thead>
          <tr class="text-left text-sm text-muted border-b border-gray-200 dark:border-gray-800">
            <th class="pb-3 font-medium w-16"># NO</th>
            <th class="pb-3 font-medium">Aa PROJECT</th>
            <th class="pb-3 font-medium">≡ ORDER</th>
            <th class="pb-3 font-medium">◉ STATUS</th>
            <th class="pb-3 font-medium">◉ PAYMENT</th>
            <th class="pb-3 font-medium">≡ INFORMATION</th>
            <th class="pb-3 font-medium w-20"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="project in projects"
            :key="project.id"
            class="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/50"
          >
            <td class="py-3 text-sm text-muted">{{ project.orderNum }}</td>
            <td class="py-3 font-medium">{{ project.name }}</td>
            <td class="py-3 text-sm">{{ project.order || "-" }}</td>
            <td class="py-3">
              <span
                :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', getBadgeClasses(getStatusColor(project.status))]"
              >
                {{ statusOptions.find((s) => s.value === project.status)?.label }}
              </span>
            </td>
            <td class="py-3">
              <span
                v-if="project.payment"
                :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', getBadgeClasses(project.payment.color)]"
              >
                {{ project.payment.name }}
              </span>
              <span v-else class="text-sm text-muted">-</span>
            </td>
            <td class="py-3 text-sm text-muted max-w-xs truncate">{{ project.information || "-" }}</td>
            <td class="py-3">
              <div class="flex items-center gap-1">
                <UButton icon="i-lucide-pencil" variant="ghost" size="xs" color="gray" @click="openModal(project)" />
                <UButton icon="i-lucide-trash-2" variant="ghost" size="xs" color="red" @click="deleteProject(project.id)" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UDashboardPanel>

  <!-- Project Modal -->
  <UModal v-model:open="showModal" :ui="{ width: 'sm:max-w-2xl' }">
    <template #content>
      <div class="p-6 bg-white dark:bg-gray-950">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">{{ editingProject ? "Edit Project" : "New Project" }}</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2">Project Name <span class="text-red-500">*</span></label>
            <input v-model="form.name" type="text" placeholder="Enter project name" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Order / Client</label>
            <input v-model="form.order" type="text" placeholder="Enter order or client name" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-2">Status</label>
              <select v-model="form.status" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Category</label>
              <div class="flex gap-2">
                <select v-model="form.categoryId" class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none">
                  <option value="">No Category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
                <button type="button" @click="showCategoryModal = true" class="px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                  <UIcon name="i-lucide-plus" class="size-5" />
                </button>
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Payment Method</label>
            <div class="flex gap-2">
              <select v-model="form.paymentId" class="flex-1 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none">
                <option value="">No Payment</option>
                <option v-for="pm in paymentMethods" :key="pm.id" :value="pm.id">{{ pm.name }}</option>
              </select>
              <button type="button" @click="showPaymentModal = true" class="px-3 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                <UIcon name="i-lucide-plus" class="size-5" />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Information</label>
            <textarea v-model="form.information" rows="3" placeholder="Additional notes..." class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none resize-none" />
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
          <button type="button" @click="saveProject" class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">{{ editingProject ? "Update" : "Create" }}</button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Category Modal -->
  <UModal v-model:open="showCategoryModal" :ui="{ width: 'sm:max-w-md' }">
    <template #content>
      <div class="p-6 bg-white dark:bg-gray-950">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Category</h3>
          <button @click="showCategoryModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2">Category Name <span class="text-red-500">*</span></label>
            <input v-model="categoryForm.name" type="text" placeholder="Enter category name" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Badge Color</label>
            <select v-model="categoryForm.color" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none">
              <option v-for="color in colorOptions" :key="color.value" :value="color.value">{{ color.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Preview</label>
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', getBadgeClasses(categoryForm.color)]">
              {{ categoryForm.name || "Category Name" }}
            </span>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button type="button" @click="showCategoryModal = false" class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
          <button type="button" @click="saveCategory" :disabled="!categoryForm.name" class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg">Add Category</button>
        </div>
      </div>
    </template>
  </UModal>

  <!-- Payment Modal -->
  <UModal v-model:open="showPaymentModal" :ui="{ width: 'sm:max-w-md' }">
    <template #content>
      <div class="p-6 bg-white dark:bg-gray-950">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Add New Payment Method</h3>
          <button @click="showPaymentModal = false" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2">Payment Method Name <span class="text-red-500">*</span></label>
            <input v-model="paymentForm.name" type="text" placeholder="Enter payment method name" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Badge Color</label>
            <select v-model="paymentForm.color" class="w-full px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg outline-none">
              <option v-for="color in colorOptions" :key="color.value" :value="color.value">{{ color.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Preview</label>
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', getBadgeClasses(paymentForm.color)]">
              {{ paymentForm.name || "Payment Method" }}
            </span>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <button type="button" @click="showPaymentModal = false" class="px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
          <button type="button" @click="savePaymentMethod" :disabled="!paymentForm.name" class="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg">Add Payment</button>
        </div>
      </div>
    </template>
  </UModal>
</template>
