<script setup lang="ts">
interface Props {
  modelValue: string;
  showPreview?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};
</script>

<template>
  <div class="w-full">
    <textarea
      :value="modelValue"
      class="w-full min-h-[calc(100vh-16rem)] bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder-muted font-mono focus:ring-0"
      placeholder="# Tulis markdown Anda di sini...

Contoh sintaks:
- **bold** untuk teks tebal
- *italic* untuk teks miring
- [link](url) untuk tautan
- `code` untuk kode inline"
      @input="handleInput"
    />
  </div>
</template>
