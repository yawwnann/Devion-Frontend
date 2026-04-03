<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const tabs = [
  { id: 'overview', label: 'Overview', icon: 'i-lucide-user' },
  { id: 'activity', label: 'Activity', icon: 'i-lucide-bar-chart-2' },
  { id: 'badges', label: 'Badges', icon: 'i-lucide-award' },
];

const activeTab = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <div class="border-b border-zinc-200 dark:border-zinc-800 mb-6">
    <div class="flex gap-1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
          activeTab === tab.id
            ? 'border-primary text-primary'
            : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
        ]"
        @click="activeTab = tab.id"
      >
        <UIcon :name="tab.icon" class="size-4" />
        {{ tab.label }}
      </button>
    </div>
  </div>
</template>
