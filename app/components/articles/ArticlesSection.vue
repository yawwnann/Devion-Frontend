<script setup lang="ts">
import ArticleList from "./ArticleList.vue";

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

const props = withDefaults(
  defineProps<{
    title?: string;
    showViewAll?: boolean;
    limit?: number;
  }>(),
  {
    title: "Latest Articles",
  },
);

const { t } = useI18n();
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
  <section class="space-y-6 p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        {{
          title === "Latest Articles" ? t("dashboard.latestArticles") : title
        }}
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
        class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/30"
      >
        <UIcon name="i-lucide-book-open" class="size-5" />
        {{ t("articles.viewMore") }}
        <UIcon name="i-lucide-arrow-right" class="size-5" />
      </NuxtLink>
    </div>
  </section>
</template>
