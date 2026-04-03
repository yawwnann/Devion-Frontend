<script setup lang="ts">
const isVisible = ref(true);

onMounted(() => {
  isVisible.value = true;
});
</script>

<template>
  <section class="px-6 pb-20">
    <div
      class="max-w-6xl mx-auto transition-all duration-1000 delay-700"
      :class="
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      "
    >
      <div
        class="relative rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800 shadow-xl shadow-gray-200/50 dark:shadow-black/50 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-black/60 transition-all duration-500 hover:-translate-y-2"
      >
        <!-- Browser Header -->
        <div
          class="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center gap-3"
        >
          <div class="flex gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <div
              class="w-3 h-3 rounded-full bg-yellow-500 animate-pulse delay-100"
            />
            <div
              class="w-3 h-3 rounded-full bg-green-500 animate-pulse delay-200"
            />
          </div>
          <div class="flex-1 flex justify-center">
            <div
              class="px-4 py-1 bg-white dark:bg-zinc-800 rounded-md text-gray-600 dark:text-zinc-400 text-sm flex items-center gap-2"
            >
              <Icon name="lucide:lock" class="w-3 h-3" />
              devion.app
            </div>
          </div>
        </div>

        <!-- App Screenshot -->
        <img src="/devion.png" alt="Devion Dashboard" class="w-full" />
      </div>
    </div>
  </section>
</template>
