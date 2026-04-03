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
  article: Article;
  to?: string;
}>();

console.log("[ArticleCard] Rendering article:", props.article);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<template>
  <NuxtLink :to="to || `/articles/${article.id}`" class="block group h-full">
    <div
      class="h-full p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/10"
    >
      <div class="flex items-start gap-4 mb-4">
        <!-- Icon -->
        <div
          class="shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
        >
          <Icon
            :name="'lucide:file-text'"
            class="w-6 h-6 text-emerald-600 dark:text-emerald-400"
          />
        </div>

        <!-- Title -->
        <h3
          class="flex-1 font-semibold text-lg text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2"
        >
          {{ article.title }}
        </h3>
      </div>

      <!-- Excerpt -->
      <p
        v-if="article.excerpt"
        class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 mb-4"
      >
        {{ article.excerpt }}
      </p>

      <!-- Meta -->
      <div
        class="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <div v-if="article.user" class="flex items-center gap-2">
          <img
            v-if="article.user.avatar"
            :src="article.user.avatar"
            :alt="article.user.name || 'Author'"
            class="w-6 h-6 rounded-full"
          />
          <div
            v-else
            class="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
          >
            {{ article.user.name?.[0]?.toUpperCase() || "A" }}
          </div>
          <span
            v-if="article.user.name"
            class="text-zinc-600 dark:text-zinc-400"
          >
            {{ article.user.name }}
          </span>
        </div>
        <span>•</span>
        <time
          :datetime="article.publishedAt"
          class="text-zinc-500 dark:text-zinc-400"
        >
          {{ formatDate(article.publishedAt) }}
        </time>
      </div>
    </div>
  </NuxtLink>
</template>
