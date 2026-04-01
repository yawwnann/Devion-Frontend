<script setup lang="ts">
// Pages list - fetch dari API

const api = useApi();

interface Page {
  id: string;
  title: string;
  icon: string | null;
  status: "DRAFT" | "PRIVATE" | "PUBLISHED";
  publishedAt?: string;
  updatedAt: string;
}

const pages = ref<Page[]>([]);
const loading = ref(true);
const activeStatus = ref<"all" | "DRAFT" | "PRIVATE" | "PUBLISHED">("all");

const statusTabs = [
  { label: "All", value: "all", icon: "i-lucide-list" },
  { label: "Draft", value: "DRAFT", icon: "i-lucide-file-pen" },
  { label: "Private", value: "PRIVATE", icon: "i-lucide-lock" },
  { label: "Published", value: "PUBLISHED", icon: "i-lucide-globe" },
];

const getStatusColor = (status: string): "neutral" | "warning" | "success" => {
  const colors: Record<string, "neutral" | "warning" | "success"> = {
    DRAFT: "neutral",
    PRIVATE: "warning",
    PUBLISHED: "success",
  };
  return colors[status] || "neutral";
};

const fetchPages = async (status?: string) => {
  loading.value = true;
  try {
    console.log("🔵 Fetching pages with status:", status || "all");
    if (status && status !== "all") {
      const response = await api.get<Page[]>(
        `/documentation/by-status?status=${status}`,
      );
      console.log("🟢 Fetched by status, count:", response.length);
      pages.value = response;
    } else {
      const response = await api.get<Page[]>("/documentation");
      console.log("🟢 Fetched all, count:", response.length);
      pages.value = response;
    }
  } catch (e) {
    console.error("Failed to load pages:", e);
  } finally {
    loading.value = false;
  }
};

// Watch for status changes
watch(activeStatus, (newStatus) => {
  console.log("🔵 Status changed to:", newStatus);
  fetchPages(newStatus === "all" ? undefined : newStatus);
});

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

const createPage = async () => {
  try {
    const newPage = await api.post<Page>("/documentation", {
      title: "Untitled",
    });
    navigateTo(`/documentation/${newPage.id}`);
  } catch (e) {
    console.error("Failed to create page:", e);
  }
};

onMounted(async () => {
  try {
    await fetchPages();
  } catch (e) {
    console.error("Failed to load pages:", e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <UDashboardPanel id="pages">
    <template #header>
      <UDashboardNavbar title="Documentation">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" size="md" @click="createPage">
            New Doc
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <!-- Status Filter Tabs -->
        <div class="mb-6">
          <UTabs v-model="activeStatus" :items="statusTabs" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="grid gap-3">
          <USkeleton v-for="i in 3" :key="i" class="h-20" />
        </div>

        <!-- Empty State -->
        <div v-else-if="pages.length === 0" class="text-center py-12">
          <UIcon
            name="i-lucide-file-text"
            class="size-12 text-muted mx-auto mb-4"
          />
          <h3 class="font-semibold mb-2">No documentation yet</h3>
          <p class="text-muted mb-4">Create your first doc to get started</p>
          <UButton icon="i-lucide-plus" @click="createPage">
            Create Doc
          </UButton>
        </div>

        <!-- Pages List -->
        <div v-else class="grid gap-3">
          <NuxtLink
            v-for="page in pages"
            :key="page.id"
            :to="`/documentation/${page.id}`"
            class="block"
          >
            <UCard
              class="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
            >
              <div class="flex items-center gap-4">
                <UIcon
                  :name="page.icon || 'i-lucide-file-text'"
                  class="size-6 text-primary"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium">{{ page.title || "Untitled" }}</p>
                    <UBadge
                      :color="getStatusColor(page.status)"
                      variant="soft"
                      size="xs"
                    >
                      {{ page.status }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-muted">
                    Updated {{ formatDate(page.updatedAt) }}
                    <span v-if="page.publishedAt" class="ml-2">
                      • Published {{ formatDate(page.publishedAt) }}
                    </span>
                  </p>
                </div>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-5 text-muted"
                />
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
