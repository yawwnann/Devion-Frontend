<script setup lang="ts">
interface Article {
  id: string;
  title: string;
  icon?: string | null;
  excerpt?: string;
  publishedAt: string;
  user?: {
    name: string | null;
    avatar?: string | null;
  };
}

const props = defineProps<{
  title?: string;
  showViewAll?: boolean;
  limit?: number;
}>();

const api = useApi();
const articles = ref<Article[]>([]);
const loading = ref(true);

const fetchArticles = async () => {
  try {
    const data = await api.get<Article[]>("/documentation/published");
    articles.value = props.limit ? data.slice(0, props.limit) : data;
  } catch (err: any) {
    console.error("[ArticlesSection] Failed to fetch articles:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchArticles();
});

watch(
  () => articles.value,
  (newVal) => {
    console.log("[ArticlesSection] Articles updated:", newVal.length, "items");
  },
  { immediate: true },
);
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div v-if="title" class="flex items-center justify-between">
      <h2 class="text-xl font-bold">
        {{ title }}
      </h2>
    </div>

    <!-- Article List -->
    <ArticleList :articles="articles" :loading="loading" />

    <!-- View More Button -->
    <div
      v-if="!loading && articles.length > 0"
      class="flex justify-center pt-4"
    >
      <NuxtLink
        to="/articles"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30"
      >
        <UIcon name="i-lucide-book-open" class="size-5" />
        Lihat Artikel Lainnya
        <UIcon name="i-lucide-arrow-right" class="size-5" />
      </NuxtLink>
    </div>
  </section>
</template>
