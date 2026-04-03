<script setup lang="ts">
interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  category?: { name: string; color: string } | null;
}

interface Activity {
  id: string;
  type: 'project' | 'todo' | 'page';
  action: string;
  target: string;
  timestamp: string;
}

const props = defineProps<{
  stats: {
    projects: number;
    todos: number;
    pages: number;
  };
  loadingStats: boolean;
}>();

const api = useApi();

// State
const recentProjects = ref<Project[]>([]);
const recentActivity = ref<Activity[]>([]);
const loadingProjects = ref(true);
const loadingActivity = ref(true);

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Get status color
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    TODO: 'bg-zinc-500',
    IN_PROGRESS: 'bg-blue-500',
    DONE: 'bg-green-500',
  };
  return colors[status] || 'bg-zinc-500';
};

// Get activity icon
const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    project: 'i-lucide-folder',
    todo: 'i-lucide-circle-check',
    page: 'i-lucide-file-text',
  };
  return icons[type] || 'i-lucide-circle';
};

// Get activity color
const getActivityColor = (type: string) => {
  const colors: Record<string, string> = {
    project: 'text-orange-500 bg-orange-500/10',
    todo: 'text-green-500 bg-green-500/10',
    page: 'text-blue-500 bg-blue-500/10',
  };
  return colors[type] || 'text-zinc-500 bg-zinc-500/10';
};

// Fetch recent projects
const fetchRecentProjects = async () => {
  try {
    const projects = await api.get<Project[]>('/projects?limit=5');
    recentProjects.value = Array.isArray(projects) ? projects.slice(0, 5) : [];
  } catch (error) {
    console.error('Failed to fetch recent projects:', error);
  } finally {
    loadingProjects.value = false;
  }
};

// Fetch recent activity (mock for now)
const fetchRecentActivity = async () => {
  try {
    // Mock data - can be replaced with actual API endpoint
    recentActivity.value = [
      {
        id: '1',
        type: 'project',
        action: 'Created project',
        target: 'E-commerce Website',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'todo',
        action: 'Completed task',
        target: 'Setup database schema',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        type: 'page',
        action: 'Published page',
        target: 'About Me',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
      },
    ];
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
  } finally {
    loadingActivity.value = false;
  }
};

onMounted(async () => {
  await Promise.all([fetchRecentProjects(), fetchRecentActivity()]);
});
</script>

<template>
  <div class="space-y-6">
    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-4">
      <UCard class="text-center hover:border-emerald-500 transition-colors">
        <div
          v-if="loadingStats"
          class="flex items-center justify-center h-16"
        >
          <USkeleton class="w-12 h-8" />
        </div>
        <div v-else>
          <div class="text-3xl font-bold text-emerald-600">
            {{ stats.projects }}
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Projects
          </div>
        </div>
      </UCard>

      <UCard class="text-center hover:border-emerald-500 transition-colors">
        <div
          v-if="loadingStats"
          class="flex items-center justify-center h-16"
        >
          <USkeleton class="w-12 h-8" />
        </div>
        <div v-else>
          <div class="text-3xl font-bold text-emerald-600">
            {{ stats.todos }}
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Todos
          </div>
        </div>
      </UCard>

      <UCard class="text-center hover:border-emerald-500 transition-colors">
        <div
          v-if="loadingStats"
          class="flex items-center justify-center h-16"
        >
          <USkeleton class="w-12 h-8" />
        </div>
        <div v-else>
          <div class="text-3xl font-bold text-emerald-600">
            {{ stats.pages }}
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Pages
          </div>
        </div>
      </UCard>
    </div>

    <!-- Recent Projects -->
    <UCard>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-base">Recent Projects</h3>
        <UButton to="/projects" variant="ghost" size="xs">
          View All
        </UButton>
      </div>

      <div v-if="loadingProjects" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-16" />
      </div>

      <div v-else-if="recentProjects.length === 0" class="text-center py-8">
        <UIcon
          name="i-lucide-folder"
          class="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3"
        />
        <p class="text-sm text-zinc-500">No projects yet</p>
        <UButton to="/projects" size="sm" class="mt-3">
          Create your first project
        </UButton>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="project in recentProjects"
          :key="project.id"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div
              :class="[
                'w-2 h-2 rounded-full',
                getStatusColor(project.status),
              ]"
            />
            <div>
              <p class="text-sm font-medium">{{ project.name }}</p>
              <p class="text-xs text-zinc-500">
                {{ formatDate(project.createdAt) }}
              </p>
            </div>
          </div>
          <UBadge :color="project.status === 'DONE' ? 'success' : 'neutral'" size="xs">
            {{ project.status.replace('_', ' ') }}
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- Recent Activity -->
    <UCard>
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-base">Recent Activity</h3>
      </div>

      <div v-if="loadingActivity" class="space-y-3">
        <USkeleton v-for="i in 3" :key="i" class="h-16" />
      </div>

      <div v-else-if="recentActivity.length === 0" class="text-center py-8">
        <UIcon
          name="i-lucide-activity"
          class="size-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3"
        />
        <p class="text-sm text-zinc-500">No recent activity</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="activity in recentActivity"
          :key="activity.id"
          class="flex items-start gap-3"
        >
          <div
            :class="[
              'p-2 rounded-lg',
              getActivityColor(activity.type),
            ]"
          >
            <UIcon :name="getActivityIcon(activity.type)" class="size-4" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm">
              <span class="font-medium">{{ activity.action }}</span>
              <span class="text-zinc-500"> - </span>
              <span class="text-zinc-700 dark:text-zinc-300">{{
                activity.target
              }}</span>
            </p>
            <p class="text-xs text-zinc-500 mt-1">
              {{ formatDate(activity.timestamp) }}
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
