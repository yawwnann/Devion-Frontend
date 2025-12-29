<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

/* =====================
   Types
===================== */
interface Page {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
}

interface GithubRepo {
  id: string;
  name: string;
  description?: string;
  stars: number;
  url: string;
}

/* =====================
   Composables
===================== */
const api = useApi();
const { user } = useAuth();

/* =====================
   State
===================== */
const pages = ref<Page[]>([]);
const githubRepos = ref<GithubRepo[]>([]);
const loading = ref(true);

/* =====================
   Lifecycle
===================== */
onMounted(async () => {
  try {
    const [pagesData, reposData] = await Promise.all([
      api.get<Page[]>("/pages"),
      api.get<GithubRepo[]>("/github/repos"),
    ]);

    pages.value = pagesData;
    githubRepos.value = reposData;

    console.log("📄 Pages loaded:", pages.value);
    console.log("🐙 Repos loaded:", githubRepos.value);
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  } finally {
    loading.value = false;
  }
});

/* =====================
   Computed
===================== */
const totalStars = computed(() => {
  return githubRepos.value.reduce((sum, repo) => sum + repo.stars, 0);
});

const publishedPages = computed(() => {
  return pages.value.filter((p) => p.isPublished).length;
});
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-bold">
              Welcome back, {{ user?.name || "Developer" }}
            </h1>
            <UIcon name="i-lucide-sparkles" class="size-6 text-primary" />
          </div>
          <p class="text-muted mt-1">
            Build your developer portfolio with Notion-style pages and GitHub
            integration
          </p>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <USkeleton v-for="i in 3" :key="i" class="h-32" />
        </div>

        <!-- Stats -->
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Pages -->
          <UCard>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-muted">Portfolio Pages</p>
                <p class="text-3xl font-bold mt-2">{{ pages.length }}</p>
                <p class="text-sm text-muted mt-2">
                  {{ publishedPages }} published
                </p>
              </div>
              <div class="p-3 bg-blue-500/10 rounded-lg">
                <UIcon name="i-lucide-file-text" class="size-6 text-blue-500" />
              </div>
            </div>
          </UCard>

          <!-- GitHub -->
          <UCard>
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-muted">GitHub Projects</p>
                <p class="text-3xl font-bold mt-2">{{ githubRepos.length }}</p>
                <p class="text-sm text-muted mt-2">
                  {{ totalStars }} total stars
                </p>
              </div>
              <div class="p-3 bg-purple-500/10 rounded-lg">
                <UIcon name="i-lucide-github" class="size-6 text-purple-500" />
              </div>
            </div>
          </UCard>

          <!-- CTA -->
          <UCard
            class="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20"
          >
            <div class="flex flex-col h-full justify-between">
              <div>
                <p class="text-sm font-medium">Ready to create?</p>
                <p class="text-xs text-muted mt-1">
                  Start building your portfolio
                </p>
              </div>
              <div class="flex gap-2 mt-4">
                <UButton
                  to="/pages"
                  icon="i-lucide-plus"
                  size="sm"
                  color="primary"
                >
                  New Page
                </UButton>
                <UButton
                  to="/github"
                  icon="i-lucide-refresh-cw"
                  size="sm"
                  variant="outline"
                >
                  Sync GitHub
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Lists -->
        <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Pages -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">Recent Pages</h3>
                <UButton
                  to="/pages"
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
                v-for="page in pages.slice(0, 5)"
                :key="page.id"
                :to="`/pages/${page.id}`"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
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

          <!-- GitHub -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Top GitHub Projects</h3>
            </template>

            <div v-if="githubRepos.length === 0" class="text-center py-8">
              <p class="text-sm text-muted">No repositories synced</p>
            </div>

            <div v-else class="space-y-3">
              <a
                v-for="repo in githubRepos.slice(0, 5)"
                :key="repo.id"
                :href="repo.url"
                target="_blank"
                class="flex justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
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
      </div>
    </template>
  </UDashboardPanel>
</template>
