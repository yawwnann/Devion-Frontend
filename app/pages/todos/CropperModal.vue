<script setup lang="ts">
import { Cropper } from "vue-advanced-cropper";
import "vue-advanced-cropper/dist/style.css";

interface Props {
  show: boolean;
  selectedImage: string | null;
  uploading: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  crop: [{ canvas: HTMLCanvasElement }];
  upload: [];
}>();

const handleCrop = ({ canvas }: { canvas: HTMLCanvasElement }) => {
  emit("crop", { canvas });
};
</script>

<template>
  <UModal :model-value="show" @update:model-value="emit('close')">
    <template #content>
      <div class="p-6 bg-white dark:bg-zinc-950 max-w-4xl mx-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold">Crop Cover Image</h3>
          <button
            class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            @click="emit('close')"
          >
            <UIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="mb-6">
          <div class="h-[400px] bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden">
            <Cropper
              v-if="selectedImage"
              :src="selectedImage"
              :stencil-props="{
                aspectRatio: 6,
              }"
              class="h-full"
              @change="handleCrop"
            />
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            color="neutral"
            @click="emit('close')"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="uploading"
            @click="emit('upload')"
          >
            {{ uploading ? "Uploading..." : "Save Cover" }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
