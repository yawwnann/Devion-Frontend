<template>
  <div
    class="max-h-[28rem] overflow-hidden flex flex-col bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
  >
    <!-- Header -->
    <div
      class="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900"
    >
      <h3 class="font-semibold text-zinc-900 dark:text-white">Notifications</h3>
      <div class="flex items-center gap-2">
        <span
          v-if="isConnected"
          class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live
        </span>
        <UButton
          v-if="unreadCount > 0"
          variant="ghost"
          size="xs"
          @click="handleMarkAllRead"
        >
          Mark all read
        </UButton>
      </div>
    </div>

    <!-- Content -->
    <div class="overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
      <!-- Loading state -->
      <div
        v-if="!notifications.length && isLoading"
        class="px-4 py-8 text-center"
      >
        <UIcon
          name="i-lucide-loader"
          class="w-6 h-6 animate-spin mx-auto text-zinc-400 dark:text-zinc-500"
        />
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Loading notifications...
        </p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!notifications.length" class="px-4 py-8 text-center">
        <UIcon
          name="i-lucide-bell-off"
          class="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600"
        />
        <p class="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          No notifications yet
        </p>
        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          You'll be notified when something happens
        </p>
      </div>

      <!-- Grouped notifications -->
      <div v-else class="divide-y divide-zinc-100 dark:divide-zinc-800">
        <div v-for="group in groupedNotifications" :key="group.label">
          <!-- Group label -->
          <div class="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50">
            <span class="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {{ group.label }}
            </span>
          </div>

          <!-- Notifications in group -->
          <div class="bg-white dark:bg-zinc-900">
            <button
              v-for="notification in group.notifications"
              :key="notification.id"
              type="button"
              class="w-full px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors text-left bg-white dark:bg-zinc-900"
              :class="{
                '!bg-emerald-50 dark:!bg-emerald-900/10': !notification.isRead,
              }"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex items-start gap-3">
                <!-- Icon -->
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="getNotificationColor(notification.type)"
                >
                  <UIcon
                    :name="getNotificationIcon(notification.type)"
                    class="w-5 h-5"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p
                      class="text-sm font-medium text-zinc-900 dark:text-white truncate"
                      :class="{ 'font-semibold': !notification.isRead }"
                    >
                      {{ notification.title }}
                    </p>
                    <span
                      class="text-xs text-zinc-500 dark:text-zinc-500 flex-shrink-0"
                    >
                      {{ timeAgo(notification.createdAt) }}
                    </span>
                  </div>
                  <p
                    class="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2"
                  >
                    {{ notification.message }}
                  </p>

                  <!-- Action button if available -->
                  <div v-if="notification.data?.actionUrl" class="mt-2">
                    <UButton
                      variant="ghost"
                      size="xs"
                      color="primary"
                      class="font-medium"
                      @click.stop="navigateTo(notification.data.actionUrl)"
                    >
                      View Details
                      <UIcon name="i-lucide-arrow-right" class="w-3 h-3 ml-1" />
                    </UButton>
                  </div>
                </div>

                <!-- Unread indicator -->
                <div
                  v-if="!notification.isRead"
                  class="flex-shrink-0 w-2 h-2 mt-2 bg-emerald-500 rounded-full"
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      v-if="notifications.length > 0"
      class="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 text-center bg-white dark:bg-zinc-900"
    >
      <UButton
        variant="ghost"
        size="sm"
        class="text-sm"
        @click="navigateTo('/notifications')"
      >
        View all notifications
        <UIcon name="i-lucide-arrow-right" class="w-4 h-4 ml-1" />
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import type { Notification } from "~/composables/useWebSocket";
import { useNotifications } from "~/composables/useNotifications";

const emit = defineEmits(["close"]);

const {
  isConnected,
  unreadCount,
  notifications,
  groupedNotifications,
  getNotificationIcon,
  getNotificationColor,
  timeAgo,
  markAsRead,
  markAllAsRead,
  fetchNotifications,
} = useNotifications();

const isLoading = ref(true);

onMounted(async () => {
  try {
    await fetchNotifications(50);
  } finally {
    isLoading.value = false;
  }
});

const handleNotificationClick = async (notification: Notification) => {
  if (!notification.isRead) {
    await markAsRead(notification.id);
  }

  // Navigate if action URL exists
  if (notification.data?.actionUrl) {
    navigateTo(notification.data.actionUrl);
    emit("close");
  }
};

const handleMarkAllRead = async () => {
  await markAllAsRead();
};
</script>
