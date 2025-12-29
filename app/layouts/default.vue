<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const open = ref(false);

const links = [
  [
    {
      label: "Dashboard",
      icon: "i-lucide-layout-dashboard",
      to: "/",
      onSelect: () => {
        open.value = false;
      },
    },
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
      label: "GitHub",
      icon: "i-lucide-github",
      to: "/github",
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
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 p-2">
          <img
            src="/logo.png"
            alt="Devion"
            :class="collapsed ? 'h-12 w-12 object-contain' : 'h-8 w-auto'"
          />
          <span v-if="!collapsed" class="font-semibold text-lg">Devion</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
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
