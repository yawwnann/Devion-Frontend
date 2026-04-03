<script setup lang="ts">
const { t } = useI18n();

const features = computed(() => [
  {
    icon: 'lucide:folder-kanban',
    title: t('landing.featuresList.projectManagement.title'),
    desc: t('landing.featuresList.projectManagement.desc'),
  },
  {
    icon: 'lucide:credit-card',
    title: t('landing.featuresList.paymentTracking.title'),
    desc: t('landing.featuresList.paymentTracking.desc'),
  },
  {
    icon: 'lucide:check-square',
    title: t('landing.featuresList.todoLists.title'),
    desc: t('landing.featuresList.todoLists.desc'),
  },
  {
    icon: 'lucide:github',
    title: t('landing.featuresList.githubIntegration.title'),
    desc: t('landing.featuresList.githubIntegration.desc'),
  },
  {
    icon: 'lucide:file-spreadsheet',
    title: t('landing.featuresList.importExport.title'),
    desc: t('landing.featuresList.importExport.desc'),
  },
  {
    icon: 'lucide:bar-chart-3',
    title: t('landing.featuresList.analyticsDashboard.title'),
    desc: t('landing.featuresList.analyticsDashboard.desc'),
  },
]);
</script>

<template>
  <section
    id="features"
    class="px-6 py-20 border-t border-gray-200 dark:border-zinc-800"
  >
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2
          class="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white animate-fade-in"
        >
          {{ t('landing.everythingYouNeed') }}
        </h2>
        <p
          class="text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto animate-fade-in delay-100"
        >
          {{ t('landing.featuresDescription') }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Feature Cards with staggered animation -->
        <div
          v-for="(feature, index) in features"
          :key="index"
          class="group p-6 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-all duration-500 hover:-translate-y-2 hover:shadow-lg hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <div
            class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
          >
            <Icon
              :name="feature.icon"
              class="w-6 h-6 text-emerald-700 dark:text-emerald-400"
            />
          </div>
          <h3
            class="text-lg font-semibold mb-2 text-gray-900 dark:text-white"
          >
            {{ feature.title }}
          </h3>
          <p class="text-gray-600 dark:text-zinc-400 text-sm">
            {{ feature.desc }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.delay-100 {
  animation-delay: 100ms;
}
</style>
