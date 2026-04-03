<template>
  <div
    v-if="!collapsed"
    class="flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
    @click="navigateTo('/notifications')"
  >
    <div class="flex items-center gap-3">
      <div class="relative">
        <UIcon name="i-lucide-bell" class="w-5 h-5" />

        <!-- Red dot indicator for unread notifications -->
        <span
          v-if="unreadCount > 0"
          class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"
        />
      </div>

      <span class="text-sm font-medium"> Notifications </span>
    </div>

    <!-- Unread count badge (optional, on the right) -->
    <UBadge
      v-if="unreadCount > 0"
      :label="unreadCount > 99 ? '99+' : String(unreadCount)"
      color="error"
      size="xs"
    />
  </div>

  <!-- Collapsed version - just icon with red dot -->
  <div
    v-else
    class="flex items-center justify-center w-full px-2 py-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
    @click="navigateTo('/notifications')"
  >
    <div class="relative">
      <UIcon name="i-lucide-bell" class="w-5 h-5" />

      <!-- Red dot indicator for unread notifications -->
      <span
        v-if="unreadCount > 0"
        class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotifications } from "~/composables/useNotifications";

interface Props {
  collapsed?: boolean;
}

defineProps<Props>();

const { unreadCount } = useNotifications();
</script>
