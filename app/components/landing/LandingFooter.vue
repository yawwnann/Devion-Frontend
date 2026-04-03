<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <footer class="px-6 py-8 border-t border-gray-200 dark:border-zinc-800">
    <div
      class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"
    >
      <div class="flex items-center gap-2">
        <img src="/logo.png" alt="Devion" class="h-6 w-auto" />
        <span class="text-gray-600 dark:text-zinc-400 text-sm"
          >{{ t('landing.copyright') }}</span
        >
      </div>
      <div class="flex items-center gap-6">
        <a
          href="#"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >{{ t('landing.privacy') }}</a
        >
        <a
          href="#"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
          >{{ t('landing.terms') }}</a
        >
        <a
          href="https://github.com"
          target="_blank"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Icon name="lucide:github" class="w-5 h-5" />
        </a>
      </div>
    </div>
  </footer>
</template>
