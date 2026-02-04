<script setup lang="ts">
interface RepositoryBreakdown {
  name: string;
  commits: number;
  additions: number;
  deletions: number;
  language: string | null;
}

interface Props {
  repositories: RepositoryBreakdown[];
}

const props = defineProps<Props>();

const maxCommits = computed(() => {
  return Math.max(...props.repositories.map((r) => r.commits), 1);
});
</script>

<template>
  <UCard v-if="repositories.length > 0">
    <template #header>
      <h3 class="text-base font-semibold text-zinc-900 dark:text-white">
        Top Repositories
      </h3>
    </template>

    <div class="space-y-2">
      <div
        v-for="(repo, i) in repositories"
        :key="repo.name"
        class="flex items-center gap-3 p-3.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
      >
        <!-- Rank badge -->
        <div
          class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
          :class="[
            i === 0 &&
              'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
            i === 1 &&
              'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300',
            i === 2 &&
              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
            i > 2 &&
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
          ]"
        >
          {{ i + 1 }}
        </div>

        <!-- Repo info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <h4
              class="font-semibold text-sm text-zinc-900 dark:text-white truncate"
            >
              {{ repo.name }}
            </h4>
            <span
              v-if="repo.language"
              class="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
            >
              {{ repo.language }}
            </span>
          </div>

          <div
            class="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-git-commit" class="size-3.5" />
              <span class="font-semibold">{{
                repo.commits.toLocaleString()
              }}</span>
            </div>
            <div
              v-if="repo.additions > 0 || repo.deletions > 0"
              class="flex items-center gap-2"
            >
              <span class="text-green-600 dark:text-green-400">
                +{{ repo.additions.toLocaleString() }}
              </span>
              <span class="text-red-600 dark:text-red-400">
                -{{ repo.deletions.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Commit percentage -->
        <div
          class="flex-shrink-0 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
        >
          {{ Math.round((repo.commits / maxCommits) * 100) }}%
        </div>
      </div>
    </div>
  </UCard>
</template>
