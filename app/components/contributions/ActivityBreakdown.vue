<script setup lang="ts">
interface Props {
  commits?: number;
  pullRequests?: number;
  issues?: number;
  reviews?: number;
}

defineProps<Props>();
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-base font-semibold text-zinc-900 dark:text-white">
        Activity Overview
      </h3>
    </template>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Commits -->
      <div
        class="flex flex-col items-center p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
      >
        <div class="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 mb-3">
          <UIcon
            name="i-lucide-git-commit"
            class="size-5 text-blue-600 dark:text-blue-400"
          />
        </div>
        <p class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          {{ commits?.toLocaleString() || 0 }}
        </p>
        <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Commits
        </p>
      </div>

      <!-- Pull Requests -->
      <div
        class="flex flex-col items-center p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
      >
        <div class="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 mb-3">
          <UIcon
            name="i-lucide-git-pull-request"
            class="size-5 text-purple-600 dark:text-purple-400"
          />
        </div>
        <p class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          {{ pullRequests?.toLocaleString() || 0 }}
        </p>
        <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Pull Requests
        </p>
      </div>

      <!-- Issues -->
      <div
        class="flex flex-col items-center p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
      >
        <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 mb-3">
          <UIcon
            name="i-lucide-circle-dot"
            class="size-5 text-amber-600 dark:text-amber-400"
          />
        </div>
        <p class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          {{ issues?.toLocaleString() || 0 }}
        </p>
        <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Issues
        </p>
      </div>

      <!-- Reviews -->
      <div
        class="flex flex-col items-center p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
      >
        <div class="p-2.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 mb-3">
          <UIcon
            name="i-lucide-message-square"
            class="size-5 text-pink-600 dark:text-pink-400"
          />
        </div>
        <p class="text-2xl font-bold text-zinc-900 dark:text-white mb-1">
          {{ reviews?.toLocaleString() || 0 }}
        </p>
        <p class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Reviews
        </p>
      </div>
    </div>
  </UCard>
</template>
