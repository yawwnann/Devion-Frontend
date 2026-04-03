<script setup lang="ts">
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const { fetchProductivity, formatDate } = useProductivity();

// State
const productivity = ref<{
  currentStreak: number;
  longestStreak: number;
  todayCompleted: number;
  todayTotal: number;
  weekCompleted: number;
  weekTotal: number;
  completionRate: number;
  totalCompleted: number;
  totalTodos: number;
  dailyActivity: Array<{
    date: string;
    completed: number;
    total: number;
  }>;
} | null>(null);

const loading = ref(true);

// Chart data
const chartData = computed(() => {
  if (!productivity.value) return { labels: [], datasets: [] };

  const last7Days = productivity.value.dailyActivity.slice(-7);
  return {
    labels: last7Days.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        label: 'Completed',
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        data: last7Days.map((d) => d.completed),
        borderRadius: 4,
      },
      {
        label: 'Total',
        backgroundColor: 'rgba(113, 113, 122, 0.5)',
        data: last7Days.map((d) => d.total),
        borderRadius: 4,
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
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
};

// Fetch productivity stats
const fetchStats = async () => {
  try {
    productivity.value = await fetchProductivity();
  } catch (error) {
    console.error('Failed to fetch productivity stats:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Streak Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-orange-500/10 rounded-lg">
            <UIcon
              name="i-lucide-flame"
              class="size-6 text-orange-500"
              :class="{ 'animate-pulse': productivity?.currentStreak ?? 0 > 0 }"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Current Streak</p>
            <p class="text-2xl font-bold">
              {{ productivity?.currentStreak ?? 0 }} days
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-yellow-500/10 rounded-lg">
            <UIcon name="i-lucide-trophy" class="size-6 text-yellow-500" />
          </div>
          <div>
            <p class="text-sm text-muted">Longest Streak</p>
            <p class="text-2xl font-bold">
              {{ productivity?.longestStreak ?? 0 }} days
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Completion Rate Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-500/10 rounded-lg">
            <UIcon name="i-lucide-sun" class="size-5 text-blue-500" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted">Today</p>
            <p class="text-lg font-bold">
              {{ productivity?.todayCompleted ?? 0 }}
              <span class="text-sm text-muted"
                >/{{ productivity?.todayTotal ?? 0 }}</span
              >
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-500/10 rounded-lg">
            <UIcon name="i-lucide-calendar" class="size-5 text-green-500" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted">This Week</p>
            <p
              class="text-lg font-bold"
              :class="
                (productivity?.completionRate ?? 0) >= 80
                  ? 'text-green-500'
                  : (productivity?.completionRate ?? 0) >= 50
                  ? 'text-orange-500'
                  : 'text-red-500'
              "
            >
              {{ productivity?.completionRate ?? 0 }}%
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-500/10 rounded-lg">
            <UIcon name="i-lucide-circle-check" class="size-5 text-purple-500" />
          </div>
          <div class="flex-1">
            <p class="text-xs text-muted">All Time</p>
            <p class="text-lg font-bold text-green-600">
              {{ productivity?.totalCompleted ?? 0 }}
              <span class="text-sm text-muted"
                >/{{ productivity?.totalTodos ?? 0 }}</span
              >
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Activity Chart -->
    <UCard>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-base">Weekly Activity</h3>
      </div>

      <div v-if="loading" class="h-64 flex items-center justify-center">
        <USkeleton class="w-full h-48" />
      </div>

      <div v-else-if="!productivity?.dailyActivity.length" class="h-64 flex items-center justify-center">
        <div class="text-center">
          <UIcon
            name="i-lucide-bar-chart"
            class="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3"
          />
          <p class="text-sm text-zinc-500">No activity data yet</p>
        </div>
      </div>

      <div v-else class="h-64">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </UCard>
  </div>
</template>
