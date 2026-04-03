<script setup lang="ts">
const { locale, locales, setLocale } = useI18n();
const { updatePreferences } = usePreferences();
const { user } = useAuth();

const currentLocale = computed(() => locale.value);

const toggleLanguage = async () => {
  const newLocale = currentLocale.value === 'id' ? 'en' : 'id';
  setLocale(newLocale);

  // Save preference to backend if user is logged in
  if (user.value) {
    try {
      await updatePreferences({ language: newLocale });
    } catch (error) {
      console.error('Failed to save language preference:', error);
    }
  }
};

const languageLabel = computed(() => {
  return currentLocale.value === 'id' ? 'ID' : 'EN';
});
</script>

<template>
  <button
    type="button"
    @click="toggleLanguage"
    class="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-zinc-600 transition-all duration-200 cursor-pointer"
    aria-label="Toggle Language"
  >
    {{ languageLabel }}
  </button>
</template>
