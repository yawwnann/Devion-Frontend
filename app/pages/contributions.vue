<script setup lang="ts">
const api = useApi();
const { user } = useAuth();

interface Contribution {
  date: string;
  count: number;
  level: number;
}

interface ContributionStats {
  totalContributions: number;
  activeDays: number;
  longestStreak: number;
  currentStreak: number;
  commits?: number;
  issues?: number;
  pullRequests?: number;
  reviews?: number;
}

interface RepositoryBreakdown {
  name: string;
  commits: number;
  additions: number;
  deletions: number;
  language: string | null;
}

interface ContributionResponse {
  contributions: Contribution[];
  stats: ContributionStats;
  repositoryBreakdown?: RepositoryBreakdown[];
  isFallback?: boolean;
}

const contributions = ref<Contribution[]>([]);
const contributionStats = ref<ContributionStats | null>(null);
const repositoryBreakdown = ref<RepositoryBreakdown[]>([]);
const isFallback = ref(false);
const loading = ref(true);

const loadContributions = async () => {
  if (!user.value?.githubUsername) return;
  loading.value = true;
  try {
    const data = await api.get<ContributionResponse>("/github/contributions");
    contributions.value = data.contributions;
    contributionStats.value = data.stats;
    repositoryBreakdown.value = data.repositoryBreakdown || [];
    isFallback.value = data.isFallback || false;
  } catch (e) {
    console.error("Failed to load contributions:", e);
  } finally {
    loading.value = false;
  }
};

const avgPerDay = computed(() => {
  if (!contributionStats.value?.activeDays) return "0";
  return (
    contributionStats.value.totalContributions /
    contributionStats.value.activeDays
  ).toFixed(1);
});

const activityPercent = computed(() => {
  return Math.round(((contributionStats.value?.activeDays || 0) / 365) * 100);
});

const showActivityBreakdown = computed(() => {
  return !isFallback.value && contributionStats.value?.commits !== undefined;
});

onMounted(() => loadContributions());
</script>

<template>
  <UDashboardPanel id="contributions">
    <template #header>
      <AppNavbar>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #title>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-activity" class="size-5 text-primary-500" />
            <span class="font-semibold text-zinc-900 dark:text-white"
              >Contributions</span
            >
          </div>
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            size="sm"
            :loading="loading"
            class="hover:bg-zinc-100 dark:hover:bg-zinc-800"
            @click="loadContributions"
          >
            Refresh
          </UButton>
        </template>
      </AppNavbar>
    </template>

    <template #default>
      <div
        class="p-6 w-full mx-auto space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]"
      >
        <!-- Empty States -->
        <ContributionsEmptyState v-if="loading" variant="loading" />
        <ContributionsEmptyState
          v-else-if="!user?.githubUsername"
          variant="not-connected"
        />

        <!-- Content -->
        <template v-else>
          <!-- Contribution Summary -->
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-baseline gap-3">
              <h2 class="text-3xl font-bold text-zinc-900 dark:text-white">
                {{
                  contributionStats?.totalContributions?.toLocaleString() || 0
                }}
              </h2>
              <span class="text-base text-zinc-600 dark:text-zinc-400">
                contributions in the last year
              </span>
            </div>

            <UButton
              v-if="isFallback"
              to="/github"
              size="xs"
              variant="outline"
              color="neutral"
              icon="i-lucide-alert-circle"
            >
              Add token for full data
            </UButton>
          </div>

          <!-- Heatmap Calendar -->
          <ContributionsContributionHeatmap :contributions="contributions" />

          <!-- Two Column Layout -->
          <div class="grid lg:grid-cols-[1fr_320px] gap-8">
            <!-- Left Column -->
            <div class="space-y-6 min-w-0">
              <!-- Activity Overview -->
              <ContributionsActivityBreakdown
                v-if="showActivityBreakdown"
                :commits="contributionStats?.commits"
                :pull-requests="contributionStats?.pullRequests"
                :issues="contributionStats?.issues"
                :reviews="contributionStats?.reviews"
              />

              <!-- Top Repositories -->
              <ContributionsTopRepositories
                :repositories="repositoryBreakdown"
              />
            </div>

            <!-- Right Column - Stats -->
            <div class="space-y-6">
              <!-- Contribution Stats -->
              <UCard class="sticky top-6">
                <template #header>
                  <h3
                    class="text-base font-semibold text-zinc-900 dark:text-white"
                  >
                    Contribution Stats
                  </h3>
                </template>

                <div class="space-y-5">
                  <!-- Current Streak -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30"
                      >
                        <UIcon
                          name="i-lucide-flame"
                          class="size-4 text-orange-600 dark:text-orange-400"
                        />
                      </div>
                      <span class="text-sm text-zinc-600 dark:text-zinc-400"
                        >Current streak</span
                      >
                    </div>
                    <span
                      class="text-lg font-bold text-zinc-900 dark:text-white"
                    >
                      {{ contributionStats?.currentStreak || 0 }} days
                    </span>
                  </div>

                  <div class="h-px bg-zinc-200 dark:bg-zinc-800" />

                  <!-- Longest Streak -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30"
                      >
                        <UIcon
                          name="i-lucide-trophy"
                          class="size-4 text-yellow-600 dark:text-yellow-400"
                        />
                      </div>
                      <span class="text-sm text-zinc-600 dark:text-zinc-400"
                        >Longest streak</span
                      >
                    </div>
                    <span
                      class="text-lg font-bold text-zinc-900 dark:text-white"
                    >
                      {{ contributionStats?.longestStreak || 0 }} days
                    </span>
                  </div>

                  <div class="h-px bg-zinc-200 dark:bg-zinc-800" />

                  <!-- Active Days -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        <UIcon
                          name="i-lucide-calendar-check"
                          class="size-4 text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                      <span class="text-sm text-zinc-600 dark:text-zinc-400"
                        >Active days</span
                      >
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="text-lg font-bold text-zinc-900 dark:text-white"
                      >
                        {{ contributionStats?.activeDays || 0 }}
                      </span>
                      <span
                        class="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-medium"
                      >
                        {{ activityPercent }}%
                      </span>
                    </div>
                  </div>

                  <div class="h-px bg-zinc-200 dark:bg-zinc-800" />

                  <!-- Average per day -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div
                        class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30"
                      >
                        <UIcon
                          name="i-lucide-trending-up"
                          class="size-4 text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      <span class="text-sm text-zinc-600 dark:text-zinc-400"
                        >Daily average</span
                      >
                    </div>
                    <span
                      class="text-lg font-bold text-zinc-900 dark:text-white"
                    >
                      {{ avgPerDay }}
                    </span>
                  </div>
                </div>
              </UCard>
            </div>
          </div>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
