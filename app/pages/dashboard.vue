<script setup lang="ts">
import { ref } from "vue";
import DashboardStats from "~/components/dashboard/DashboardStats.vue";
import DashboardCharts from "~/components/dashboard/DashboardCharts.vue";
import DashboardLists from "~/components/dashboard/DashboardLists.vue";
import ProductivityStats from "~/components/dashboard/ProductivityStats.vue";

/* =====================
   Types
===================== */
interface Page {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PRIVATE" | "PUBLISHED";
  publishedAt?: string;
}

interface GithubRepo {
  id: string;
  name: string;
  description?: string;
  stars: number;
  url: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  order: string | null;
  information: string | null;
  createdAt: string;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
  payment?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

/* =====================
   Composables
===================== */
const api = useApi();
const { user } = useAuth();
const { t } = useI18n();

/* =====================
   Data Fetching with useAsyncData (SSR + Parallel)
===================== */
// Fetch primary dashboard data in parallel with SSR support
const { data: pages, pending: pagesLoading } = await useAsyncData<Page[]>(
  "dashboard-pages",
  () => api.get<Page[]>("/documentation"),
  { server: true, lazy: false }
);

const { data: projects, pending: projectsLoading } = await useAsyncData<Project[]>(
  "dashboard-projects",
  () => api.get<Project[]>("/projects"),
  { server: true, lazy: false }
);

const { data: publishedArticles, pending: articlesLoading } = await useAsyncData<Page[]>(
  "dashboard-articles",
  () => api.get<Page[]>("/documentation/published"),
  { server: true, lazy: false }
);

// Fetch GitHub repos in background (non-blocking, client-side only)
const githubRepos = ref<GithubRepo[]>([]);
const { execute: fetchGithubRepos } = await useAsyncData<GithubRepo[]>(
  "dashboard-github",
  () => api.get<GithubRepo[]>("/github/repos"),
  { 
    server: false, // Client-side only
    lazy: true,    // Non-blocking
    immediate: true,
    default: () => [],
  }
);

// Combine loading states
const loading = computed(() => pagesLoading.value || projectsLoading.value);

// Animation states
const showHeader = ref(false);
const showProductivity = ref(false);
const showStats = ref(false);
const showCharts = ref(false);
const showLists = ref(false);

/* =====================
   Lifecycle
===================== */
onMounted(() => {
  // Start header animation immediately
  setTimeout(() => {
    showHeader.value = true;
  }, 100);

  // Animations for other sections
  setTimeout(() => {
    showProductivity.value = true;
  }, 50);
  setTimeout(() => {
    showStats.value = true;
  }, 100);
  setTimeout(() => {
    showCharts.value = true;
  }, 150);
  setTimeout(() => {
    showLists.value = true;
  }, 200);
});
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <AppNavbar :title="t('sidebar.dashboard')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <!-- The right slot with our individual icons were handled by AppNavbar now -->
      </AppNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div
          class="transition-all duration-700 ease-out"
          :class="
            showHeader
              ? 'translate-y-0 opacity-100'
              : '-translate-y-4 opacity-0'
          "
        >
          <div class="flex items-center gap-2">
            <h1 class="text-3xl font-bold">
              {{ t("dashboard.welcomeBack") }},
              {{ user?.name || t("dashboard.developer") }}
            </h1>
            <UIcon
              name="i-lucide-sparkles"
              class="size-6 text-primary animate-pulse"
            />
          </div>
          <p class="text-muted mt-1">
            {{ t("dashboard.welcomeMessage") }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="loading">
          <!-- Stats Loading -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <USkeleton v-for="i in 4" :key="i" class="h-32" />
          </div>

          <!-- Charts Loading -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <USkeleton v-for="i in 2" :key="i" class="h-80" />
          </div>

          <!-- Lists Loading -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <USkeleton v-for="i in 3" :key="i" class="h-96" />
          </div>
        </div>

        <template v-else>
          <!-- Productivity Stats (4 cards grid) -->
          <ProductivityStats :show-stats="showProductivity" />

          <!-- Stats Grid (4 cards) -->
          <DashboardStats
            :pages="pages || []"
            :github-repos="githubRepos"
            :projects="projects || []"
            :show-stats="showStats"
          />

          <!-- Charts -->
          <DashboardCharts :projects="projects || []" :show-charts="showCharts" />

          <!-- Lists -->
          <DashboardLists
            :pages="pages || []"
            :projects="projects || []"
            :github-repos="githubRepos"
            :show-lists="showLists"
          />

          <!-- Articles -->
          <ArticlesSection title="Latest Articles" :limit="3" />
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
