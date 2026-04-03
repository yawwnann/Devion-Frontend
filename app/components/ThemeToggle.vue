<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

const colorMode = useColorMode();
const { updatePreferences } = usePreferences();
const { user } = useAuth();

const isDark = ref(false);
const isMounted = ref(false);

// Inisialisasi state saat komponen sudah mounted
onMounted(() => {
  isMounted.value = true;
  isDark.value = colorMode.value === "dark";
});

// Watch colorMode changes to keep toggle in sync
watch(
  () => colorMode.value,
  (newValue) => {
    if (isMounted.value) {
      isDark.value = newValue === "dark";
    }
  },
);

// Dengarkan perubahan pada toggle dan update ColorMode & Preferences
const handleToggle = async (val: boolean) => {
  const newTheme = val ? "dark" : "light";
  colorMode.preference = newTheme;
  isDark.value = val;

  // Hanya update ke backend jika user sedang login
  if (user.value) {
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  }
};
</script>

<template>
  <div v-if="isMounted" class="flex items-center gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="isDark"
      aria-label="Toggle Dark Mode"
      class="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none cursor-pointer"
      :class="isDark ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-600'"
      @click="handleToggle(!isDark)"
    >
      <!-- Toggle Knob with Icon -->
      <div
        class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300"
        :class="isDark ? 'translate-x-6' : 'translate-x-0'"
      >
        <UIcon
          :name="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
          class="size-3 transition-colors duration-300"
          :class="isDark ? 'text-indigo-600' : 'text-amber-500'"
        />
      </div>
    </button>
  </div>
  <div v-else class="flex items-center">
    <div class="w-12 h-6 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
  </div>
</template>
