<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  pages: { id: string; status: string }[];
  githubRepos: { id: string; stars: number }[];
  projects: { id: string; status: string }[];
  showStats: boolean;
}>();

const { t } = useI18n();

const publishedPages = computed(() => {
  return props.pages.filter((p) => p.status === "PUBLISHED").length;
});

const totalStars = computed(() => {
  return props.githubRepos.reduce((sum, repo) => sum + repo.stars, 0);
});

const projectStats = computed(() => {
  const total = props.projects.length;
  const todo = props.projects.filter((p) => p.status === "TODO").length;
  const inProgress = props.projects.filter(
    (p) => p.status === "IN_PROGRESS",
  ).length;
  const done = props.projects.filter((p) => p.status === "DONE").length;
  return { total, todo, inProgress, done };
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Pages -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
      :class="
        showStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '0ms' }"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-muted">{{ t('dashboard.portfolioPages') }}</p>
          <p class="text-3xl font-bold mt-2">
            {{ pages.length }}
          </p>
          <p class="text-sm text-muted mt-2">{{ publishedPages }} {{ t('dashboard.published') }}</p>
        </div>
        <div class="p-3 bg-blue-500/10 rounded-lg">
          <UIcon name="i-lucide-file-text" class="size-6 text-blue-500" />
        </div>
      </div>
    </UCard>

    <!-- GitHub -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
      :class="
        showStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '100ms' }"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-muted">{{ t('dashboard.githubProjects') }}</p>
          <p class="text-3xl font-bold mt-2">
            {{ githubRepos.length }}
          </p>
          <p class="text-sm text-muted mt-2">{{ totalStars }} {{ t('dashboard.totalStars') }}</p>
        </div>
        <div class="p-3 bg-purple-500/10 rounded-lg">
          <UIcon name="i-lucide-github" class="size-6 text-purple-500" />
        </div>
      </div>
    </UCard>

    <!-- Projects -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
      :class="
        showStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '200ms' }"
    >
      <div class="flex items-start justify-between">
        <div>
          <p class="text-sm text-muted">{{ t('dashboard.activeProjects') }}</p>
          <p class="text-3xl font-bold mt-2">
            {{ projectStats.total }}
          </p>
          <p class="text-sm text-muted mt-2">
            {{ projectStats.inProgress }} {{ t('dashboard.inProgress') }}
          </p>
        </div>
        <div class="p-3 bg-orange-500/10 rounded-lg">
          <UIcon name="i-lucide-folder-kanban" class="size-6 text-orange-500" />
        </div>
      </div>
    </UCard>

    <!-- CTA -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
      :class="
        showStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '300ms' }"
    >
      <div class="flex flex-col h-full">
        <div class="flex items-start justify-between mb-3">
          <div>
            <p class="text-sm text-muted">{{ t('dashboard.quickActions') }}</p>
            <p class="text-2xl font-bold mt-1">{{ t('dashboard.ready') }}</p>
          </div>
          <div class="p-2 bg-primary-500/10 rounded-lg">
            <UIcon name="i-lucide-rocket" class="size-5 text-primary-500" />
          </div>
        </div>
        <p class="text-sm text-muted mb-3">{{ t('dashboard.startBuildingPortfolio') }}</p>
        <div class="flex gap-2 mt-auto">
          <UButton
            to="/documentation"
            icon="i-lucide-plus"
            size="sm"
            color="primary"
            class="flex-1 justify-center"
          >
            {{ t('dashboard.page') }}
          </UButton>
          <UButton
            to="/projects"
            icon="i-lucide-folder-plus"
            size="sm"
            variant="outline"
            class="flex-1 justify-center"
          >
            {{ t('dashboard.project') }}
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
