<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Line, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Custom Crosshair Plugin
const crosshairPlugin = {
  id: "crosshair",
  afterDatasetsDraw(chart: any) {
    if (chart.tooltip?._active?.length) {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip._active[0];
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(249, 115, 22, 0.5)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  crosshairPlugin
);

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
const loading = ref(true);

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
    const [pagesData, reposData, projectsData] = await Promise.all([
      api.get<Page[]>("/pages"),
      api.get<GithubRepo[]>("/github/repos"),
      api.get<Project[]>("/projects"),
    ]);

    pages.value = pagesData;
    githubRepos.value = reposData;
    projects.value = projectsData;
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
  } finally {
    loading.value = false;

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

/* =====================
   Computed
===================== */
const totalStars = computed(() => {
  return githubRepos.value.reduce((sum, repo) => sum + repo.stars, 0);
});

const publishedPages = computed(() => {
  return pages.value.filter((p) => p.isPublished).length;
});

const projectStats = computed(() => {
  const total = projects.value.length;
  const todo = projects.value.filter((p) => p.status === "TODO").length;
  const inProgress = projects.value.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const done = projects.value.filter((p) => p.status === "DONE").length;
  return { total, todo, inProgress, done };
});

// Projects per month (last 6 months)
const projectsPerMonth = computed(() => {
  const months = [];
  const counts = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    months.push(monthName);

    const count = projects.value.filter((p) => {
      const projectDate = new Date(p.createdAt);
      return (
        projectDate.getMonth() === date.getMonth() &&
        projectDate.getFullYear() === date.getFullYear()
      );
    }).length;
    counts.push(count);
  }

  return { months, counts };
});

// Projects by category
const projectsByCategory = computed(() => {
  const categoryMap = new Map<string, number>();

  projects.value.forEach((p) => {
    if (p.category) {
      const name = p.category.name;
      categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
    } else {
      categoryMap.set(
        "Uncategorized",
        (categoryMap.get("Uncategorized") || 0) + 1
      );
    }
  });

  return {
    labels: Array.from(categoryMap.keys()),
    data: Array.from(categoryMap.values()),
  };
});

const monthlyChartData = computed(() => ({
  labels: projectsPerMonth.value.months,
  datasets: [
    {
      label: "Projects Created",
      data: projectsPerMonth.value.counts,
      borderColor: "rgb(16, 185, 129)",
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;

        if (!chartArea) {
          return "rgba(16, 185, 129, 0.1)";
        }

        const gradient = ctx.createLinearGradient(
          0,
          chartArea.top,
          0,
          chartArea.bottom
        );
        gradient.addColorStop(0, "rgba(16, 185, 129, 0.5)");
        gradient.addColorStop(1, "rgba(16, 185, 129, 0.0)");
        return gradient;
      },
      tension: 0.4,
      fill: true,
    },
  ],
}));

const categoryChartData = computed(() => ({
  labels: projectsByCategory.value.labels,
  datasets: [
    {
      label: "Projects",
      data: projectsByCategory.value.data,
      backgroundColor: "rgba(16, 185, 129, 0.8)",
      borderColor: "rgb(16, 185, 129)",
      borderWidth: 1,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1500,
    easing: "easeOutQuart" as const,
    delay: (context: any) => {
      let delay = 0;
      if (context.type === "data" && context.mode === "default") {
        delay = context.dataIndex * 100 + context.datasetIndex * 50;
      }
      return delay;
    },
  },
  animations: {
    y: {
      from: (context: any) => {
        if (context.type === "data") {
          return context.chart.scales.y.getPixelForValue(0);
        }
      },
    },
    x: {
      from: 0,
    },
  },
  interaction: {
    mode: "index" as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      mode: "index" as const,
      intersect: false,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
  onHover: (event: any, activeElements: any) => {
    const canvas = event.native.target;
    canvas.style.cursor = activeElements.length > 0 ? "pointer" : "default";
  },
};

// Bar chart specific options with grow-up animation
const barChartOptions = {
  ...chartOptions,
  animation: {
    duration: 1200,
    easing: "easeOutBounce" as const,
    delay: (context: any) => {
      return context.dataIndex * 150;
    },
  },
  animations: {
    y: {
      from: (context: any) => {
        if (context.type === "data") {
          return context.chart.scales.y.getPixelForValue(0);
        }
      },
    },
  },
};
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

        <!-- Stats -->
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Pages -->
          <UCard
            class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
            :class="
              showStats
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
            "
            :style="{ transitionDelay: '0ms' }"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-muted">Portfolio Pages</p>
                <p class="text-3xl font-bold mt-2">
                  {{ pages.length }}
                </p>
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
          <UCard
            class="transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
            :class="
              showStats
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
            "
            :style="{ transitionDelay: '100ms' }"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-muted">GitHub Projects</p>
                <p class="text-3xl font-bold mt-2">
                  {{ githubRepos.length }}
                </p>
                <p class="text-sm text-muted mt-2">
                  {{ totalStars }} total stars
                </p>
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
              showStats
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
            "
            :style="{ transitionDelay: '200ms' }"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm text-muted">Active Projects</p>
                <p class="text-3xl font-bold mt-2">
                  {{ projectStats.total }}
                </p>
                <p class="text-sm text-muted mt-2">
                  {{ projectStats.inProgress }} in progress
                </p>
              </div>
              <div class="p-3 bg-orange-500/10 rounded-lg">
                <UIcon
                  name="i-lucide-folder-kanban"
                  class="size-6 text-orange-500"
                />
              </div>
            </div>
          </UCard>

          <!-- CTA -->
          <UCard
            class="bg-linear-to-br from-primary/10 to-primary/5 border-primary/20 transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1"
            :class="
              showStats
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
            "
            :style="{ transitionDelay: '300ms' }"
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
                  to="/projects"
                  icon="i-lucide-folder-plus"
                  size="sm"
                  variant="outline"
                >
                  New Project
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Charts -->
        <div
          v-if="!loading && projects.length > 0"
          class="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <!-- Monthly Projects Chart -->
          <UCard
            class="transition-all duration-700 ease-out hover:shadow-lg"
            :class="
              showCharts
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-8 opacity-0 scale-95'
            "
            :style="{ transitionDelay: '0ms' }"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Projects Per Month</h3>
                  <p class="text-sm text-muted mt-1">Last 6 months activity</p>
                </div>
                <div class="p-2 bg-orange-500/10 rounded-lg">
                  <UIcon
                    name="i-lucide-trending-up"
                    class="size-5 text-orange-500"
                  />
                </div>
              </div>
            </template>

            <div class="h-64">
              <ClientOnly>
                <Line
                  v-if="showCharts"
                  :data="monthlyChartData"
                  :options="chartOptions"
                />
              </ClientOnly>
            </div>
          </UCard>

          <!-- Category Distribution Chart -->
          <UCard
            class="transition-all duration-700 ease-out hover:shadow-lg"
            :class="
              showCharts
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-8 opacity-0 scale-95'
            "
            :style="{ transitionDelay: '150ms' }"
          >
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold">Projects by Category</h3>
                  <p class="text-sm text-muted mt-1">Distribution overview</p>
                </div>
                <div class="p-2 bg-blue-500/10 rounded-lg">
                  <UIcon
                    name="i-lucide-bar-chart-3"
                    class="size-5 text-blue-500"
                  />
                </div>
              </div>
            </template>

            <div class="h-64">
              <ClientOnly>
                <Bar
                  v-if="showCharts"
                  :data="categoryChartData"
                  :options="barChartOptions"
                />
              </ClientOnly>
            </div>
          </UCard>
        </div>

        <!-- Lists -->
        <div v-if="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Pages -->
          <UCard
            class="transition-all duration-700 ease-out hover:shadow-lg"
            :class="
              showLists
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
            "
            :style="{ transitionDelay: '0ms' }"
          >
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
                v-for="(page, index) in pages.slice(0, 5)"
                :key="page.id"
                :to="`/pages/${page.id}`"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                :class="
                  showLists
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-4 opacity-0'
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
              showLists
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
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
                  showLists
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-4 opacity-0'
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
              showLists
                ? 'translate-y-0 opacity-100'
                : 'translate-y-8 opacity-0'
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
                  showLists
                    ? 'translate-x-0 opacity-100'
                    : '-translate-x-4 opacity-0'
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
      </div>
    </template>
  </UDashboardPanel>
</template>
