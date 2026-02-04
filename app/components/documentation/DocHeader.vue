<script setup lang="ts">
interface Props {
  saving?: boolean;
  isPublished?: boolean;
  isEditing?: boolean;
}

defineProps<Props>();

defineEmits<{
  (e: "togglePublish" | "save" | "toggleEdit"): void;
}>();
</script>

<template>
  <UDashboardNavbar>
    <template #leading>
      <UDashboardSidebarCollapse />
      <UButton
        to="/documentation"
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Kembali
      </UButton>
    </template>

    <template #right>
      <div class="flex items-center gap-3">
        <!-- Save Status -->
        <div class="flex items-center gap-1.5 text-xs text-muted">
          <UIcon
            v-if="saving"
            name="i-lucide-loader-2"
            class="size-3.5 animate-spin"
          />
          <UIcon
            v-else
            name="i-lucide-check-circle"
            class="size-3.5 text-emerald-500"
          />
          <span>{{ saving ? "Menyimpan..." : "Tersimpan" }}</span>
        </div>

        <div class="w-px h-5 bg-default" />

        <!-- Edit/View Toggle -->
        <UButton
          v-if="!isEditing"
          variant="soft"
          color="primary"
          size="sm"
          icon="i-lucide-pencil"
          @click="$emit('toggleEdit')"
        >
          Edit
        </UButton>

        <template v-else>
          <UButton
            variant="soft"
            color="success"
            size="sm"
            icon="i-lucide-save"
            @click="$emit('save')"
          >
            Simpan
          </UButton>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-x"
            @click="$emit('toggleEdit')"
          >
            Batal
          </UButton>
        </template>

        <div class="w-px h-5 bg-default" />

        <!-- Publish Status -->
        <UButton
          :color="isPublished ? 'success' : 'neutral'"
          :variant="isPublished ? 'soft' : 'solid'"
          size="sm"
          :icon="isPublished ? 'i-lucide-globe' : 'i-lucide-upload'"
          @click="$emit('togglePublish')"
        >
          {{ isPublished ? "Dipublikasi" : "Publikasi" }}
        </UButton>
      </div>
    </template>
  </UDashboardNavbar>
</template>
