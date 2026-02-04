<script setup lang="ts">
interface Props {
  count: number;
}

defineProps<Props>();

const emit = defineEmits<{
  "update:status": [status: string];
  "delete": [];
  "clear": [];
}>();
</script>

<template>
  <div
    class="flex items-center gap-3 mb-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
  >
    <span class="text-sm font-medium"> {{ count }} selected </span>
    <div class="flex-1" />
    <UButton
      variant="ghost"
      size="sm"
      icon="i-lucide-check"
      @click="emit('update:status', 'DONE')"
    >
      Mark as Done
    </UButton>
    <UButton
      variant="ghost"
      size="sm"
      icon="i-lucide-circle-dashed"
      @click="emit('update:status', 'TODO')"
    >
      Mark as Todo
    </UButton>
    <UButton
      variant="ghost"
      size="sm"
      color="error"
      icon="i-lucide-trash-2"
      @click="emit('delete')"
    >
      Delete
    </UButton>
    <button
      class="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition"
      @click="emit('clear')"
    >
      <UIcon name="i-lucide-x" class="size-4" />
    </button>
  </div>
</template>
