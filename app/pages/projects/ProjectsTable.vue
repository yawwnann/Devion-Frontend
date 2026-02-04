<script setup lang="ts">
import PropertyEditor from "./PropertyEditor.vue";
import type { Category, PaymentMethod, Project } from "./types";
import { useProjectColors } from "./composables/useProjectColors";

interface Props {
  projects: Project[];
  selectedProjects: string[];
  selectAll: boolean;
  loading: boolean;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  editingProjectId: string | null;
  editingField: string | null;
  editingCategoryId: string | null | "selector";
  editingPaymentId: string | null | "selector";
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:selectedProjects": [value: string[]];
  "update:selectAll": [value: boolean];
  "update:editingProjectId": [value: string | null];
  "update:editingField": [value: string | null];
  "update:editingCategoryId": [value: string | null | "selector"];
  "update:editingPaymentId": [value: string | null | "selector"];
  "update-project": [project: Project, field: string, value: any];
  "delete-project": [id: string];
  "open-github": [project: Project];
  "link-github": [project: Project];
  "sync-github": [project: Project];
  "update-category": [category: Category];
  "delete-category": [id: string];
  "update-payment": [payment: PaymentMethod];
  "delete-payment": [id: string];
}>();

const { getBadgeClasses, getStatusColor, statusOptions } = useProjectColors();

// Selection Logic
const onToggleSelectAll = (checked: boolean) => {
  emit("update:selectAll", checked);
  if (checked) {
    emit("update:selectedProjects", props.projects.map((p) => p.id));
  } else {
    emit("update:selectedProjects", []);
  }
};

const onToggleProject = (id: string) => {
  const newSelection = [...props.selectedProjects];
  const index = newSelection.indexOf(id);
  if (index > -1) {
    newSelection.splice(index, 1);
  } else {
    newSelection.push(id);
  }
  emit("update:selectedProjects", newSelection);
  emit(
    "update:selectAll",
    newSelection.length === props.projects.length && props.projects.length > 0
  );
};

// Inline Editing Logic
const startEdit = (projectId: string, field: string) => {
  emit("update:editingProjectId", projectId);
  emit("update:editingField", field);
};

const cancelEdit = () => {
  emit("update:editingProjectId", null);
  emit("update:editingField", null);
};

const onUpdateField = (project: Project, field: string, value: any) => {
  emit("update-project", project, field, value);
  cancelEdit();
};

// Helper for date formatting
const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
};
</script>

<template>
  <div class="px-6 pb-6 mt-3">
    <!-- Loading State -->
    <div v-if="loading" class="space-y-2">
      <USkeleton v-for="i in 8" :key="i" class="h-14" />
    </div>

    <!-- Empty State -->
    <div v-else-if="projects.length === 0" class="text-center py-20">
      <div
        class="inline-flex items-center justify-center p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4"
      >
        <UIcon
          name="i-lucide-folder-open"
          class="size-8 text-zinc-400 dark:text-zinc-500"
        />
      </div>
      <h3 class="text-lg font-medium text-zinc-900 dark:text-zinc-100">
        No projects found
      </h3>
      <p class="text-zinc-500 dark:text-zinc-400 mt-1">
        Try adjusting your search or filters
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50"
    >
      <table class="w-full text-left">
        <thead class="bg-zinc-50 dark:bg-zinc-900/50 text-xs uppercase text-zinc-500 font-medium">
          <tr>
            <th class="px-4 py-3 w-10">
              <input
                type="checkbox"
                :checked="selectAll"
                class="size-4 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:ring-primary-500"
                @change="onToggleSelectAll(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th class="px-4 py-3 w-12">#</th>
            <th class="px-4 py-3 min-w-[200px]">Project Name</th>
            <th class="px-4 py-3 w-20">Order</th>
            <th class="px-4 py-3 w-32">Status</th>

            <!-- Category Header -->
            <th class="px-4 py-3 w-32 relative group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
              <div class="flex items-center gap-1" @click.stop="emit('update:editingCategoryId', 'selector')">
                Category
                <UIcon name="i-lucide-chevron-down" class="size-3 opacity-0 group-hover:opacity-100 transition" />
              </div>

              <!-- Category Selector & Editor -->
              <div v-if="editingCategoryId" class="absolute top-full left-0 mt-2 z-50 text-transform-none font-normal normal-case">
                <!-- Badge Selector -->
                <div v-if="editingCategoryId === 'selector'" class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 min-w-[280px]">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Select Category</h4>
                    <button
                      class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                      @click.stop="emit('update:editingCategoryId', null)"
                    >
                      <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                  </div>
                  <div class="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      v-for="cat in categories"
                      :key="cat.id"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group/item"
                      @click.stop="emit('update:editingCategoryId', cat.id)"
                    >
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          getBadgeClasses(cat.color),
                        ]"
                      >
                        {{ cat.name }}
                      </span>
                      <UIcon name="i-lucide-pencil" class="size-3 text-muted opacity-0 group-hover/item:opacity-100 transition" />
                    </button>
                  </div>
                </div>

                <!-- Property Editor -->
                <PropertyEditor
                  v-for="cat in categories.filter(c => c.id === editingCategoryId)"
                  v-else-if="editingCategoryId !== 'selector'"
                  :key="cat.id"
                  :property="cat"
                  type="category"
                  @update="emit('update-category', $event)"
                  @delete="emit('delete-category', $event)"
                  @close="emit('update:editingCategoryId', null)"
                />
              </div>
            </th>

            <!-- Payment Header -->
            <th class="px-4 py-3 w-32 relative group cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
              <div class="flex items-center gap-1" @click.stop="emit('update:editingPaymentId', 'selector')">
                Payment
                <UIcon name="i-lucide-chevron-down" class="size-3 opacity-0 group-hover:opacity-100 transition" />
              </div>

               <!-- Payment Selector & Editor -->
              <div v-if="editingPaymentId" class="absolute top-full left-0 mt-2 z-50 text-transform-none font-normal normal-case">
                 <!-- Badge Selector -->
                <div v-if="editingPaymentId === 'selector'" class="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 min-w-[280px]">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Select Payment</h4>
                    <button
                      class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
                      @click.stop="emit('update:editingPaymentId', null)"
                    >
                      <UIcon name="i-lucide-x" class="size-4" />
                    </button>
                  </div>
                  <div class="space-y-2 max-h-60 overflow-y-auto">
                    <button
                      v-for="pm in paymentMethods"
                      :key="pm.id"
                      class="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition group/item"
                      @click.stop="emit('update:editingPaymentId', pm.id)"
                    >
                      <span
                        :class="[
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
                          getBadgeClasses(pm.color),
                        ]"
                      >
                        {{ pm.name }}
                      </span>
                      <UIcon name="i-lucide-pencil" class="size-3 text-muted opacity-0 group-hover/item:opacity-100 transition" />
                    </button>
                  </div>
                </div>

                <!-- Property Editor -->
                <PropertyEditor
                  v-for="pm in paymentMethods.filter(p => p.id === editingPaymentId)"
                  v-else-if="editingPaymentId !== 'selector'"
                  :key="pm.id"
                  :property="pm"
                  type="payment"
                  @update="emit('update-payment', $event)"
                  @delete="emit('delete-payment', $event)"
                  @close="emit('update:editingPaymentId', null)"
                />
              </div>
            </th>

            <th class="px-4 py-3">GitHub</th>
            <th class="px-4 py-3">Information</th>
            <th class="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <tr
            v-for="(project, index) in projects"
            :key="project.id"
            class="hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors group"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedProjects.includes(project.id)"
                class="size-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                @change="onToggleProject(project.id)"
              />
            </td>
            <td class="px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
              {{ index + 1 }}
            </td>

            <!-- Project Name -->
            <td class="px-4 py-3">
              <input
                v-if="editingProjectId === project.id && editingField === 'name'"
                :value="project.name"
                class="w-full px-2 py-1 text-sm font-medium bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                autofocus
                @blur="onUpdateField(project, 'name', ($event.target as HTMLInputElement).value)"
                @keyup.enter="onUpdateField(project, 'name', ($event.target as HTMLInputElement).value)"
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
                v-if="editingProjectId === project.id && editingField === 'order'"
                :value="project.order || ''"
                class="w-full px-2 py-1 text-sm bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                autofocus
                @blur="onUpdateField(project, 'order', ($event.target as HTMLInputElement).value || null)"
                @keyup.enter="onUpdateField(project, 'order', ($event.target as HTMLInputElement).value || null)"
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
                v-if="editingProjectId === project.id && editingField === 'status'"
                :value="project.status"
                class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none"
                autofocus
                @change="onUpdateField(project, 'status', ($event.target as HTMLSelectElement).value)"
                @blur="cancelEdit"
                @keyup.esc="cancelEdit"
              >
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <div
                v-else
                class="cursor-pointer"
                @click="startEdit(project.id, 'status')"
              >
                <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 text-zinc-800', getBadgeClasses(getStatusColor(project.status))]">
                  {{ project.status }}
                </span>
              </div>
            </td>

            <!-- Category -->
            <td class="px-4 py-3">
              <select
                v-if="editingProjectId === project.id && editingField === 'category'"
                :value="project.categoryId || ''"
                class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none w-full"
                autofocus
                @change="onUpdateField(project, 'categoryId', ($event.target as HTMLSelectElement).value || null)"
                @blur="cancelEdit"
                @keyup.esc="cancelEdit"
              >
                <option value="">No Category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
              <div
                v-else
                class="cursor-pointer min-h-[20px]"
                @click="startEdit(project.id, 'category')"
              >
                <span
                  v-if="project.category"
                  :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', getBadgeClasses(project.category.color)]"
                >
                  {{ project.category.name }}
                </span>
                <span v-else class="text-xs text-muted">-</span>
              </div>
            </td>

            <!-- Payment -->
             <td class="px-4 py-3">
              <select
                v-if="editingProjectId === project.id && editingField === 'payment'"
                :value="project.paymentId || ''"
                class="text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-emerald-500 rounded outline-none w-full"
                autofocus
                @change="onUpdateField(project, 'paymentId', ($event.target as HTMLSelectElement).value || null)"
                @blur="cancelEdit"
                @keyup.esc="cancelEdit"
              >
                <option value="">No Payment</option>
                <option v-for="pm in paymentMethods" :key="pm.id" :value="pm.id">
                  {{ pm.name }}
                </option>
              </select>
              <div
                v-else
                class="cursor-pointer min-h-[20px]"
                @click="startEdit(project.id, 'payment')"
              >
                <span
                  v-if="project.payment"
                  :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', getBadgeClasses(project.payment.color)]"
                >
                  {{ project.payment.name }}
                </span>
                <span v-else class="text-xs text-muted">-</span>
              </div>
            </td>

            <!-- GitHub -->
            <td class="px-4 py-3">
              <div v-if="project.githubRepo" class="flex items-center gap-2">
                <a
                  :href="project.githubUrl || '#'"
                  target="_blank"
                  class="text-xs text-zinc-600 dark:text-zinc-400 hover:text-primary-500 flex items-center gap-1"
                  @click.stop
                >
                  <UIcon name="i-lucide-github" class="size-3" />
                  {{ project.githubRepo }}
                </a>
                <button
                  class="p-1 text-zinc-400 hover:text-green-500 transition"
                  title="Sync Issues"
                  @click="emit('sync-github', project)"
                >
                  <UIcon name="i-lucide-refresh-cw" class="size-3" />
                </button>
              </div>
              <button
                v-else
                class="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 flex items-center gap-1"
                @click="emit('open-github', project)"
              >
                <UIcon name="i-lucide-plus-circle" class="size-3" />
                Link Repo
              </button>
            </td>

            <!-- Information -->
            <td class="px-4 py-3 text-xs text-zinc-500">
               <div class="space-y-1">
                 <div>Start: {{ formatDate(project.startDate) }}</div>
                 <div>Due: {{ formatDate(project.dueDate) }}</div>
                 <div v-if="project.information" class="truncate max-w-[150px]" :title="project.information">
                   {{ project.information }}
                 </div>
               </div>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="emit('delete-project', project.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
