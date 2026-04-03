<script setup lang="ts">
import ThemeToggle from "~/components/ThemeToggle.vue";
</script>

<template>
  <UDashboardNavbar v-bind="$attrs">
    <!-- Pass all slots from parent except right -->
    <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
      <slot v-if="name !== 'right'" :name="name" v-bind="slotData || {}" />
    </template>

    <!-- Override the right slot to append our Theme Toggle -->
    <template #right>
      <slot name="right" />
      <div
        class="px-2 border-l border-zinc-200 dark:border-zinc-800 ml-2 py-1 flex items-center"
      ></div>
    </template>
  </UDashboardNavbar>
</template>
