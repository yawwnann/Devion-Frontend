<script setup lang="ts">
import type { TodoPageSettings as PageSettings } from "~/types/todos";

interface Props {
  pageSettings: PageSettings;
  editingTitle: boolean;
  editingDescription: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:editingTitle": [value: boolean];
  "update:editingDescription": [value: boolean];
  "update:title": [value: string];
  "update:description": [value: string];
  "save:title": [];
  "save:description": [];
}>();

const handleTitleUpdate = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:title", target.value);
};

const onTitleSave = () => {
  emit("save:title");
};

const handleDescriptionUpdate = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:description", target.value);
};

const onDescriptionSave = () => {
  emit("save:description");
};

const setTitleEditing = (value: boolean) => {
  emit("update:editingTitle", value);
};

const setDescriptionEditing = (value: boolean) => {
  emit("update:editingDescription", value);
};
</script>

<template>
  <!-- Page Header Info -->
  <div class="px-6 py-6">
    <div class="flex items-center gap-4 mb-4">
      <!-- Icon Placeholder -->
      <div
        v-if="pageSettings.icon"
        class="size-16 bg-white dark:bg-zinc-950 rounded-xl shadow-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800"
      >
        <span class="text-3xl">{{ pageSettings.icon }}</span>
      </div>

      <!-- Editable Title -->
      <div class="flex-1">
        <input
          v-if="editingTitle"
          :value="pageSettings.title"
          class="text-3xl font-bold bg-transparent border-none outline-none w-full"
          autofocus
          @input="handleTitleUpdate"
          @blur="onTitleSave"
          @keyup.enter="onTitleSave"
        />
        <h1
          v-else
          class="text-3xl font-bold cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-2 -mx-2 py-1 transition inline-block"
          @click="setTitleEditing(true)"
        >
          {{ pageSettings.title }}
        </h1>
      </div>
    </div>

    <!-- Editable Description -->
    <div class="mb-6">
      <div v-if="editingDescription || pageSettings.description">
        <textarea
          v-if="editingDescription"
          :value="pageSettings.description || ''"
          placeholder="Add a description..."
          class="w-full bg-transparent border-none outline-none text-muted resize-none text-sm"
          rows="2"
          autofocus
          @input="handleDescriptionUpdate"
          @blur="onDescriptionSave"
        />
        <p
          v-else
          class="text-sm text-muted cursor-text hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-2 -mx-2 py-1 transition"
          @click="setDescriptionEditing(true)"
        >
          {{ pageSettings.description }}
        </p>
      </div>
      <button
        v-else
        class="text-sm text-muted hover:text-zinc-600 dark:hover:text-zinc-400 transition"
        @click="setDescriptionEditing(true)"
      >
        Add description...
      </button>
    </div>
  </div>
</template>
