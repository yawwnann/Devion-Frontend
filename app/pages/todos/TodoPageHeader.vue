<script setup lang="ts">
import type { PageSettings } from "./types";

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
  "cover-selected": [file: File];
  "remove-cover": [];
}>();

const coverInput = ref<HTMLInputElement | null>(null);

const triggerCoverInput = () => {
  coverInput.value?.click();
};

const onCoverSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  emit("cover-selected", file);
  target.value = "";
};

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
  <div class="relative h-52 w-full overflow-hidden">
    <!-- Cover Image -->
    <img
      v-if="pageSettings.cover"
      :src="pageSettings.cover"
      class="w-full h-full object-cover"
      alt="Cover"
    />
    <div
      v-else
      class="w-full h-full bg-gradient-to-r from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900"
    />

    <!-- Cover Overlay Controls -->
    <div
      class="absolute inset-0 bg-black/0 hover:bg-black/10 dark:bg-black/0 dark:hover:bg-black/20 transition flex items-end justify-end p-6 gap-2"
    >
      <div
        class="opacity-0 hover:opacity-100 transition flex gap-2"
        :class="{ 'opacity-100': pageSettings.cover }"
      >
        <button
          class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md backdrop-blur-md transition border border-white/20"
          @click="triggerCoverInput"
        >
          {{ pageSettings.cover ? "Change" : "Add cover" }}
        </button>
        <button
          v-if="pageSettings.cover"
          class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md backdrop-blur-md transition border border-white/20"
          @click="emit('remove-cover')"
        >
          Remove
        </button>
      </div>
    </div>

    <input
      ref="coverInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="onCoverSelected"
    />
  </div>

  <!-- Page Header Info -->
  <div class="px-6 py-6 pb-0">
    <div class="flex items-center gap-4 mb-4">
      <!-- Icon Placeholder -->
      <div
        v-if="pageSettings.icon"
        class="size-16 -mt-12 bg-white dark:bg-zinc-950 rounded-xl shadow-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 relative z-10"
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
