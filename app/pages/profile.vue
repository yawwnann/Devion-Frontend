<script setup lang="ts">
// Profile page - fetch dari API

const { user, logout, fetchUser } = useAuth()

onMounted(async () => {
  if (!user.value) {
    await fetchUser()
  }
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  })
}
</script>

<template>
  <UDashboardPanel id="profile">
    <template #header>
      <UDashboardNavbar title="Profile">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-2xl">
        <UCard v-if="user">
          <div class="space-y-6">
            <!-- Avatar & Name -->
            <div class="flex items-center gap-4">
              <UAvatar
                :src="user.avatar || undefined"
                :alt="user.name || 'User'"
                size="xl"
              />
              <div>
                <h2 class="text-xl font-bold">
                  {{ user.name || "User" }}
                </h2>
                <p class="text-muted">
                  {{ user.email }}
                </p>
              </div>
            </div>

            <USeparator />

            <!-- Info -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-github" class="size-5 text-muted" />
                  <span class="text-muted">GitHub</span>
                </div>
                <span class="font-medium">
                  {{
                    user.githubUsername
                      ? `@${user.githubUsername}`
                      : "Not connected"
                  }}
                </span>
              </div>

              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon name="i-lucide-calendar" class="size-5 text-muted" />
                  <span class="text-muted">Member since</span>
                </div>
                <span class="font-medium">{{
                  formatDate(user.createdAt)
                }}</span>
              </div>
            </div>

            <USeparator />

            <!-- Actions -->
            <div class="flex gap-3">
              <UButton
                variant="ghost"
                color="error"
                icon="i-lucide-log-out"
                @click="logout"
              >
                Log Out
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Loading -->
        <USkeleton v-else class="h-64" />
      </div>
    </template>
  </UDashboardPanel>
</template>
