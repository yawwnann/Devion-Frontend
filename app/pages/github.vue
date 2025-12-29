<script setup lang="ts">
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
const showUsernameModal = ref(false);

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
    await api.post("/github/username", { username: usernameInput.value });
    showUsernameModal.value = false;
    await syncRepos();
  } catch (e) {
    console.error("Failed to set username:", e);
  }
};

onMounted(async () => {
  try {
    repos.value = await api.get<Repo[]>("/github/repos");
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
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            color="neutral"
            :loading="syncing"
            @click="syncRepos"
          >
            Sync
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
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
              @click="showUsernameModal = true"
            >
              {{ user?.githubUsername ? "Change" : "Set Username" }}
            </UButton>
          </div>
        </UCard>

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
          <UButton icon="i-lucide-link" @click="showUsernameModal = true"
            >Set Username</UButton
          >
        </div>

        <!-- Repos List -->
        <div v-else>
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
    </template>
  </UDashboardPanel>

  <!-- Username Modal -->
  <UModal v-model:open="showUsernameModal">
    <template #content>
      <UCard>
        <template #header>
          <h3 class="font-semibold">Set GitHub Username</h3>
        </template>
        <UInput
          v-model="usernameInput"
          placeholder="Enter your GitHub username"
          class="mb-4"
        />
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="showUsernameModal = false"
            >Cancel</UButton
          >
          <UButton @click="setUsername">Save</UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
