<script setup lang="ts">
// Pages list - fetch dari API

const api = useApi();

interface Page {
  id: string;
  title: string;
  icon: string | null;
  updatedAt: string;
}

const pages = ref<Page[]>([]);
const loading = ref(true);

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
    const newPage = await api.post<Page>("/pages", { title: "Untitled" });
    navigateTo(`/pages/${newPage.id}`);
  } catch (e) {
    console.error("Failed to create page:", e);
  }
};

onMounted(async () => {
  try {
    pages.value = await api.get<Page[]>("/pages");
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
      <UDashboardNavbar title="Pages">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton icon="i-lucide-plus" size="md" @click="createPage">
            New Page
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
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
          <h3 class="font-semibold mb-2">No pages yet</h3>
          <p class="text-muted mb-4">Create your first page to get started</p>
          <UButton icon="i-lucide-plus" @click="createPage"
            >Create Page</UButton
          >
        </div>

        <!-- Pages List -->
        <div v-else class="grid gap-3">
          <NuxtLink
            v-for="page in pages"
            :key="page.id"
            :to="`/pages/${page.id}`"
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
                  <p class="font-medium">{{ page.title || "Untitled" }}</p>
                  <p class="text-sm text-muted">
                    Updated {{ formatDate(page.updatedAt) }}
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
