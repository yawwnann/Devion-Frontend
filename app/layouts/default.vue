<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useNotifications } from "~/composables/useNotifications";
import NotificationToast from "~/components/notifications/NotificationToast.vue";
import NotificationPanel from "~/components/notifications/NotificationPanel.vue";

const { t } = useI18n();
const { setLocale } = useI18n();
const colorMode = useColorMode();
const { fetchPreferences, preferences } = usePreferences();

const open = ref(false);
const showNotificationsPanel = ref(false);
const { unreadCount } = useNotifications();

onMounted(async () => {
  const data = await fetchPreferences();
  if (data) {
    if (data.language) {
      setLocale(data.language);
    }
    if (data.theme) {
      colorMode.preference = data.theme;
    }
  }
});

const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t("sidebar.dashboard"),
      icon: "i-lucide-layout-dashboard",
      to: "/dashboard",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.notifications"),
      icon: "i-lucide-bell",
      to: "#",
      badge:
        unreadCount.value > 0
          ? {
              label: unreadCount.value > 99 ? "99+" : String(unreadCount.value),
              color: "error" as const,
              size: "xs" as const,
            }
          : undefined,
      onSelect: () => {
        console.log("[Notifications] Button clicked, opening panel...");
        open.value = false;
        showNotificationsPanel.value = true;
        console.log(
          "[Notifications] Panel state:",
          showNotificationsPanel.value,
        );
      },
    },
  ],
  [
    {
      label: t("sidebar.documentation"),
      icon: "i-lucide-file-text",
      to: "/documentation",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.projects"),
      icon: "i-lucide-folder-kanban",
      to: "/projects",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.todos"),
      icon: "i-lucide-check-square",
      to: "/todos",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.calendar"),
      icon: "i-lucide-calendar",
      to: "/calendar",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: t("sidebar.github"),
      icon: "i-lucide-github",
      to: "/github",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.contributions"),
      icon: "i-lucide-flame",
      to: "/contributions",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.actions"),
      icon: "i-lucide-play-circle",
      to: "/actions",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.codeReview"),
      icon: "i-lucide-git-pull-request",
      to: "/reviews",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: t("sidebar.chatbot"),
      icon: "i-lucide-message-square",
      to: "/chatbot",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: t("sidebar.profile"),
      icon: "i-lucide-user",
      to: "/profile",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: t("sidebar.settings"),
      icon: "i-lucide-settings",
      to: "/settings",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
]);

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.value.flat(),
  },
]);

const closeNotificationsPanel = () => {
  showNotificationsPanel.value = false;
};
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25 transition-all duration-300 ease-in-out"
      :ui="{
        footer: 'lg:border-t lg:border-default',
        body: 'transition-all duration-300 ease-in-out',
        header: 'transition-all duration-300 ease-in-out',
      }"
    >
      <template #header="{ collapsed }">
        <div
          class="flex items-center gap-3 transition-all duration-300 ease-in-out"
          :class="collapsed ? 'p-3 justify-center' : 'p-4'"
        >
          <div
            class="flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300 ease-in-out r-2 shrink-0"
            :class="collapsed ? 'size-8' : 'size-10'"
          >
            <img
              src="/logo.png"
              alt="Devion Logo"
              class="w-full h-full object-contain transition-all duration-300 ease-in-out"
            />
          </div>
          <div
            v-if="!collapsed"
            class="flex flex-col transition-opacity duration-300 ease-in-out"
          >
            <span class="font-bold text-lg">Devion</span>
            <span class="text-xs text-muted">Management your projects</span>
          </div>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default mb-4"
        />

        <!-- Overview Section -->
        <div
          v-if="!collapsed"
          class="px-3 mt-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ t("sidebar.overview") }}
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
          class="mb-4"
        />

        <!-- Workspace Section -->
        <div
          v-if="!collapsed"
          class="px-3 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ t("sidebar.workspace") }}
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          popover
        />

        <!-- Integrations Section -->
        <div
          v-if="!collapsed"
          class="px-3 mt-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ t("sidebar.integrations") }}
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[2]"
          orientation="vertical"
          tooltip
          popover
        />

        <!-- AI Section -->
        <div
          v-if="!collapsed"
          class="px-3 mt-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ t("sidebar.ai") }}
          </p>
        </div>

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[3]"
          orientation="vertical"
          tooltip
          popover
        />

        <!-- Settings Section -->
        <div
          v-if="!collapsed"
          class="px-3 mt-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            {{ t("sidebar.settings") }}
          </p>
        </div>

        <!-- Profile & Settings -->
        <UNavigationMenu
          v-if="!collapsed"
          :collapsed="collapsed"
          :items="links[4]"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="space-y-3 w-full overflow-hidden min-w-0">
          <UserMenu :collapsed="collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <ClientOnly>
      <!-- Toast Notifications -->
      <NotificationToast />

      <!-- Notifications Panel -->
      <NotificationPanel
        :open="showNotificationsPanel"
        @update:open="showNotificationsPanel = $event"
        @close="closeNotificationsPanel"
      />
    </ClientOnly>
  </UDashboardGroup>
</template>
