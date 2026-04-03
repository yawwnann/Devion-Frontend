<script setup lang="ts">
import ThemeToggle from "~/components/ThemeToggle.vue";
import LanguageToggle from "~/components/landing/LanguageToggle.vue";

const { t } = useI18n();
const { user } = useAuth();

const isVisible = ref(true);

onMounted(() => {
  isVisible.value = true;
});
</script>

<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-all duration-500"
    :class="
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    "
  >
    <div
      class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
    >
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/logo.png" alt="Devion" class="h-8 w-auto" />
      </NuxtLink>

      <!-- Nav Links -->
      <div class="hidden md:flex items-center gap-8">
        <a
          href="#features"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ t('landing.features') }}
        </a>
        <a
          href="#about"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ t('landing.about') }}
        </a>
        <a
          href="https://github.com"
          target="_blank"
          class="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm"
        >
          {{ t('landing.github') }}
        </a>
      </div>

      <!-- Auth Buttons -->
      <div class="flex items-center justify-end gap-2 md:gap-3">
        <LanguageToggle />
        <ThemeToggle />

        <NuxtLink
          v-if="!user"
          to="/login"
          class="px-4 py-2 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {{ t('landing.signIn') }}
        </NuxtLink>
        <NuxtLink
          v-if="!user"
          to="/register"
          class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-300 hover:scale-105"
        >
          {{ t('landing.getStarted') }}
        </NuxtLink>
        <NuxtLink
          v-else
          to="/dashboard"
          class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all duration-300 hover:scale-105"
        >
          {{ t('landing.dashboard') }}
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>
