<script setup lang="ts">
import type { Category, PaymentMethod } from "./types";
import { useProjectColors } from "./composables/useProjectColors";

interface Props {
  searchQuery: string;
  filterStatus: string;
  filterCategory: string;
  filterPayment: string;
  usedCategories: Category[];
  usedPaymentMethods: PaymentMethod[];
  exporting?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:filterStatus": [value: string];
  "update:filterCategory": [value: string];
  "update:filterPayment": [value: string];
  "clear": [];
  "export:csv": [];
  "export:xlsx": [];
  "import": [file: File];
  "new-project": [];
}>();

const { statusOptions } = useProjectColors();
const csvInput = ref<HTMLInputElement | null>(null);

const onImportFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    emit("import", input.files[0]);
  }
  if (input) input.value = "";
};
</script>

<template>
  <div class="flex items-center gap-3 overflow-x-auto pb-1">
    <!-- Search -->
    <div class="relative flex-1 min-w-[200px]">
      <UIcon
        name="i-lucide-search"
        class="absolute left-3 top-2.5 size-4 text-zinc-400"
      />
      <input
        :value="searchQuery"
        placeholder="Search projects..."
        class="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm"
        @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
      />
    </div>

    <!-- Filters -->
    <select
      :value="filterStatus"
      class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[120px]"
      @change="emit('update:filterStatus', ($event.target as HTMLSelectElement).value)"
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
      :value="filterCategory"
      class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[140px]"
      @change="emit('update:filterCategory', ($event.target as HTMLSelectElement).value)"
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
      :value="filterPayment"
      class="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border-0 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 transition text-sm min-w-[140px]"
      @change="emit('update:filterPayment', ($event.target as HTMLSelectElement).value)"
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
      v-if="searchQuery || filterStatus || filterCategory || filterPayment"
      variant="ghost"
      size="sm"
      icon="i-lucide-x"
      @click="emit('clear')"
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
      @click="emit('export:csv')"
    >
      CSV
    </UButton>

    <UButton
      variant="ghost"
      size="sm"
      icon="i-lucide-file-spreadsheet"
      :loading="exporting"
      @click="emit('export:xlsx')"
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
      @change="onImportFile"
    />

    <UButton
      color="primary"
      size="sm"
      icon="i-lucide-plus"
      @click="emit('new-project')"
    >
      New Project
    </UButton>
  </div>
</template>
