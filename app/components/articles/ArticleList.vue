<script setup lang="ts">
import ArticleCard from "./ArticleCard.vue";

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
  articles: Article[];
  loading?: boolean;
}>();
</script>

<template>
  <!-- Loading state -->
  <div v-if="loading" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="i in 3"
      :key="i"
      class="h-48 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl animate-pulse"
    />
  </div>

  <!-- Empty state -->
  <div v-else-if="articles.length === 0" class="text-center py-12">
    <div
      class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center mx-auto mb-4"
    >
      <Icon
        name="lucide:book-open"
        class="w-8 h-8 text-zinc-500 dark:text-zinc-400"
      />
    </div>

    <h3 class="font-semibold mb-2 text-gray-900 dark:text-white">
      No articles yet
    </h3>

    <p class="text-sm text-zinc-600 dark:text-zinc-400">
      Published articles will appear here
    </p>
  </div>

  <!-- Articles list -->
  <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    <ArticleCard
      v-for="article in articles"
      :key="article.id"
      :article="article"
    />
  </div>
</template>
