<script setup lang="ts">
import { computed } from "vue";
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

const props = defineProps<{
  projects: any[];
  showCharts: boolean;
}>();

const { t } = useI18n();

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
  crosshairPlugin,
);

// Projects per month (last 6 months)
const projectsPerMonth = computed(() => {
  const months = [];
  const counts = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", { month: "short" });
    months.push(monthName);

    const count = props.projects.filter((p) => {
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

  props.projects.forEach((p) => {
    if (p.category) {
      const name = p.category.name;
      categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
    } else {
      categoryMap.set(
        t('dashboard.uncategorized'),
        (categoryMap.get(t('dashboard.uncategorized')) || 0) + 1,
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
          chartArea.bottom,
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
  <div v-if="projects.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <h3 class="text-lg font-semibold">{{ t('dashboard.projectsPerMonth') }}</h3>
            <p class="text-sm text-muted mt-1">{{ t('dashboard.last6MonthsActivity') }}</p>
          </div>
          <div class="p-2 bg-orange-500/10 rounded-lg">
            <UIcon name="i-lucide-trending-up" class="size-5 text-orange-500" />
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
            <h3 class="text-lg font-semibold">{{ t('dashboard.projectsByCategory') }}</h3>
            <p class="text-sm text-muted mt-1">{{ t('dashboard.distributionOverview') }}</p>
          </div>
          <div class="p-2 bg-blue-500/10 rounded-lg">
            <UIcon name="i-lucide-bar-chart-3" class="size-5 text-blue-500" />
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
</template>
