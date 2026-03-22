<script setup lang="ts">
import type { CalendarStats } from "~/types/calendar";

defineProps<{
  stats: CalendarStats;
}>();
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 px-6 py-4">
    <!-- Total Events -->
    <div
      class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
        >
          Total Events
        </span>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <UIcon
            name="i-lucide-calendar"
            class="size-4 text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </div>
      <div class="text-2xl font-bold text-zinc-900 dark:text-white">
        {{ stats.total }}
      </div>
    </div>

    <!-- Today -->
    <div
      class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
        >
          Today
        </span>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <UIcon
            name="i-lucide-calendar-check"
            class="size-4 text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </div>
      <div class="text-2xl font-bold text-zinc-900 dark:text-white">
        {{ stats.today }}
      </div>
    </div>

    <!-- Upcoming -->
    <div
      class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-emerald-200 dark:border-emerald-900/50 hover:shadow-md transition-shadow"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-emerald-600 uppercase tracking-wider"
        >
          Upcoming
        </span>
        <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <UIcon name="i-lucide-arrow-right" class="size-4 text-emerald-600" />
        </div>
      </div>
      <div class="text-2xl font-bold text-emerald-600">
        {{ stats.upcoming }}
      </div>
    </div>

    <!-- Past -->
    <div
      class="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
    >
      <div class="flex items-center justify-between mb-2">
        <span
          class="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
        >
          Past
        </span>
        <div class="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <UIcon
            name="i-lucide-check-circle-2"
            class="size-4 text-zinc-600 dark:text-zinc-400"
          />
        </div>
      </div>
      <div class="text-2xl font-bold text-zinc-900 dark:text-white">
        {{ stats.past }}
      </div>
    </div>
  </div>
</template>
