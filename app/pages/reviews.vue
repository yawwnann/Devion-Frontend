<script setup lang="ts">
const toast = useToast();
const api = useApi();

interface PR {
  number: number;
  title: string;
  html_url: string;
  state: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  labels: { name: string; color: string }[];
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  repository_url: string;
}

interface PRDetail extends PR {
  body: string | null;
  head: { ref: string };
  base: { ref: string };
  mergeable: boolean | null;
  reviews: {
    user: { login: string };
    state: string;
    body: string;
    submitted_at: string;
  }[];
}

interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

const loading = ref(true);
const hasToken = ref(false);
const selectedState = ref<"open" | "closed" | "all">("open");
const pullRequests = ref<PR[]>([]);
const selectedPR = ref<PRDetail | null>(null);
const prFiles = ref<PRFile[]>([]);
const showPRModal = ref(false);
const reviewComment = ref("");
const reviewEvent = ref<"APPROVE" | "REQUEST_CHANGES" | "COMMENT">("COMMENT");
const submittingReview = ref(false);

// Store current PR repo info for submit
const currentPRRepo = ref<{ owner: string; repo: string } | null>(null);
const loadingPRDetail = ref(false);

const checkTokenStatus = async () => {
  try {
    const data = await api.get<{ hasToken: boolean }>("/github/token-status");
    hasToken.value = data?.hasToken ?? false;
  } catch {
    hasToken.value = false;
  }
};

const fetchPRs = async () => {
  if (!hasToken.value) return;
  loading.value = true;
  try {
    const data = await api.get<PR[]>(
      `/github/pull-requests?state=${selectedState.value}`
    );
    pullRequests.value = data || [];
  } catch (error: unknown) {
    const err = error as { message?: string };
    if (err?.message?.includes("GitHub configuration")) {
      hasToken.value = false;
    } else {
      toast.add({
        title: "Error",
        description: "Failed to fetch pull requests",
        color: "error",
      });
    }
  } finally {
    loading.value = false;
  }
};

const openPRModal = async (pr: PR) => {
  showPRModal.value = true;
  loadingPRDetail.value = true;
  selectedPR.value = null;
  prFiles.value = [];
  currentPRRepo.value = null;

  if (!pr.repository_url) {
    toast.add({
      title: "Error",
      description: "Repository URL not found",
      color: "error",
    });
    loadingPRDetail.value = false;
    showPRModal.value = false;
    return;
  }

  const repoPath = pr.repository_url.replace(
    "https://api.github.com/repos/",
    ""
  );
  const [owner, repo] = repoPath.split("/");

  if (!owner || !repo) {
    toast.add({
      title: "Error",
      description: "Invalid repository path",
      color: "error",
    });
    loadingPRDetail.value = false;
    showPRModal.value = false;
    return;
  }

  // Store repo info for later use in submitReview
  currentPRRepo.value = { owner, repo };

  try {
    const [detail, files] = await Promise.all([
      api.get<PRDetail>(`/github/pull-requests/${owner}/${repo}/${pr.number}`),
      api.get<PRFile[]>(
        `/github/pull-requests/${owner}/${repo}/${pr.number}/files`
      ),
    ]);
    selectedPR.value = detail;
    prFiles.value = files;
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to fetch PR details",
      color: "error",
    });
  } finally {
    loadingPRDetail.value = false;
  }
};

const submitReview = async () => {
  if (!selectedPR.value || !reviewComment.value.trim()) {
    toast.add({
      title: "Error",
      description: "Please provide a comment",
      color: "error",
    });
    return;
  }

  if (!currentPRRepo.value) {
    toast.add({
      title: "Error",
      description: "Repository info not found",
      color: "error",
    });
    return;
  }

  submittingReview.value = true;
  const { owner, repo } = currentPRRepo.value;

  try {
    await api.post(
      `/github/pull-requests/${owner}/${repo}/${selectedPR.value.number}/reviews`,
      {
        comment: reviewComment.value,
        event: reviewEvent.value,
      }
    );
    toast.add({
      title: "Success",
      description: "Review submitted successfully",
      color: "success",
    });
    reviewComment.value = "";
    showPRModal.value = false;
    fetchPRs();
  } catch (error: any) {
    const message = error?.response?.data?.message || "Failed to submit review";
    toast.add({
      title: "Error",
      description: message,
      color: "error",
    });
  } finally {
    submittingReview.value = false;
  }
};

const getRepoName = (repoUrl?: string) =>
  repoUrl?.replace("https://api.github.com/repos/", "") || "unknown";

const formatTimeAgo = (date: string) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
};

const getStatusColor = (
  status: string
): "success" | "warning" | "error" | "info" | "neutral" => {
  const colors: Record<
    string,
    "success" | "warning" | "error" | "info" | "neutral"
  > = {
    added: "success",
    modified: "warning",
    removed: "error",
    renamed: "info",
  };
  return colors[status] || "neutral";
};

const getReviewStateColor = (
  state: string
): "success" | "warning" | "error" | "info" | "neutral" => {
  const colors: Record<
    string,
    "success" | "warning" | "error" | "info" | "neutral"
  > = {
    APPROVED: "success",
    CHANGES_REQUESTED: "error",
    COMMENTED: "info",
    PENDING: "warning",
  };
  return colors[state] || "neutral";
};

onMounted(async () => {
  await checkTokenStatus();
  if (hasToken.value) {
    await fetchPRs();
  } else {
    loading.value = false;
  }
});

watch(selectedState, () => fetchPRs());
</script>

<template>
  <UDashboardPanel id="reviews">
    <template #header>
      <UDashboardNavbar title="Code Review Center">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div v-if="hasToken" class="flex items-center gap-2">
            <div class="flex items-center gap-2">
              <UButton
                v-for="opt in [
                  { value: 'open', label: 'Open' },
                  { value: 'closed', label: 'Closed' },
                  { value: 'all', label: 'All' },
                ]"
                :key="opt.value"
                :variant="selectedState === opt.value ? 'solid' : 'outline'"
                :color="selectedState === opt.value ? 'primary' : 'neutral'"
                size="xs"
                @click="selectedState = opt.value as 'open' | 'closed' | 'all'"
              >
                {{ opt.label }}
              </UButton>
            </div>
            <UButton
              icon="i-lucide-refresh-cw"
              variant="ghost"
              color="neutral"
              :loading="loading"
              size="sm"
              @click="fetchPRs"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- Loading -->
        <div v-if="loading" class="grid gap-3">
          <USkeleton v-for="i in 3" :key="i" class="h-24" />
        </div>

        <!-- No Token -->
        <div v-else-if="!hasToken" class="text-center py-12">
          <UIcon name="i-lucide-key" class="size-12 text-muted mx-auto mb-4" />
          <h3 class="font-semibold mb-2">GitHub Access Required</h3>
          <p class="text-muted mb-4">
            Configure your GitHub Personal Access Token to review pull requests
          </p>
          <UButton icon="i-lucide-settings" to="/settings">
            Go to Settings
          </UButton>
        </div>

        <!-- Empty State -->
        <div v-else-if="pullRequests.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-inbox"
            class="size-12 text-muted mx-auto mb-4"
          />
          <h3 class="font-semibold mb-2">No Pull Requests</h3>
          <p class="text-muted">
            No {{ selectedState === "all" ? "" : selectedState }} pull requests
            found
          </p>
        </div>

        <!-- PR List -->
        <div v-else class="space-y-3">
          <UCard
            v-for="pr in pullRequests"
            :key="pr.number"
            class="cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all"
            @click="openPRModal(pr)"
          >
            <div class="flex items-start gap-4">
              <UAvatar :src="pr.user.avatar_url" size="sm" />
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <UBadge
                    :color="pr.state === 'open' ? 'success' : 'neutral'"
                    size="xs"
                  >
                    {{ pr.state }}
                  </UBadge>
                  <span class="text-xs text-muted font-mono">
                    {{ getRepoName(pr.repository_url) }}#{{ pr.number }}
                  </span>
                  <UBadge v-if="pr.draft" color="warning" size="xs">
                    Draft
                  </UBadge>
                </div>
                <h3 class="font-semibold truncate">{{ pr.title }}</h3>
                <div class="flex items-center gap-4 mt-2 text-sm text-muted">
                  <span>{{ pr.user.login }}</span>
                  <span>{{ formatTimeAgo(pr.created_at) }}</span>
                  <span class="text-emerald-500">+{{ pr.additions || 0 }}</span>
                  <span class="text-red-500">-{{ pr.deletions || 0 }}</span>
                  <span>{{ pr.changed_files || 0 }} files</span>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="size-5 text-muted" />
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- PR Detail Modal -->
  <UModal v-model:open="showPRModal">
    <template #content>
      <div class="p-6">
        <!-- Loading -->
        <div v-if="loadingPRDetail" class="space-y-4">
          <USkeleton class="h-8 w-3/4" />
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-32" />
        </div>

        <!-- PR Details -->
        <div v-else-if="selectedPR" class="space-y-4">
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <UBadge
                  :color="selectedPR.state === 'open' ? 'success' : 'neutral'"
                  size="xs"
                >
                  {{ selectedPR.state }}
                </UBadge>
                <span class="text-sm text-muted font-mono">
                  {{
                    currentPRRepo
                      ? `${currentPRRepo.owner}/${currentPRRepo.repo}`
                      : "unknown"
                  }}#{{ selectedPR.number }}
                </span>
              </div>
              <h2 class="text-lg font-semibold">{{ selectedPR.title }}</h2>
            </div>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              color="neutral"
              size="sm"
              @click="showPRModal = false"
            />
          </div>

          <!-- Branch Info -->
          <div class="flex items-center gap-2 text-sm">
            <UAvatar :src="selectedPR.user.avatar_url" size="xs" />
            <span>{{ selectedPR.user.login }}</span>
            <span class="text-muted">wants to merge</span>
            <UBadge color="primary" variant="subtle" size="xs">
              {{ selectedPR.head.ref }}
            </UBadge>
            <span class="text-muted">into</span>
            <UBadge color="neutral" variant="subtle" size="xs">
              {{ selectedPR.base.ref }}
            </UBadge>
          </div>

          <!-- Description -->
          <div
            v-if="selectedPR.body"
            class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-sm"
          >
            {{ selectedPR.body }}
          </div>

          <!-- Files -->
          <div>
            <h3 class="font-medium mb-2">
              Files Changed ({{ prFiles.length }})
            </h3>
            <div class="space-y-1 max-h-48 overflow-y-auto">
              <div
                v-for="file in prFiles"
                :key="file.filename"
                class="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded text-sm"
              >
                <span class="font-mono truncate flex-1">{{
                  file.filename
                }}</span>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-emerald-500">+{{ file.additions }}</span>
                  <span class="text-red-500">-{{ file.deletions }}</span>
                  <UBadge :color="getStatusColor(file.status)" size="xs">
                    {{ file.status }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews -->
          <div v-if="selectedPR.reviews?.length">
            <h3 class="font-medium mb-2">Reviews</h3>
            <div class="space-y-2">
              <div
                v-for="(review, idx) in selectedPR.reviews"
                :key="idx"
                class="p-2 bg-neutral-50 dark:bg-neutral-900 rounded text-sm"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium">{{ review.user.login }}</span>
                  <UBadge :color="getReviewStateColor(review.state)" size="xs">
                    {{ review.state.replace("_", " ") }}
                  </UBadge>
                </div>
                <p v-if="review.body" class="text-muted">{{ review.body }}</p>
              </div>
            </div>
          </div>

          <!-- Submit Review -->
          <!-- Submit Review -->
          <div class="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
            <h3 class="font-semibold text-base mb-4">Submit Your Review</h3>

            <div class="space-y-4">
              <!-- Textarea with helper -->
              <div>
                <UTextarea
                  v-model="reviewComment"
                  placeholder="Share your thoughts on this pull request..."
                  :rows="4"
                  class="w-full"
                />
                <p class="text-xs text-muted mt-1.5">
                  Provide constructive feedback to help improve the code
                </p>
              </div>

              <!-- Action buttons -->
              <div class="flex flex-col sm:flex-row gap-3">
                <USelect
                  v-model="reviewEvent"
                  :items="[
                    { label: ' Comment', value: 'COMMENT' },
                    { label: ' Approve', value: 'APPROVE' },
                    { label: ' Request Changes', value: 'REQUEST_CHANGES' },
                  ]"
                  size="md"
                  class="flex-1 sm:max-w-xs"
                />

                <UButton
                  :loading="submittingReview"
                  :disabled="!reviewComment.trim()"
                  color="primary"
                  size="md"
                  class="w-full sm:w-auto sm:px-8"
                  @click="submitReview"
                >
                  <span v-if="!submittingReview">Submit Review</span>
                  <span v-else>Submitting...</span>
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
