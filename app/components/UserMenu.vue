<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const colorMode = useColorMode();
const { user, logout } = useAuth();

const showLogoutDialog = ref(false);

const displayUser = computed(() => ({
  name: user.value?.name || "User",
  avatar: {
    src:
      user.value?.avatar ||
      "https://api.dicebear.com/7.x/avataaars/svg?seed=devion",
    alt: user.value?.name || "User",
  },
}));

const handleLogout = () => {
  showLogoutDialog.value = false;
  logout();
};

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: "label",
      label: displayUser.value.name,
      avatar: displayUser.value.avatar,
      ui: {
        label: 'truncate'
      }
    },
  ],
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      to: "/profile",
    },
  ],
  [
    {
      label: "Appearance",
      icon: "i-lucide-sun-moon",
      children: [
        {
          label: "Light",
          icon: "i-lucide-sun",
          type: "checkbox",
          checked: colorMode.value === "light",
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = "light";
          },
        },
        {
          label: "Dark",
          icon: "i-lucide-moon",
          type: "checkbox",
          checked: colorMode.value === "dark",
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.preference = "dark";
          },
        },
      ],
    },
  ],
  [
    {
      label: "Log out",
      icon: "i-lucide-log-out",
      onSelect: () => {
        showLogoutDialog.value = true;
      },
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...displayUser,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated overflow-hidden w-full"
      :ui="{
        trailingIcon: 'text-dimmed shrink-0 ml-auto',
      }"
    >
      <span v-if="!collapsed" class="truncate flex-1 text-left min-w-0">
        {{ displayUser.name }}
      </span>
    </UButton>
  </UDropdownMenu>

  <Teleport to="body">
    <UModal v-model:open="showLogoutDialog">
      <template #content>
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Icon -->
                <div
                  class="shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-log-out"
                    class="size-5 text-red-600 dark:text-red-400"
                  />
                </div>

                <!-- Title -->
                <h3 class="text-lg font-semibold text-zinc-900 dark:text-white">
                  Log out
                </h3>
              </div>

              <!-- Close Button -->
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                color="neutral"
                size="sm"
                @click="showLogoutDialog = false"
              />
            </div>
          </template>

          <!-- Content -->
          <div class="py-4">
            <p class="text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to log out? You will need to sign in again
              to access your account and data.
            </p>
          </div>

          <template #footer>
            <div class="flex gap-3 justify-end">
              <UButton
                variant="outline"
                color="neutral"
                @click="showLogoutDialog = false"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                icon="i-lucide-log-out"
                @click="handleLogout"
              >
                Log out
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </Teleport>
</template>
