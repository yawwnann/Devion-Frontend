<script setup lang="ts">
import type { PageSettings } from "./types";

interface Props {
  pageSettings: PageSettings;
  loading: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "update:title": [value: string];
  "update:description": [value: string];
  "save:title": [];
  "save:description": [];
  "cover-selected": [file: File];
  "remove-cover": [];
}>();

const editingTitle = ref(false);
const editingDescription = ref(false);
const coverInput = ref<HTMLInputElement | null>(null);

const handleTitleUpdate = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit("update:title", target.value);
};

const onTitleSave = () => {
  editingTitle.value = false;
  emit("save:title");
};

const handleDescriptionUpdate = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit("update:description", target.value);
};

const onDescriptionSave = () => {
  editingDescription.value = false;
  emit("save:description");
};

const onCoverFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    emit("cover-selected", input.files[0]);
  }
  // Reset input so same file can be selected again
  if (input) input.value = "";
};

const triggerCoverInput = () => {
  coverInput.value?.click();
};
</script>

<template>
  <div>
    <!-- Cover Image -->
    <div class="relative group">
      <div
        v-if="loading"
        class="h-48 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse"
      />
      <div
        v-else-if="pageSettings.cover"
        class="h-48 w-full bg-cover bg-center"
        :style="{ backgroundImage: `url(${pageSettings.cover})` }"
      />
      <div
        v-else
        class="h-48 w-full bg-linear-to-br from-primary-500 to-primary-700"
      />

      <!-- Cover Actions -->
      <div
        v-if="!loading"
        class="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
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
          @click="$emit('remove-cover')"
        >
          Remove
        </button>
      </div>
      <input
        ref="coverInput"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onCoverFileChange"
      />
    </div>

    <!-- Page Header Info -->
    <div class="px-6 py-6 pb-0">
      <div class="flex items-center gap-4 mb-4">
        <!-- Icon Placeholder (if needed in future) -->
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
            @click="editingTitle = true"
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
            @click="editingDescription = true"
          >
            {{ pageSettings.description }}
          </p>
        </div>
        <button
          v-else
          class="text-sm text-muted hover:text-zinc-600 dark:hover:text-zinc-400 transition"
          @click="editingDescription = true"
        >
          Add description...
        </button>
      </div>
    </div>
  </div>
</template>
