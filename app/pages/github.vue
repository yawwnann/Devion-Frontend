<script setup lang="ts">
import { Doughnut as _Doughnut, Bar as _Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// GitHub Repos - fetch dari API

const api = useApi();
const { user } = useAuth();

interface Repo {
  id: string;
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  url: string;
  updatedAt: string;
}

const repos = ref<Repo[]>([]);
const loading = ref(true);
const syncing = ref(false);
const usernameInput = ref("");
const tokenInput = ref("");
const showGitHubModal = ref(false);
const hasToken = ref(false);

// Tab system
const selectedTab = ref('repos');
const tabs = [
  { id: 'repos', label: 'Repositories', icon: 'i-lucide-folder-git' },
  { id: 'commits', label: 'Commits', icon: 'i-lucide-git-commit' }
];

// Commit Tracking
interface Todo {
  id: string;
  title: string;
  status: string;
  githubIssueNumber: number;
  githubIssueUrl: string;
  githubRepoName: string;
}

interface GitHubCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string | null;
  htmlUrl: string;
  additions: number;
  deletions: number;
  committedAt: string;
}

interface RecentCommit {
  sha: string;
  message: string;
  author: string;
  authorAvatar?: string;
  date: string;
  url: string;
  repo: string;
  repoUrl: string;
}

const githubTodos = ref<Todo[]>([]);
const todoCommits = ref<Record<string, GitHubCommit[]>>({});
const loadingCommits = ref<Record<string, boolean>>({});
const syncingTodos = ref<Record<string, boolean>>({});

// Recent Commits
const recentCommits = ref<RecentCommit[]>([]);
const loadingRecentCommits = ref(false);

// Create Issue
const showCreateIssueModal = ref(false);
const creatingIssue = ref(false);
const issueForm = ref({
  repo: '',
  title: '',
  body: '',
  labels: '',
});

const repoOptions = computed(() => {
  return repos.value.map(r => ({
    label: r.name,
    value: `${user.value?.githubUsername}/${r.name}`
  }));
});

// Computed masked token for display
const maskedToken = computed(() => {
  if (!hasToken.value) return "";
  return "ghp_" + "x".repeat(36);
});

// Language Statistics
const languageStats = computed(() => {
  const stats: Record<string, number> = {};
  repos.value.forEach((repo) => {
    if (repo.language) {
      stats[repo.language] = (stats[repo.language] || 0) + 1;
    }
  });
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
});

// Pagination
const page = ref(1);
const pageSize = 10;
const totalRepos = computed(() => repos.value.length);
const totalPages = computed(() => Math.ceil(totalRepos.value / pageSize));
const paginatedRepos = computed(() => {
  const start = (page.value - 1) * pageSize;
  const end = start + pageSize;
  return repos.value.slice(start, end);
});

const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Shell: "bg-gray-500",
  Go: "bg-cyan-500",
  Rust: "bg-orange-500",
  Java: "bg-red-500",
};

const formatDate = (date: string) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

const syncRepos = async () => {
  syncing.value = true;
  try {
    await api.post("/github/sync");
    repos.value = await api.get<Repo[]>("/github/repos");
  } catch (e) {
    console.error("Failed to sync repos:", e);
  } finally {
    syncing.value = false;
  }
};

const setUsername = async () => {
  if (!usernameInput.value) return;
  try {
    // Set username first
    await api.post("/github/username", { username: usernameInput.value });

    // Set token if provided
    if (tokenInput.value) {
      await api.post("/github/token", { token: tokenInput.value });
      hasToken.value = true;
    }

    showGitHubModal.value = false;
    usernameInput.value = "";
    tokenInput.value = "";
    await syncRepos();
  } catch (e) {
    console.error("Failed to set GitHub config:", e);
  }
};

const setToken = async () => {
  try {
    await api.post("/github/token", { token: tokenInput.value || null });
    showGitHubModal.value = false;
    hasToken.value = !!tokenInput.value;
    tokenInput.value = "";
    await syncRepos();
  } catch (e) {
    console.error("Failed to set token:", e);
  }
};

const checkTokenStatus = async () => {
  try {
    const status = await api.get<{ hasToken: boolean }>("/github/token-status");
    hasToken.value = status.hasToken;
  } catch (e) {
    console.error("Failed to check token status:", e);
  }
};

const loadGitHubTodos = async () => {
  try {
    const week = await api.get<any>('/todos/current-week');
    githubTodos.value = week.todos.filter(
      (todo: Todo) => todo.githubIssueNumber && todo.githubRepoName
    );
    for (const todo of githubTodos.value) {
      loadCommitsForTodo(todo.id);
    }
  } catch (error) {
    console.error('Failed to load GitHub todos:', error);
  }
};

const loadCommitsForTodo = async (todoId: string) => {
  loadingCommits.value[todoId] = true;
  try {
    const commits = await api.get<GitHubCommit[]>(`/todos/${todoId}/commits`);
    todoCommits.value[todoId] = commits;
  } catch (error) {
    console.error(`Failed to load commits for todo ${todoId}:`, error);
    todoCommits.value[todoId] = [];
  } finally {
    loadingCommits.value[todoId] = false;
  }
};

const syncCommitsForTodo = async (todoId: string) => {
  syncingTodos.value[todoId] = true;
  try {
    const result = await api.post<{ synced: number; commits: GitHubCommit[] }>(
      `/todos/${todoId}/commits/sync`,
      {}
    );
    todoCommits.value[todoId] = result.commits;
  } catch (error) {
    console.error(`Failed to sync commits for todo ${todoId}:`, error);
  } finally {
    syncingTodos.value[todoId] = false;
  }
};

const openCreateIssueModal = () => {
  issueForm.value = {
    repo: '',
    title: '',
    body: '',
    labels: '',
  };
  showCreateIssueModal.value = true;
};

const createIssue = async () => {
  if (!issueForm.value.repo || !issueForm.value.title) {
    return;
  }

  creatingIssue.value = true;
  try {
    const [owner, repo] = issueForm.value.repo.split('/');
    const labels = issueForm.value.labels
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);

    const result = await api.post<{ number: number; url: string }>(
      `/github/repos/${owner}/${repo}/issues`,
      {
        title: issueForm.value.title,
        body: issueForm.value.body,
        labels,
      }
    );

    showCreateIssueModal.value = false;
    
    // Show success with link
    window.open(result.url, '_blank');
  } catch (error) {
    console.error('Failed to create issue:', error);
  } finally {
    creatingIssue.value = false;
  }
};

const loadRecentCommits = async () => {
  loadingRecentCommits.value = true;
  try {
    recentCommits.value = await api.get<RecentCommit[]>('/github/recent-commits?limit=15');
  } catch (error) {
    console.error('Failed to load recent commits:', error);
  } finally {
    loadingRecentCommits.value = false;
  }
};

onMounted(async () => {
  try {
    await checkTokenStatus();
    repos.value = await api.get<Repo[]>("/github/repos");
    if (selectedTab.value === 'commits') {
      await loadGitHubTodos();
      await loadRecentCommits();
    }
  } catch (e) {
    console.error("Failed to load repos:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UDashboardPanel id="github">
    <template #header>
      <UDashboardNavbar title="GitHub Repos">
        <template #logo>
          <UIcon name="i-lucide-github" class="size-5" />
        </template>
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-plus"
              color="primary"
              size="sm"
              @click="openCreateIssueModal"
            >
              Create Issue
            </UButton>
            <UButton
              icon="i-lucide-settings"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showGitHubModal = true"
            >
              Configure
            </UButton>
            <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              color="neutral"
              :loading="syncing"
              @click="syncRepos"
            >
              Sync
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Tabs -->
      <div class="border-b border-zinc-200 dark:border-zinc-800 px-6">
        <div class="flex gap-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="selectedTab = tab.id; if (tab.id === 'commits') loadGitHubTodos();"
            :class="[
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2',
              selectedTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            ]"
          >
            <UIcon :name="tab.icon" class="size-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>
      
      <div class="p-6 space-y-6">
        <!-- GitHub Username -->
        <UCard>
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-github" class="size-8" />
            <div class="flex-1">
              <p class="text-sm text-muted">Connected as</p>
              <p class="font-semibold">
                @{{ user?.githubUsername || "Not set" }}
              </p>
            </div>
            <UButton
              variant="outline"
              size="sm"
              @click="showGitHubModal = true"
            >
              {{ user?.githubUsername ? "Change" : "Set Username" }}
            </UButton>
          </div>
        </UCard>
        
        <!-- Repos Tab -->
        <div v-if="selectedTab === 'repos'">
          <!-- Loading -->
          <div v-if="loading" class="grid gap-3">
            <USkeleton v-for="i in 3" :key="i" class="h-24" />
          </div>

          <!-- No Username Set -->
          <div v-else-if="!user?.githubUsername" class="text-center py-12">
            <UIcon
              name="i-lucide-github"
              class="size-12 text-muted mx-auto mb-4"
            />
            <h3 class="font-semibold mb-2">Connect your GitHub</h3>
            <p class="text-muted mb-4">
              Set your GitHub username to view your repositories
            </p>
            <UButton icon="i-lucide-link" @click="showGitHubModal = true">
              Set Username
            </UButton>
          </div>

          <!-- Repos List -->
          <div v-else>
            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <!-- Language Statistics -->
            <UCard>
              <template #header>
                <h3 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-code" class="size-5" />
                  Top Languages
                </h3>
              </template>
              <div class="space-y-3">
                <div
                  v-for="[lang, count] in languageStats"
                  :key="lang"
                  class="flex items-center gap-3"
                >
                  <span
                    :class="[
                      'size-3 rounded-full shrink-0',
                      languageColors[lang] || 'bg-gray-400',
                    ]"
                  />
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium">{{ lang }}</span>
                      <span class="text-xs text-muted">{{ count }} repos</span>
                    </div>
                    <div
                      class="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden"
                    >
                      <div
                        :class="[languageColors[lang] || 'bg-gray-400']"
                        :style="{
                          width: `${(count / repos.length) * 100}%`,
                        }"
                        class="h-full transition-all"
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-if="languageStats.length === 0"
                  class="text-center py-4 text-muted text-sm"
                >
                  No language data available
                </div>
              </div>
            </UCard>

            <!-- GitHub Contributions -->
            <UCard>
              <template #header>
                <h3 class="font-semibold flex items-center gap-2">
                  <UIcon name="i-lucide-git-commit" class="size-5" />
                  Contributions
                </h3>
              </template>
              <div
                v-if="user?.githubUsername"
                class="overflow-hidden rounded-lg"
              >
                <img
                  :src="`https://github-readme-activity-graph.vercel.app/graph?username=${user.githubUsername}&bg_color=1a1a1a&color=10b981&line=10b981&point=34d399&area=true&hide_border=true&custom_title=Contribution%20Activity`"
                  :alt="`${user.githubUsername}'s GitHub contributions`"
                  class="w-full h-auto"
                  loading="lazy"
                />
              </div>
              <div v-else class="text-center py-8 text-muted text-sm">
                Set your GitHub username to view contributions
              </div>
            </UCard>
          </div>

          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">
              Public Repositories ({{ repos.length }})
            </h3>
            <div class="text-sm text-muted">
              Page {{ page }} of {{ totalPages }}
            </div>
          </div>
          <div class="grid gap-3">
            <UCard v-for="repo in paginatedRepos" :key="repo.id">
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <a
                      :href="repo.url"
                      target="_blank"
                      class="font-medium text-primary hover:underline"
                    >
                      {{ repo.name }}
                    </a>
                    <span
                      v-if="repo.language"
                      :class="[
                        'size-3 rounded-full',
                        languageColors[repo.language] || 'bg-gray-400',
                      ]"
                    />
                    <span v-if="repo.language" class="text-xs text-muted">{{
                      repo.language
                    }}</span>
                  </div>
                  <p v-if="repo.description" class="text-sm text-muted mb-2">
                    {{ repo.description }}
                  </p>
                  <div class="flex items-center gap-4 text-sm text-muted">
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-star" class="size-4" />
                      {{ repo.stars }}
                    </span>
                    <span class="flex items-center gap-1">
                      <UIcon name="i-lucide-git-fork" class="size-4" />
                      {{ repo.forks }}
                    </span>
                    <span>Updated {{ formatDate(repo.updatedAt) }}</span>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- Pagination -->
          <div
            v-if="totalPages > 1"
            class="flex items-center justify-center gap-2 mt-6"
          >
            <UButton
              icon="i-lucide-chevron-left"
              variant="outline"
              size="sm"
              :disabled="page === 1"
              @click="page--"
            >
              Previous
            </UButton>
            <div class="flex items-center gap-1">
              <UButton
                v-for="p in totalPages"
                :key="p"
                :variant="p === page ? 'solid' : 'ghost'"
                size="sm"
                @click="page = p"
              >
                {{ p }}
              </UButton>
            </div>
            <UButton
              trailing-icon="i-lucide-chevron-right"
              variant="outline"
              size="sm"
              :disabled="page === totalPages"
              @click="page++"
            >
              Next
            </UButton>
          </div>
        </div>
        </div>
        
        <!-- Commits Tab -->
        <div v-if="selectedTab === 'commits'">
          <!-- Recent Commits Section -->
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <UIcon name="i-lucide-git-commit" class="size-5" />
              Recent Commits
            </h3>
            
            <div v-if="loadingRecentCommits" class="space-y-2">
              <USkeleton v-for="i in 5" :key="i" class="h-16" />
            </div>
            
            <div v-else-if="!recentCommits.length" class="text-center py-8 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <UIcon name="i-lucide-git-branch" class="size-12 mx-auto mb-2 text-zinc-300 dark:text-zinc-700" />
              <p class="text-sm text-muted">No recent commits found</p>
            </div>
            
            <div v-else class="space-y-2">
              <a
                v-for="commit in recentCommits"
                :key="commit.sha"
                :href="commit.url"
                target="_blank"
                class="block p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-primary-500 transition-colors"
              >
                <div class="flex items-start gap-3">
                  <img
                    v-if="commit.authorAvatar"
                    :src="commit.authorAvatar"
                    :alt="commit.author"
                    class="size-8 rounded-full"
                  />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm line-clamp-1">{{ commit.message.split('\n')[0] }}</p>
                    <div class="flex items-center gap-2 mt-1 text-xs text-muted">
                      <span>{{ commit.author }}</span>
                      <span>•</span>
                      <a :href="commit.repoUrl" target="_blank" class="hover:text-primary-500">
                        {{ commit.repo }}
                      </a>
                      <span>•</span>
                      <span>{{ new Date(commit.date).toLocaleDateString() }}</span>
                    </div>
                  </div>
                  <UIcon name="i-lucide-external-link" class="size-4 text-muted" />
                </div>
              </a>
            </div>
          </div>

          <!-- Divider -->
          <div v-if="githubTodos.length" class="border-t border-zinc-200 dark:border-zinc-800 my-6"></div>

          <!-- Todo-based Commits -->
          <div v-if="!githubTodos.length" class="text-center py-12">
            <UIcon name="i-lucide-github" class="size-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p class="text-zinc-500 font-medium">No GitHub-linked tasks</p>
            <p class="text-xs text-zinc-400 mt-1">Link your todos to GitHub issues to track commits</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="todo in githubTodos" :key="todo.id" class="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
              <!-- Todo Header -->
              <div class="bg-zinc-50 dark:bg-zinc-900/50 p-4 border-b border-zinc-200 dark:border-zinc-800">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-semibold text-zinc-900 dark:text-zinc-100">{{ todo.title }}</h3>
                    <div class="flex items-center gap-3 mt-2">
                      <a 
                        :href="todo.githubIssueUrl || '#'"
                        target="_blank"
                        class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <UIcon name="i-lucide-github" class="size-3" />
                        {{ todo.githubRepoName }} #{{ todo.githubIssueNumber }}
                      </a>
                      <span class="text-xs text-zinc-400">•</span>
                      <span class="text-xs text-zinc-500">{{ todo.status }}</span>
                    </div>
                  </div>
                  <UButton
                    icon="i-lucide-refresh-cw"
                    size="sm"
                    variant="ghost"
                    :loading="syncingTodos[todo.id]"
                    @click="syncCommitsForTodo(todo.id)"
                  >
                    Sync
                  </UButton>
                </div>
              </div>

              <!-- Commits List -->
              <div class="p-4">
                <div v-if="loadingCommits[todo.id]" class="flex items-center justify-center py-8">
                  <div class="flex items-center gap-2 text-zinc-500 text-sm">
                    <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
                    <span>Loading commits...</span>
                  </div>
                </div>

                <div v-else-if="!todoCommits[todo.id]?.length" class="text-center py-8 text-zinc-400">
                  <UIcon name="i-lucide-git-commit" class="size-8 mx-auto mb-2 opacity-50" />
                  <p class="text-sm">No commits yet</p>
                  <p class="text-xs mt-1">Commits mentioning this issue will appear here</p>
                </div>

                <div v-else class="space-y-3">
                  <div
                    v-for="commit in todoCommits[todo.id]"
                    :key="commit.id"
                    class="flex gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition"
                  >
                    <!-- Avatar -->
                    <img
                      v-if="commit.authorAvatar"
                      :src="commit.authorAvatar"
                      :alt="commit.author"
                      class="size-10 rounded-full"
                    />
                    <div v-else class="size-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <UIcon name="i-lucide-user" class="size-5 text-zinc-500" />
                    </div>

                    <!-- Commit Info -->
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                        {{ commit.message.split('\n')[0] }}
                      </p>
                      <div class="flex items-center gap-3 text-xs text-zinc-500">
                        <span class="font-medium">{{ commit.author }}</span>
                       <span>•</span>
                        <span>{{ formatDate(commit.committedAt) }}</span>
                        <span class="text-green-600 dark:text-green-400">+{{ commit.additions }}</span>
                        <span class="text-red-600 dark:text-red-400">-{{ commit.deletions }}</span>
                      </div>
                    </div>

                    <!-- Link -->
                    <a
                      :href="commit.htmlUrl"
                      target="_blank"
                      class="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                    >
                      <UIcon name="i-lucide-external-link" class="size-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Create Issue Modal -->
  <UModal v-model:open="showCreateIssueModal">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-lg">Create GitHub Issue</h3>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="showCreateIssueModal = false"
            />
          </div>
        </template>
        <div class="space-y-4">
          <!-- Repository -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Repository <span class="text-red-500">*</span>
            </label>
            <select
              v-model="issueForm.repo"
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select repository</option>
              <option v-for="opt in repoOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="issueForm.title"
              placeholder="Enter issue title"
              class="w-full"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              v-model="issueForm.body"
              rows="4"
              placeholder="Describe the issue..."
              class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <p class="text-xs text-muted mt-1">Supports Markdown</p>
          </div>

          <!-- Labels -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Labels
            </label>
            <UInput
              v-model="issueForm.labels"
              placeholder="bug, enhancement (comma-separated)"
              class="w-full"
            />
            <p class="text-xs text-muted mt-1">Separate multiple labels with commas</p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCreateIssueModal = false">
              Cancel
            </UButton>
            <UButton
              :loading="creatingIssue"
              :disabled="!issueForm.repo || !issueForm.title"
              @click="createIssue"
            >
              Create Issue
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <!-- GitHub Configuration Modal -->
  <UModal v-model:open="showGitHubModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold">GitHub Configuration</h3>
        </template>
        <div class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-medium mb-2">
              GitHub Username <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="usernameInput"
              placeholder="Enter your GitHub username"
              :value="user?.githubUsername"
              class="w-full"
            />
          </div>

          <!-- Token (Optional) -->
          <div>
            <label class="block text-sm font-medium mb-2">
              Personal Access Token (Optional)
              <UBadge v-if="hasToken" color="success" size="xs" class="ml-2">
                Token Saved
              </UBadge>
            </label>
            <UInput
              v-model="tokenInput"
              type="password"
              :placeholder="hasToken ? maskedToken : 'ghp_xxxxxxxxxxxxxxxxxxxx'"
              class="w-full"
            />
            <p class="text-xs text-muted mt-1">
              <span v-if="hasToken">
                Token is saved. Leave empty to keep current token, or enter new
                token to update.
              </span>
              <span v-else> Add a token to access private repositories. </span>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                class="text-primary hover:underline ml-1"
              >
                Create token here
              </a>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-2">
            <UButton
              v-if="hasToken"
              color="error"
              variant="ghost"
              size="sm"
              @click="setToken"
            >
              Remove Token
            </UButton>
            <div v-else />
            <div class="flex gap-2">
              <UButton variant="ghost" @click="showGitHubModal = false">
                Cancel
              </UButton>
              <UButton @click="setUsername"> Save Configuration </UButton>
            </div>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
