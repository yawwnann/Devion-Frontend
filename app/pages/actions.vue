<script setup lang="ts">
const api = useApi();
const { user } = useAuth();

// GitHub Actions
interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  branch: string;
  event: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  runNumber: number;
  repo: string;
  repoFullName?: string;
  actor: {
    login: string;
    avatar: string;
  };
  headCommit: {
    message: string;
    author: string;
  };
}

const workflowRuns = ref<WorkflowRun[]>([]);
const loading = ref(true);
const hasToken = ref(false);
const selectedRepo = ref<string>("");

// Get unique repos from workflow runs
const repos = computed(() => {
  const repoSet = new Set(workflowRuns.value.map((r) => r.repo));
  return Array.from(repoSet);
});

// Filtered runs
const filteredRuns = computed(() => {
  if (!selectedRepo.value) return workflowRuns.value;
  return workflowRuns.value.filter((r) => r.repo === selectedRepo.value);
});

// Stats
const stats = computed(() => {
  const runs = filteredRuns.value;
  return {
    total: runs.length,
    success: runs.filter((r) => r.conclusion === "success").length,
    failure: runs.filter((r) => r.conclusion === "failure").length,
    inProgress: runs.filter(
      (r) => r.status === "in_progress" || r.status === "queued",
    ).length,
  };
});

// Check token status
const checkTokenStatus = async () => {
  try {
    const status = await api.get<{ hasToken: boolean }>("/github/token-status");
    hasToken.value = status.hasToken;
  } catch (e) {
    console.error("Failed to check token status:", e);
  }
};

// Load workflow runs
const loadWorkflowRuns = async () => {
  if (!user.value?.githubUsername || !hasToken.value) return;
  loading.value = true;
  try {
    const data = await api.get<WorkflowRun[]>("/github/actions/runs");
    workflowRuns.value = data;
  } catch (e) {
    console.error("Failed to load workflow runs:", e);
  } finally {
    loading.value = false;
  }
};

// Get status color for workflow runs
const getStatusColor = (status: string, conclusion: string | null) => {
  if (status === "in_progress" || status === "queued") return "warning";
  if (conclusion === "success") return "success";
  if (conclusion === "failure") return "error";
  if (conclusion === "cancelled") return "neutral";
  return "neutral";
};

const getStatusIcon = (status: string, conclusion: string | null) => {
  if (status === "in_progress") return "i-lucide-loader-2";
  if (status === "queued") return "i-lucide-clock";
  if (conclusion === "success") return "i-lucide-check-circle";
  if (conclusion === "failure") return "i-lucide-x-circle";
  if (conclusion === "cancelled") return "i-lucide-slash";
  return "i-lucide-circle";
};

const getStatusLabel = (status: string, conclusion: string | null) => {
  if (status === "in_progress") return "In Progress";
  if (status === "queued") return "Queued";
  if (conclusion === "success") return "Success";
  if (conclusion === "failure") return "Failed";
  if (conclusion === "cancelled") return "Cancelled";
  return status;
};

// Format date
const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

// Format duration
const formatDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes < 1) return `${seconds}s`;
  return `${minutes}m ${seconds % 60}s`;
};

onMounted(async () => {
  await checkTokenStatus();
  if (hasToken.value) {
    await loadWorkflowRuns();
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <UDashboardPanel id="actions">
    <template #header>
      <AppNavbar title="GitHub Actions">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <select
              v-if="repos.length > 0"
              v-model="selectedRepo"
              class="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
            >
              <option value="">All Repositories</option>
              <option v-for="repo in repos" :key="repo" :value="repo">
                {{ repo }}
              </option>
            </select>
            <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              color="neutral"
              size="sm"
              :loading="loading"
              @click="loadWorkflowRuns"
            >
              Refresh
            </UButton>
          </div>
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 overflow-y-auto h-full">
        <!-- Not configured -->
        <div
          v-if="!user?.githubUsername"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <UIcon
            name="i-lucide-github"
            class="size-16 text-muted mb-4 opacity-50"
          />
          <h3 class="text-lg font-semibold mb-2">GitHub Not Configured</h3>
          <p class="text-muted mb-4">
            Set up your GitHub username to view Actions
          </p>
          <UButton to="/github" icon="i-lucide-settings">
            Configure GitHub
          </UButton>
        </div>

        <!-- Token Required -->
        <div
          v-else-if="!hasToken"
          class="flex flex-col items-center justify-center py-16 text-center"
        >
          <div
            class="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl max-w-md"
          >
            <UIcon
              name="i-lucide-key"
              class="size-12 mx-auto mb-4 text-yellow-500"
            />
            <h3 class="font-semibold text-lg mb-2">GitHub Token Required</h3>
            <p class="text-sm text-muted mb-4">
              A GitHub Personal Access Token with
              <code class="bg-zinc-200 dark:bg-zinc-800 px-1 rounded"
                >workflow</code
              >
              scope is required to view GitHub Actions.
            </p>
            <UButton icon="i-lucide-settings" to="/github">
              Configure Token
            </UButton>
          </div>
        </div>

        <template v-else>
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <UCard>
              <div class="text-center">
                <p class="text-3xl font-bold">{{ stats.total }}</p>
                <p class="text-sm text-muted">Total Runs</p>
              </div>
            </UCard>
            <UCard>
              <div class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <UIcon
                    name="i-lucide-check-circle"
                    class="size-5 text-green-500"
                  />
                  <p class="text-3xl font-bold text-green-500">
                    {{ stats.success }}
                  </p>
                </div>
                <p class="text-sm text-muted">Successful</p>
              </div>
            </UCard>
            <UCard>
              <div class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <UIcon name="i-lucide-x-circle" class="size-5 text-red-500" />
                  <p class="text-3xl font-bold text-red-500">
                    {{ stats.failure }}
                  </p>
                </div>
                <p class="text-sm text-muted">Failed</p>
              </div>
            </UCard>
            <UCard>
              <div class="text-center">
                <div class="flex items-center justify-center gap-2">
                  <UIcon
                    name="i-lucide-loader-2"
                    class="size-5 text-yellow-500 animate-spin"
                  />
                  <p class="text-3xl font-bold text-yellow-500">
                    {{ stats.inProgress }}
                  </p>
                </div>
                <p class="text-sm text-muted">In Progress</p>
              </div>
            </UCard>
          </div>

          <!-- Workflow Runs -->
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="font-semibold">Recent Workflow Runs</h3>
                <span class="text-sm text-muted">
                  {{ filteredRuns.length }} runs
                </span>
              </div>
            </template>

            <div v-if="loading" class="flex items-center justify-center py-16">
              <UIcon
                name="i-lucide-loader-2"
                class="size-8 animate-spin text-muted"
              />
            </div>

            <div
              v-else-if="filteredRuns.length === 0"
              class="text-center py-16 text-muted"
            >
              <UIcon
                name="i-lucide-play-circle"
                class="size-16 mx-auto mb-4 opacity-50"
              />
              <p class="text-lg font-medium mb-2">No workflow runs</p>
              <p class="text-sm">GitHub Actions runs will appear here</p>
            </div>

            <div v-else class="divide-y divide-zinc-200 dark:divide-zinc-800">
              <a
                v-for="run in filteredRuns"
                :key="run.id"
                :href="run.url"
                target="_blank"
                class="flex items-start gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition cursor-pointer"
              >
                <!-- Status Icon -->
                <div
                  class="shrink-0 p-2.5 rounded-full"
                  :class="{
                    'bg-green-100 dark:bg-green-900/30':
                      run.conclusion === 'success',
                    'bg-red-100 dark:bg-red-900/30':
                      run.conclusion === 'failure',
                    'bg-yellow-100 dark:bg-yellow-900/30':
                      run.status === 'in_progress' || run.status === 'queued',
                    'bg-zinc-100 dark:bg-zinc-800':
                      run.conclusion === 'cancelled',
                  }"
                >
                  <UIcon
                    :name="getStatusIcon(run.status, run.conclusion)"
                    class="size-5"
                    :class="{
                      'text-green-500': run.conclusion === 'success',
                      'text-red-500': run.conclusion === 'failure',
                      'text-yellow-500 animate-spin':
                        run.status === 'in_progress',
                      'text-yellow-500': run.status === 'queued',
                      'text-zinc-500': run.conclusion === 'cancelled',
                    }"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium truncate">{{ run.name }}</span>
                    <UBadge
                      size="xs"
                      variant="subtle"
                      :color="getStatusColor(run.status, run.conclusion)"
                    >
                      {{ getStatusLabel(run.status, run.conclusion) }}
                    </UBadge>
                    <UBadge size="xs" variant="outline">
                      #{{ run.runNumber }}
                    </UBadge>
                  </div>

                  <p class="text-sm text-muted truncate mb-2">
                    {{ run.headCommit?.message || "No commit message" }}
                  </p>

                  <div
                    class="flex flex-wrap items-center gap-4 text-xs text-muted"
                  >
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-folder-git" class="size-3.5" />
                      <span>{{ run.repo }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-git-branch" class="size-3.5" />
                      <span>{{ run.branch }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-zap" class="size-3.5" />
                      <span>{{ run.event }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <UIcon name="i-lucide-clock" class="size-3.5" />
                      <span>{{ formatDate(run.createdAt) }}</span>
                    </div>
                    <div v-if="run.conclusion" class="flex items-center gap-1">
                      <UIcon name="i-lucide-timer" class="size-3.5" />
                      <span>{{
                        formatDuration(run.createdAt, run.updatedAt)
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Actor -->
                <div class="shrink-0 flex items-center gap-2">
                  <img
                    v-if="run.actor?.avatar"
                    :src="run.actor.avatar"
                    :alt="run.actor.login"
                    class="size-8 rounded-full"
                    :title="run.actor.login"
                  />
                  <UIcon
                    name="i-lucide-external-link"
                    class="size-4 text-muted"
                  />
                </div>
              </a>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
