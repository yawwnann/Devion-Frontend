<template>
  <!-- Notification Dropdown Panel -->
  <div
    v-if="isClient && open"
    class="fixed inset-0 z-[100] flex items-start justify-start pt-0 pl-0 bg-black/60 backdrop-blur-sm"
    @click="closePanel"
  >
    <div
      class="w-[28rem] h-full bg-white dark:bg-zinc-900 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div
        class="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900"
      >
        <div class="flex items-center gap-3">
          <h3 class="font-semibold text-base text-zinc-900 dark:text-white">
            Notifications
          </h3>
        
        </div>
        <div class="flex items-center gap-1">
          <!-- Test Notification Bubble -->
          <UDropdownMenu :items="[testNotificationTypes]">
            <UButton
              icon="i-lucide-flask"
              variant="ghost"
              size="xs"
              class="text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
             
            </UButton>

            <template #item="{ item }">
              <button
                class="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                @click="sendTestNotification(item)"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="item.colorClass"
                >
                  <UIcon :name="item.icon" class="w-4 h-4" />
                </div>
                <div class="flex-1 text-left">
                  <p class="text-sm font-medium text-zinc-900 dark:text-white">
                    {{ item.label }}
                  </p>
                  <p class="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {{ item.message }}
                  </p>
                </div>
              </button>
            </template>
          </UDropdownMenu>

          <!-- Broadcast Test -->
          <UButton
            icon="i-lucide-broadcast"
            variant="ghost"
            size="xs"
            class="hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:hover:text-red-400"
            @click="sendBroadcastTest"
          >
            <span class="sr-only">Broadcast Test</span>
          </UButton>

          <!-- Mark all as read -->
          <UButton
            v-if="unreadCount > 0"
            variant="ghost"
            size="xs"
            class="text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            @click="handleMarkAllRead"
          >
            Mark all read
          </UButton>

          <!-- Delete all notifications -->
          <UButton
            v-if="notifications.length > 0"
            icon="i-lucide-trash-2"
            variant="ghost"
            size="xs"
            class="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
            @click="handleDeleteAll"
          >
            <span class="sr-only">Delete all</span>
          </UButton>

          <!-- Close button -->
          <UButton
            variant="ghost"
            size="xs"
            icon="i-lucide-x"
            class="hover:bg-zinc-100 dark:hover:bg-zinc-800"
            @click="closePanel"
          />
        </div>
      </div>

      <!-- Content -->
      <div class="overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
        <!-- Loading State -->
        <div v-if="isFetching" class="px-6 py-12 text-center">
          <div
            class="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center animate-pulse"
          >
            <UIcon
              name="i-lucide-loader"
              class="w-8 h-8 text-zinc-400 dark:text-zinc-500 animate-spin"
            />
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
            Loading notifications...
          </p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!notifications.length" class="px-6 py-12 text-center">
          <div
            class="w-16 h-16 mx-auto rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-bell-off"
              class="w-8 h-8 text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <p class="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
            No notifications yet
          </p>
          <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            You'll be notified when something happens
          </p>
        </div>

        <!-- Notifications List -->
        <div v-else class="divide-y divide-zinc-100 dark:divide-zinc-800">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
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
                <div class="flex items-start justify-between gap-2 mb-1">
                  <p
                    class="text-sm font-semibold text-zinc-900 dark:text-white truncate"
                    :class="{
                      'text-emerald-600 dark:text-emerald-400':
                        !notification.isRead,
                    }"
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
                  class="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2"
                >
                  {{ notification.message }}
                </p>
              </div>

              <!-- Actions (visible on hover) -->
              <div
                class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop
              >
                <UButton
                  icon="i-lucide-trash-2"
                  variant="ghost"
                  size="xs"
                  color="error"
                  class="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                  @click="handleDeleteNotification(notification)"
                />
              </div>

              <!-- Unread indicator -->
              <div
                v-if="!notification.isRead"
                class="flex-shrink-0 w-2 h-2 mt-2 bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { navigateTo } from "#app";
import { useNotifications } from "~/composables/useNotifications";
import { useApi } from "~/composables/useApi";


const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["update:open", "close"]);

const api = useApi();
const toast = useToast();
const {
  isConnected,
  unreadCount,
  notifications,
  getNotificationIcon,
  getNotificationColor,
  timeAgo,
  markAsRead,
  markAllAsRead,
  fetchNotifications,
  deleteNotification,
  deleteAllNotifications,
} = useNotifications();

const isClient = ref(false);
const isFetching = ref(false);

onMounted(() => {
  isClient.value = true;
});

// Watch for open state changes
watch(
  () => props.open,
  async (newValue) => {
    console.log("[NotificationPanel] Open state changed:", newValue);
    if (newValue) {
      console.log("[NotificationPanel] Panel is now visible");
      // Fetch notifications when panel is opened
      if (isConnected.value && !isFetching.value) {
        isFetching.value = true;
        try {
          await fetchNotifications(50, false);
          console.log(
            "[NotificationPanel] Notifications fetched:",
            notifications.value.length,
          );
        } catch (error) {
          console.error(
            "[NotificationPanel] Failed to fetch notifications:",
            error,
          );
        } finally {
          isFetching.value = false;
        }
      }
    }
  },
);

const closePanel = () => {
  console.log("[NotificationPanel] Closing panel");
  emit("update:open", false);
  emit("close");
};

const handleNotificationClick = async (notification: any) => {
  if (!notification.isRead) {
    await markAsRead(notification.id);
  }

  if (notification.data?.actionUrl) {
    navigateTo(notification.data.actionUrl);
    closePanel();
  }
};

const handleMarkAllRead = async () => {
  await markAllAsRead();
};

const handleDeleteNotification = async (notification: any) => {
  try {
    await deleteNotification(notification.id);
    toast.add({
      title: "Notification deleted",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Failed to delete notification",
      description: error.message,
      color: "error",
    });
  }
};

const handleDeleteAll = async () => {
  // Simple browser confirmation
  if (!confirm("Delete all notifications? This action cannot be undone.")) {
    return;
  }

  try {
    await deleteAllNotifications();
    toast.add({
      title: "All notifications deleted",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Failed to delete notifications",
      description: error.message,
      color: "error",
    });
  }
};

// Test notification types
const testNotificationTypes = computed(() => [
  {
    label: "GitHub - PR Review",
    icon: "i-simple-icons-github",
    colorClass: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
    type: "github",
    message: "Your review is requested on PR #42",
    data: { prNumber: 42, repoName: "owner/repo", actionUrl: "/github" },
  },
  {
    label: "Project - Status Changed",
    icon: "i-lucide-folder",
    colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    type: "project",
    message: "Project status changed to IN_PROGRESS",
    data: { projectId: "123", actionUrl: "/projects" },
  },
  {
    label: "Todo - Due Today",
    icon: "i-lucide-circle-check",
    colorClass: "text-green-500 bg-green-50 dark:bg-green-900/20",
    type: "todo",
    message: 'Task "Fix login bug" is due today',
    data: { todoId: "456", actionUrl: "/todos" },
  },
  {
    label: "Security - New Login",
    icon: "i-lucide-shield-alert",
    colorClass: "text-red-500 bg-red-50 dark:bg-red-900/20",
    type: "security",
    message: "New login from Chrome on Windows",
    data: { device: "Chrome on Windows", location: "Jakarta" },
  },
  {
    label: "Calendar - Event Soon",
    icon: "i-lucide-calendar",
    colorClass: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
    type: "calendar",
    message: 'Event "Team Meeting" starts in 15 min',
    data: { eventId: "789", actionUrl: "/calendar" },
  },
  {
    label: "System - Announcement",
    icon: "i-lucide-bell",
    colorClass: "text-gray-500 bg-gray-50 dark:bg-gray-900/20",
    type: "system",
    message: "Scheduled maintenance tonight",
    data: {},
  },
]);

const sendTestNotification = async (testType: any) => {
  try {
    await api.post("/notifications/test", {
      type: testType.type,
      title: testType.label.split(" - ")[0],
      message: testType.message,
      data: testType.data,
    });

    toast.add({
      title: "Test notification sent!",
      description: testType.label,
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Failed to send test",
      description: error.message,
      color: "error",
    });
  }
};

const sendBroadcastTest = async () => {
  try {
    await api.post("/notifications/broadcast", {
      title: "🧪 Broadcast Test",
      message: "This is a test broadcast notification to all users!",
      type: "system",
      data: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    });

    toast.add({
      title: "Broadcast sent!",
      description: "Test notification sent to all users",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Failed to broadcast",
      description: error.message,
      color: "error",
    });
  }
};
</script>
