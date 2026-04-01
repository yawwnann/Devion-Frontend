<script setup lang="ts">
interface Page {
  id: string;
  title: string;
  icon: string | null;
  isPublished: boolean;
  createdAt: string;
}

interface Props {
  pages: Page[];
  activePage?: string;
}

defineProps<Props>();
</script>

<template>
  <div
    class="h-full border-r border-default bg-elevated/30 flex flex-col overflow-hidden"
  >
    <!-- Header -->
    <div
      class="px-5 py-4 border-b border-default/50 bg-elevated/50 flex-shrink-0"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-book-open" class="size-4 text-primary" />
        <h2 class="text-sm font-semibold text-foreground">Dokumentasi</h2>
      </div>
      <p class="text-xs text-muted mt-1">{{ pages.length }} dokumen</p>
    </div>

    <!-- Document List -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <!-- Empty State -->
      <div v-if="pages.length === 0" class="p-6 text-center">
        <div
          class="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3"
        >
          <UIcon name="i-lucide-file-text" class="size-6 text-muted" />
        </div>
        <p class="text-sm font-medium text-foreground">Belum ada dokumen</p>
        <p class="text-xs text-muted mt-1">Buat dokumen pertama Anda</p>
      </div>

      <!-- Document Items -->
      <div v-else class="p-3 space-y-1">
        <NuxtLink
          v-for="page in pages"
          :key="page.id"
          :to="`/documentation/${page.id}`"
          :class="[
            'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
            activePage === page.id
              ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
              : 'hover:bg-muted/50 text-foreground/80 hover:text-foreground',
          ]"
        >
          <div
            :class="[
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
              activePage === page.id
                ? 'bg-primary/20'
                : 'bg-muted/50 group-hover:bg-muted',
            ]"
          >
            <UIcon
              :name="page.icon || 'i-lucide-file-text'"
              :class="[
                'size-4',
                activePage === page.id ? 'text-primary' : 'text-muted',
              ]"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">
              {{ page.title || "Untitled" }}
            </p>
            <p class="text-xs text-muted mt-0.5">
              {{
                new Date(page.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              }}
            </p>
          </div>
          <div v-if="page.isPublished" class="shrink-0">
            <div
              class="w-2 h-2 rounded-full bg-emerald-500"
              title="Published"
            />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
