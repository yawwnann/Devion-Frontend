<template>
  <Teleport to="body">
    <div v-if="isClient" class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          :class="{
            'border-l-4 border-l-green-500': toast.type === 'todo',
            'border-l-4 border-l-blue-500': toast.type === 'project',
            'border-l-4 border-l-purple-500': toast.type === 'github',
            'border-l-4 border-l-red-500': toast.type === 'security',
            'border-l-4 border-l-orange-500': toast.type === 'calendar',
          }"
        >
          <div class="p-4">
            <div class="flex items-start gap-3">
              <!-- Icon -->
              <div
                class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                :class="getToastColor(toast.type)"
              >
                <UIcon :name="getToastIcon(toast.type)" class="w-5 h-5" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  {{ toast.title }}
                </p>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {{ toast.message }}
                </p>

                <!-- Action button -->
                <div v-if="toast.data?.actionUrl" class="mt-3 flex gap-2">
                  <UButton
                    variant="solid"
                    size="xs"
                    color="primary"
                    @click="handleAction(toast)"
                  >
                    View
                  </UButton>
                  <UButton
                    variant="ghost"
                    size="xs"
                    color="neutral"
                    @click="removeToast(toast.id)"
                  >
                    Dismiss
                  </UButton>
                </div>
              </div>

              <!-- Close button -->
              <button
                type="button"
                class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="removeToast(toast.id)"
              >
                <UIcon name="i-lucide-x" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Progress bar for auto-dismiss -->
          <div
            v-if="toast.autoDismiss"
            class="h-1 bg-gray-200 dark:bg-gray-700"
          >
            <div
              class="h-full bg-primary-500 transition-all duration-300 ease-linear"
              :style="{
                width: `${(toast.timeLeft / toast.duration) * 100}%`,
              }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { Notification } from "~/composables/useWebSocket";


interface Toast extends Notification {
  id: string;
  duration: number;
  timeLeft: number;
  autoDismiss?: boolean;
}

const isClient = ref(false)
const toasts = ref<Toast[]>([]);
const toastTimers = new Map<string, NodeJS.Timeout>();

const getToastIcon = (type: string): string => {
  switch (type) {
    case "github":
      return "i-simple-icons-github";
    case "project":
      return "i-lucide-folder";
    case "todo":
      return "i-lucide-circle-check";
    case "security":
      return "i-lucide-shield-alert";
    case "calendar":
      return "i-lucide-calendar";
    default:
      return "i-lucide-bell";
  }
};

const getToastColor = (type: string): string => {
  switch (type) {
    case "github":
      return "text-purple-500 bg-purple-50 dark:bg-purple-900/20";
    case "project":
      return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "todo":
      return "text-green-500 bg-green-50 dark:bg-green-900/20";
    case "security":
      return "text-red-500 bg-red-50 dark:bg-red-900/20";
    case "calendar":
      return "text-orange-500 bg-orange-50 dark:bg-orange-900/20";
    default:
      return "text-gray-500 bg-gray-50 dark:bg-gray-900/20";
  }
};

const addToast = (notification: Notification, duration = 8000) => {
  const id = notification.id || Date.now().toString();

  // Don't show duplicate toasts
  if (toasts.value.some((t) => t.id === id)) {
    return;
  }

  const toast: Toast = {
    ...notification,
    id,
    duration,
    timeLeft: duration,
    autoDismiss: true,
  };

  toasts.value.unshift(toast);

  // Start countdown timer
  const startTime = Date.now();
  const timer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const toastIndex = toasts.value.findIndex((t) => t.id === id);


    if (toastIndex === -1) {
      clearInterval(timer);
      return;
    }

    const currentToast = toasts.value[toastIndex];
    if (!currentToast) {
      clearInterval(timer);
      return;
    }

    currentToast.timeLeft = duration - elapsed;

    if (currentToast.timeLeft <= 0) {
      removeToast(id);
      clearInterval(timer);
    }
  }, 100);

  toastTimers.set(id, timer);
};

const removeToast = (id: string) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }

  // Clear timer
  const timer = toastTimers.get(id);
  if (timer) {
    clearInterval(timer);
    toastTimers.delete(id);
  }
};

const handleAction = (toast: Toast) => {
  removeToast(toast.id);
  if (toast.data?.actionUrl) {
    navigateTo(toast.data.actionUrl);
  }
};

// Listen for notification events from useWebSocket
const handleNotificationEvent = (event: CustomEvent<Notification>) => {
  if (isClient.value) {
    addToast(event.detail);

  }

};

onMounted(() => {
  isClient.value = true;
  window.addEventListener(
    "notification-toast",
    handleNotificationEvent as EventListener,
  );
});

onUnmounted(() => {
  window.removeEventListener(
    "notification-toast",
    handleNotificationEvent as EventListener,
  );

  // Clear all timers
  toastTimers.forEach((timer) => clearInterval(timer));
  toastTimers.clear();
});

// Expose addToast globally for manual usage
defineExpose({ addToast });
</script>
