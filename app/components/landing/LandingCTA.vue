<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <section
    id="about"
    class="px-6 py-20 border-t border-gray-200 dark:border-zinc-800"
  >
    <div class="max-w-4xl mx-auto text-center">
      <h2
        class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white"
      >
        {{ t('landing.readyToGetStarted') }}
      </h2>
      <p class="text-gray-600 dark:text-zinc-400 mb-8">
        {{ t('landing.ctaDescription') }}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <NuxtLink
          to="/register"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/30"
        >
          <Icon name="lucide:user-plus" class="w-5 h-5" />
          {{ t('landing.createAccount') }}
        </NuxtLink>
        <NuxtLink
          to="/login"
          class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-900 dark:text-white font-medium rounded-lg transition-all duration-300 hover:scale-105"
        >
          <Icon name="lucide:log-in" class="w-5 h-5" />
          {{ t('landing.signInButton') }}
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
