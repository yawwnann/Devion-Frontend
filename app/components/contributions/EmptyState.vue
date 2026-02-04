<script setup lang="ts">
interface Props {
  variant: "not-connected" | "loading";
}

defineProps<Props>();
</script>

<template>
  <div>
    <!-- Loading State -->
    <div
      v-if="variant === 'loading'"
      class="flex flex-col items-center justify-center py-32"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-10 animate-spin text-primary-500 mb-4"
      />
      <p class="text-sm text-zinc-500 font-medium">Syncing GitHub data...</p>
    </div>

    <!-- Not Connected State -->
    <div
      v-else-if="variant === 'not-connected'"
      class="flex flex-col items-center justify-center py-32 text-center"
    >
      <div
        class="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-6 animate-pulse"
      >
        <UIcon name="i-lucide-github" class="size-12 text-zinc-400" />
      </div>
      <h3 class="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        GitHub Not Connected
      </h3>
      <p class="text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
        Connect your GitHub account to visualize your coding activity, streaks,
        and repository stats.
      </p>
      <UButton
        to="/github"
        size="lg"
        icon="i-lucide-link"
        color="neutral"
        class="bg-black text-white dark:bg-white dark:text-black hover:scale-105 transition-transform"
      >
        Connect GitHub Account
      </UButton>
    </div>
  </div>
</template>
