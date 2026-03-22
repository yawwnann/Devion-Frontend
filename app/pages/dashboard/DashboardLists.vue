<script setup lang="ts">
const props = defineProps<{
  pages: any[];
  projects: any[];
  githubRepos: any[];
  showLists: boolean;
}>();
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Pages -->
    <UCard
      class="transition-all duration-700 ease-out hover:shadow-lg"
      :class="
        showLists ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '0ms' }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Recent Pages</h3>
          <UButton
            to="/documentation"
            variant="ghost"
            size="xs"
            trailing-icon="i-lucide-arrow-right"
          >
            View all
          </UButton>
        </div>
      </template>

      <div v-if="pages.length === 0" class="text-center py-8">
        <UIcon
          name="i-lucide-file-text"
          class="size-12 text-muted mx-auto mb-3"
        />
        <p class="text-sm text-muted">No pages yet</p>
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="(page, index) in pages.slice(0, 5)"
          :key="page.id"
          :to="`/documentation/${page.id}`"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          :class="
            showLists ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          "
          :style="{ transitionDelay: `${index * 50}ms` }"
        >
          <div>
            <p class="font-medium truncate">{{ page.title }}</p>
            <p class="text-xs text-muted truncate">/{{ page.slug }}</p>
          </div>

          <UBadge
            :color="page.isPublished ? 'success' : 'neutral'"
            variant="subtle"
            size="xs"
          >
            {{ page.isPublished ? "Published" : "Draft" }}
          </UBadge>
        </NuxtLink>
      </div>
    </UCard>

    <!-- Projects -->
    <UCard
      class="transition-all duration-700 ease-out hover:shadow-lg"
      :class="
        showLists ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '100ms' }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold">Recent Projects</h3>
          <UButton
            to="/projects"
            variant="ghost"
            size="xs"
            trailing-icon="i-lucide-arrow-right"
          >
            View all
          </UButton>
        </div>
      </template>

      <div v-if="projects.length === 0" class="text-center py-8">
        <UIcon
          name="i-lucide-folder-kanban"
          class="size-12 text-muted mx-auto mb-3"
        />
        <p class="text-sm text-muted">No projects yet</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(project, index) in projects.slice(0, 5)"
          :key="project.id"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          :class="
            showLists ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          "
          :style="{ transitionDelay: `${index * 50}ms` }"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              {{ project.name }}
            </p>
            <p class="text-xs text-muted truncate">
              {{ project.order || "No client" }}
            </p>
          </div>

          <UBadge
            :color="
              project.status === 'DONE'
                ? 'success'
                : project.status === 'IN_PROGRESS'
                  ? 'warning'
                  : 'neutral'
            "
            variant="subtle"
            size="xs"
          >
            {{
              project.status === "DONE"
                ? "Done"
                : project.status === "IN_PROGRESS"
                  ? "In Progress"
                  : "To Do"
            }}
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- GitHub -->
    <UCard
      class="transition-all duration-700 ease-out hover:shadow-lg"
      :class="
        showLists ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      "
      :style="{ transitionDelay: '200ms' }"
    >
      <template #header>
        <h3 class="text-lg font-semibold">Top GitHub Projects</h3>
      </template>

      <div v-if="githubRepos.length === 0" class="text-center py-8">
        <p class="text-sm text-muted">No repositories synced</p>
      </div>

      <div v-else class="space-y-3">
        <a
          v-for="(repo, index) in githubRepos.slice(0, 5)"
          :key="repo.id"
          :href="repo.url"
          target="_blank"
          class="flex justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
          :class="
            showLists ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
          "
          :style="{ transitionDelay: `${index * 50}ms` }"
        >
          <div>
            <p class="font-medium truncate">{{ repo.name }}</p>
            <p class="text-xs text-muted truncate">
              {{ repo.description || "No description" }}
            </p>
          </div>

          <div class="flex items-center gap-1">
            <UIcon name="i-lucide-star" class="size-3 text-yellow-500" />
            <span class="text-xs font-medium">{{ repo.stars }}</span>
          </div>
        </a>
      </div>
    </UCard>
  </div>
</template>
