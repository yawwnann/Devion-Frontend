<script setup lang="ts">
const { t } = useI18n();

defineProps<{
  limit?: number;
}>();
</script>

<template>
  <section
    id="articles"
    class="px-6 py-20 border-t border-gray-200 dark:border-zinc-800"
  >
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2
          class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
        >
          {{ t('landing.latestArticles') }}
        </h2>
        <p class="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto">
          {{ t('landing.articlesDescription') }}
        </p>
      </div>

      <ArticlesSection :limit="limit || 6" />
    </div>
  </section>
</template>
