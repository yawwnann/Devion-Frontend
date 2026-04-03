<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import type { ProductivityStats } from "~/composables/useProductivity";

const props = defineProps<{
  showStats: boolean;
}>();

const { t } = useI18n();
const { fetchProductivity, formatDate, getStreakEmoji } = useProductivity();

// State
const stats = ref<ProductivityStats | null>(null);
const loading = ref(true);
const visible = ref(false);

// Computed
const hasStreak = computed(() => stats.value && stats.value.currentStreak > 0);

// Lifecycle
onMounted(async () => {
  try {
    stats.value = await fetchProductivity();
  } catch (error) {
    console.error("Failed to load productivity stats:", error);
  } finally {
    loading.value = false;
    setTimeout(() => {
      visible.value = true;
    }, 100);
  }
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Streak Card -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1"
      :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-orange-500/10 rounded-lg">
          <UIcon
            name="i-lucide-flame"
            class="size-6 text-orange-500"
            :class="{ 'animate-pulse': hasStreak }"
          />
        </div>
        <div>
          <p class="text-sm text-muted">{{ t("dashboard.currentStreak") }}</p>
          <p class="text-2xl font-bold">
            {{ stats?.currentStreak ?? 0 }} {{ t("dashboard.days") }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Today Card -->
    <UCard
      class="transition-all duration-500 ease-out hover:shadow-md hover:-translate-y-1"
      :class="visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'"
      :style="{ transitionDelay: '100ms' }"
    >
      <div class="flex items-center gap-4">
        <div class="p-3 bg-blue-500/10 rounded-lg">
          <UIcon name="i-lucide-sun" class="size-6 text-blue-500" />
        </div>
        <div class="flex-1">
          <p class="text-sm text-muted">{{ t("dashboard.today") }}</p>
          <div class="flex items-center gap-2">
            <p class="text-2xl font-bold">
              {{ stats?.todayCompleted ?? 0 }}
              <span class="text-base text-muted"
                >/{{ stats?.todayTotal ?? 0 }}</span
              >
            </p>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
