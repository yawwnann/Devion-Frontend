<script setup lang="ts">
const api = useApi();

// Badge definitions
const badgeDefinitions = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first todo',
    icon: 'i-lucide-circle-check',
    color: 'blue',
    condition: (stats: any) => stats.todosCompleted >= 1,
  },
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Reach a 7 day streak',
    icon: 'i-lucide-flame',
    color: 'orange',
    condition: (stats: any) => stats.currentStreak >= 7,
  },
  {
    id: 'project_master',
    name: 'Project Master',
    description: 'Complete 10 projects',
    icon: 'i-lucide-folder-kanban',
    color: 'purple',
    condition: (stats: any) => stats.projectsCompleted >= 10,
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete 5 todos in one day',
    icon: 'i-lucide-zap',
    color: 'yellow',
    condition: (stats: any) => stats.maxTodosInDay >= 5,
  },
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Reach a 30 day streak',
    icon: 'i-lucide-target',
    color: 'red',
    condition: (stats: any) => stats.currentStreak >= 30,
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Complete 100 todos',
    icon: 'i-lucide-award',
    color: 'emerald',
    condition: (stats: any) => stats.todosCompleted >= 100,
  },
  {
    id: 'creator',
    name: 'Creator',
    description: 'Create your first project',
    icon: 'i-lucide-plus',
    color: 'pink',
    condition: (stats: any) => stats.projectsCreated >= 1,
  },
  {
    id: 'writer',
    name: 'Writer',
    description: 'Publish your first page',
    icon: 'i-lucide-file-text',
    color: 'cyan',
    condition: (stats: any) => stats.pagesPublished >= 1,
  },
];

// State
const unlockedBadges = ref<string[]>([]);
const stats = ref({
  todosCompleted: 0,
  projectsCompleted: 0,
  projectsCreated: 0,
  pagesPublished: 0,
  currentStreak: 0,
  maxTodosInDay: 0,
});
const loading = ref(true);

// Get badge color classes
const getColorClasses = (color: string, unlocked: boolean) => {
  const colors: Record<string, string> = {
    blue: unlocked
      ? 'bg-blue-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    orange: unlocked
      ? 'bg-orange-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    purple: unlocked
      ? 'bg-purple-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    yellow: unlocked
      ? 'bg-yellow-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    red: unlocked
      ? 'bg-red-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    emerald: unlocked
      ? 'bg-emerald-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    pink: unlocked
      ? 'bg-pink-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
    cyan: unlocked
      ? 'bg-cyan-500 text-white'
      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400',
  };
  return colors[color] || colors.blue;
};

// Fetch user stats and badges
const fetchBadges = async () => {
  try {
    // Fetch productivity stats for streak info
    const productivity = await api.get('/analytics/productivity');
    
    // Fetch projects count
    const projects = await api.get('/projects');
    const projectsArray = Array.isArray(projects) ? projects : [];
    
    // Mock stats - can be enhanced with actual backend endpoint
    stats.value = {
      todosCompleted: productivity?.totalCompleted || 0,
      projectsCompleted: projectsArray.filter((p: any) => p.status === 'DONE').length || 0,
      projectsCreated: projectsArray.length || 0,
      pagesPublished: 0, // Would need API endpoint
      currentStreak: productivity?.currentStreak || 0,
      maxTodosInDay: 5, // Would need API endpoint
    };

    // Check unlocked badges
    unlockedBadges.value = badgeDefinitions
      .filter((badge) => badge.condition(stats.value))
      .map((badge) => badge.id);
  } catch (error) {
    console.error('Failed to fetch badges:', error);
  } finally {
    loading.value = false;
  }
};

const progress = computed(() => {
  return Math.round((unlockedBadges.value.length / badgeDefinitions.length) * 100);
});

onMounted(() => {
  fetchBadges();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Progress Card -->
    <UCard>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-base">Badge Collection</h3>
          <p class="text-sm text-muted mt-1">
            {{ unlockedBadges.length }} of {{ badgeDefinitions.length }} unlocked
          </p>
        </div>
        <div class="text-right">
          <p class="text-2xl font-bold">{{ progress }}%</p>
        </div>
      </div>

      <div class="relative pt-2">
        <div class="flex mb-2 items-center justify-between">
          <div class="text-right">
            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-zinc-600 bg-zinc-200 dark:text-zinc-400 dark:bg-zinc-800">
              Progress
            </span>
          </div>
        </div>
        <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-zinc-200 dark:bg-zinc-800">
          <div
            :style="{ width: progress + '%' }"
            class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
          />
        </div>
      </div>
    </UCard>

    <!-- Badges Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UCard
        v-for="badge in badgeDefinitions"
        :key="badge.id"
        :class="[
          'transition-all duration-300',
          unlockedBadges.includes(badge.id)
            ? 'border-emerald-500 dark:border-emerald-500 hover:shadow-lg hover:-translate-y-1'
            : 'opacity-60 grayscale',
        ]"
      >
        <div class="flex flex-col items-center text-center p-2">
          <div
            :class="[
              'p-4 rounded-full mb-3 transition-all',
              getColorClasses(badge.color, unlockedBadges.includes(badge.id)),
            ]"
          >
            <UIcon :name="badge.icon" class="size-8" />
          </div>

          <h4 class="font-semibold text-sm mb-1">
            {{ badge.name }}
          </h4>

          <p class="text-xs text-muted">
            {{ badge.description }}
          </p>

          <div
            v-if="unlockedBadges.includes(badge.id)"
            class="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <UIcon name="i-lucide-check" class="size-3" />
            <span>Unlocked</span>
          </div>

          <div
            v-else
            class="mt-2 flex items-center gap-1 text-xs text-zinc-500"
          >
            <UIcon name="i-lucide-lock" class="size-3" />
            <span>Locked</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <UCard v-for="i in 4" :key="i">
        <div class="flex flex-col items-center p-4">
          <USkeleton class="w-16 h-16 rounded-full mb-3" />
          <USkeleton class="w-20 h-4 mb-2" />
          <USkeleton class="w-24 h-3" />
        </div>
      </UCard>
    </div>
  </div>
</template>
