<script setup lang="ts">
interface Stats {
  total: number;
  todo: number;
  done: number;
}

defineProps<{
  stats: Stats;
  loading?: boolean;
}>();
</script>

<template>
  <div class="px-6 py-5 bg-zinc-50/50 dark:bg-zinc-900/20">
    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-3 gap-4">
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 h-[88px] animate-pulse"
      />
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid grid-cols-3 gap-4">
      <!-- Total -->
      <div
        class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-muted uppercase tracking-wider"
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

      <!-- Todo -->
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

      <!-- Done -->
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
</template>
