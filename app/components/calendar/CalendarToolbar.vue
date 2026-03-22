<script setup lang="ts">
const props = defineProps<{
  searchQuery: string;
  filterType: string;
}>();

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:filterType": [value: string];
  "sync-projects": [];
  "sync-todos": [];
  "new-event": [];
}>();

const eventTypeOptions = [
  { label: "All Types", value: "" },
  { label: "Custom", value: "custom" },
  { label: "Project", value: "project" },
  { label: "Todo", value: "todo" },
  { label: "GitHub", value: "github" },
];
</script>

<template>
  <div
    class="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10 shadow-sm"
  >
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <!-- Search -->
      <div
        class="flex-1 relative border border-zinc-200 dark:border-zinc-800 rounded-lg"
      >
        <UIcon
          name="i-lucide-search"
          class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 dark:text-zinc-400"
        />
        <input
          :value="searchQuery"
          type="text"
          placeholder="Search events..."
          class="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 outline-none"
          @input="
            emit(
              'update:searchQuery',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>

      <!-- Filter -->
      <select
        :value="filterType"
        class="px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
        @change="
          emit('update:filterType', ($event.target as HTMLSelectElement).value)
        "
      >
        <option
          v-for="option in eventTypeOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <!-- Actions -->
      <div class="flex gap-2">
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-folder"
          @click="emit('sync-projects')"
        >
          <span class="hidden lg:inline">Sync Projects</span>
          <span class="lg:hidden">Projects</span>
        </UButton>

        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-check-square"
          @click="emit('sync-todos')"
        >
          <span class="hidden lg:inline">Sync Todos</span>
          <span class="lg:hidden">Todos</span>
        </UButton>

        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-plus"
          @click="emit('new-event')"
        >
          New Event
        </UButton>
      </div>
    </div>
  </div>
</template>
