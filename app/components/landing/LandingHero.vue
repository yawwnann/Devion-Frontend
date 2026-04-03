<script setup lang="ts">
const { t } = useI18n();
const isVisible = ref(true);

onMounted(() => {
  isVisible.value = true;
});
</script>

<template>
  <section class="relative pt-32 pb-20 px-6">
    <!-- Background Gradient -->
    <div
      class="absolute inset-0 bg-gradient-to-b from-emerald-50 dark:from-emerald-950/30 via-transparent to-transparent pointer-events-none"
    />

    <!-- Animated Background Orbs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute top-20 left-1/4 w-96 h-96 bg-emerald-200/40 dark:bg-emerald-900/20 rounded-full blur-3xl animate-pulse"
      />
      <div
        class="absolute top-40 right-1/4 w-80 h-80 bg-emerald-300/40 dark:bg-emerald-800/20 rounded-full blur-3xl animate-pulse delay-1000"
      />
    </div>

    <div class="max-w-4xl mx-auto text-center relative z-10">
      <!-- Badge -->
      <div
        class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 mb-8 transition-all duration-700 delay-200"
        :class="
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        "
      >
        <span class="text-emerald-700 dark:text-emerald-400 text-sm"
          >{{ t('landing.whatsNew') }}</span
        >
        <Icon
          name="lucide:arrow-right"
          class="w-4 h-4 text-emerald-700 dark:text-emerald-400 animate-bounce-x"
        />
      </div>

      <!-- Headline -->
      <h1
        class="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white transition-all duration-700 delay-300"
        :class="
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        "
      >
        {{ t('landing.headlinePart1') }}<br />
        {{ t('landing.headlinePart2') }}
      </h1>

      <!-- Subtitle -->
      <p
        class="text-lg md:text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 transition-all duration-700 delay-400"
        :class="
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        "
      >
        {{ t('landing.subtitle') }}
      </p>

      <!-- CTA Button -->
      <NuxtLink
        to="/register"
        class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-full transition-all duration-500 delay-500 hover:scale-105 hover:shadow-lg hover:shadow-emerald-600/30"
        :class="
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        "
      >
        <Icon name="lucide:rocket" class="w-5 h-5" />
        {{ t('landing.ctaButton') }}
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
@keyframes bounce-x {
  0%,
  100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
}

.animate-bounce-x {
  animation: bounce-x 1s ease-in-out infinite;
}
</style>
