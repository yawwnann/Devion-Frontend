<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

interface Props {
  saving?: boolean;
  status?: 'DRAFT' | 'PRIVATE' | 'PUBLISHED';
  isEditing?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:status', status: 'DRAFT' | 'PRIVATE' | 'PUBLISHED'): void;
  (e: 'save'): void;
  (e: 'toggleEdit'): void;
}>();

const statusConfig = {
  DRAFT: { label: 'Draft', icon: 'i-lucide-file-pen', color: 'gray' as const },
  PRIVATE: { label: 'Private', icon: 'i-lucide-lock', color: 'orange' as const },
  PUBLISHED: { label: 'Published', icon: 'i-lucide-globe', color: 'emerald' as const },
};

const currentStatus = computed(() => props.status || 'DRAFT');
const statusInfo = computed(() => statusConfig[currentStatus.value]);

const statusItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Draft',
      icon: 'i-lucide-file-pen',
      type: 'checkbox',
      checked: currentStatus.value === 'DRAFT',
      onSelect: (e: Event) => {
        e.preventDefault();
        emit('update:status', 'DRAFT');
      },
    },
    {
      label: 'Private',
      icon: 'i-lucide-lock',
      type: 'checkbox',
      checked: currentStatus.value === 'PRIVATE',
      onSelect: (e: Event) => {
        e.preventDefault();
        emit('update:status', 'PRIVATE');
      },
    },
    {
      label: 'Published',
      icon: 'i-lucide-globe',
      type: 'checkbox',
      checked: currentStatus.value === 'PUBLISHED',
      onSelect: (e: Event) => {
        e.preventDefault();
        emit('update:status', 'PUBLISHED');
      },
    },
  ],
]);
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

        <!-- Status Dropdown -->
        <UDropdownMenu :items="statusItems">
          <UButton
            :color="statusInfo.color"
            :variant="currentStatus === 'PUBLISHED' ? 'soft' : 'solid'"
            size="sm"
            :icon="statusInfo.icon"
            trailing-icon="i-lucide-chevron-down"
          >
            {{ statusInfo.label }}
          </UButton>
        </UDropdownMenu>
      </div>
    </template>
  </UDashboardNavbar>
</template>
