<script setup lang="ts">
import { ref, onMounted } from "vue";
import DashboardStats from "~/components/dashboard/DashboardStats.vue";
import DashboardCharts from "~/components/dashboard/DashboardCharts.vue";
import DashboardLists from "~/components/dashboard/DashboardLists.vue";

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

/* =====================
   State
===================== */
const pages = ref<Page[]>([]);
const githubRepos = ref<GithubRepo[]>([]);
const projects = ref<Project[]>([]);
const publishedArticles = ref<Page[]>([]);
const loading = ref(true);
const articlesLoading = ref(true);

// Animation states
const showHeader = ref(false);
const showStats = ref(false);
const showCharts = ref(false);
const showLists = ref(false);

/* =====================
   Lifecycle
===================== */
onMounted(async () => {
  // Start header animation immediately
  setTimeout(() => {
    showHeader.value = true;
  }, 100);

  try {
    const [pagesData, reposData, projectsData, articlesData] =
      await Promise.all([
        api.get<Page[]>("/documentation"),
        api.get<GithubRepo[]>("/github/repos"),
        api.get<Project[]>("/projects"),
        api.get<Page[]>("/documentation/published"),
      ]);

    console.log("[Dashboard] Pages:", pagesData);
    console.log("[Dashboard] Published articles:", articlesData);

    pages.value = pagesData;
    githubRepos.value = reposData;
    projects.value = projectsData;
    publishedArticles.value = articlesData;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  } finally {
    loading.value = false;
    articlesLoading.value = false;

    // Staggered animations after loading
    setTimeout(() => {
      showStats.value = true;
    }, 200);
    setTimeout(() => {
      showCharts.value = true;
    }, 400);
    setTimeout(() => {
      showLists.value = true;
    }, 600);
  }
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
              Welcome back, {{ user?.name || "Developer" }}
            </h1>
            <UIcon
              name="i-lucide-sparkles"
              class="size-6 text-primary animate-pulse"
            />
          </div>
          <p class="text-muted mt-1">
            Build your developer portfolio with Notion-style pages and GitHub
            integration
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
          <!-- Stats -->
          <DashboardStats
            :pages="pages"
            :github-repos="githubRepos"
            :projects="projects"
            :show-stats="showStats"
          />

          <!-- Charts -->
          <DashboardCharts :projects="projects" :show-charts="showCharts" />

          <!-- Lists -->
          <DashboardLists
            :pages="pages"
            :projects="projects"
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
