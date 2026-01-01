<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const open = ref(false);

const links = [
  [
    {
      label: "Dashboard",
      icon: "i-lucide-layout-dashboard",
      to: "/dashboard",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: "Pages",
      icon: "i-lucide-file-text",
      to: "/pages",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Projects",
      icon: "i-lucide-folder-kanban",
      to: "/projects",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Todos",
      icon: "i-lucide-check-square",
      to: "/todos",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: "GitHub",
      icon: "i-lucide-github",
      to: "/github",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Code Review",
      icon: "i-lucide-git-pull-request",
      to: "/reviews",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      to: "/profile",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Settings",
      icon: "i-lucide-settings",
      to: "/settings",
      onSelect: () => {
        open.value = false;
      },
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
]);
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
          :class="collapsed ? 'p-3' : 'p-4'"
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
            <span class="text-xs text-muted">Portfolio Builder</span>
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
          class="px-3 mb-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            Overview
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
          class="px-3 mb-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            Workspace
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          popover
          class="mb-4"
        />

        <!-- Integrations Section -->
        <div
          v-if="!collapsed"
          class="px-3 mb-2 transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            Integrations
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[2]"
          orientation="vertical"
          tooltip
          popover
          class="mb-auto"
        />

        <!-- Settings Section -->
        <div
          v-if="!collapsed"
          class="px-3 mb-2 mt-auto transition-opacity duration-300 ease-in-out"
        >
          <p class="text-xs font-semibold text-muted uppercase tracking-wider">
            Settings
          </p>
        </div>
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[3]"
          orientation="vertical"
          tooltip
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
