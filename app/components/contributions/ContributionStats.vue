<script setup lang="ts">
interface Props {
  currentStreak: number;
  longestStreak: number;
  activeDays: number;
  totalContributions: number;
  activityPercent: number;
  avgPerDay: string;
}

defineProps<Props>();
</script>

<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    <!-- Current Streak -->
    <UCard
      class="group sticky hover:ring-2 hover:ring-primary-500/20 transition-all duration-300"
    >
      <div class="flex flex-col h-full justify-between">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-colors"
          >
            <UIcon name="i-lucide-flame" class="size-5" />
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Current Streak
          </span>
        </div>
        <div>
          <span class="text-3xl font-bold text-zinc-900 dark:text-white">
            {{ currentStreak }}
          </span>
          <span class="text-sm text-zinc-500 ml-1">days</span>
        </div>
      </div>
    </UCard>

    <!-- Best Streak -->
    <UCard
      class="group hover:ring-2 hover:ring-yellow-500/20 transition-all duration-300"
    >
      <div class="flex flex-col h-full justify-between">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600 dark:text-yellow-400 group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50 transition-colors"
          >
            <UIcon name="i-lucide-trophy" class="size-5" />
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Best Streak
          </span>
        </div>
        <div>
          <span class="text-3xl font-bold text-zinc-900 dark:text-white">
            {{ longestStreak }}
          </span>
          <span class="text-sm text-zinc-500 ml-1">days</span>
        </div>
      </div>
    </UCard>

    <!-- Active Days -->
    <UCard
      class="group hover:ring-2 hover:ring-emerald-500/20 transition-all duration-300"
    >
      <div class="flex flex-col h-full justify-between">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors"
          >
            <UIcon name="i-lucide-calendar-check-2" class="size-5" />
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Active Days
          </span>
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-3xl font-bold text-zinc-900 dark:text-white">
            {{ activeDays }}
          </span>
          <span
            class="text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded"
          >
            {{ activityPercent }}%
          </span>
        </div>
      </div>
    </UCard>

    <!-- Daily Average -->
    <UCard
      class="group hover:ring-2 hover:ring-blue-500/20 transition-all duration-300"
    >
      <div class="flex flex-col h-full justify-between">
        <div class="flex items-center gap-3 mb-4">
          <div
            class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors"
          >
            <UIcon name="i-lucide-trending-up" class="size-5" />
          </div>
          <span
            class="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Daily Average
          </span>
        </div>
        <div>
          <span class="text-3xl font-bold text-zinc-900 dark:text-white">
            {{ avgPerDay }}
          </span>
          <span class="text-sm text-zinc-500 ml-1">contribs/day</span>
        </div>
      </div>
    </UCard>
  </div>
</template>
