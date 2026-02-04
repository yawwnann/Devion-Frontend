<script setup lang="ts">
interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

interface Props {
  blocks: Block[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update", blockId: string, content: Record<string, unknown>): void;
  (e: "delete" | "add", value: string): void;
}>();

const updateBlock = (blockId: string, content: Record<string, unknown>) => {
  emit("update", blockId, content);
};

const deleteBlock = (blockId: string) => {
  emit("delete", blockId);
};

const addBlock = (type: string) => {
  emit("add", type);
};
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="block in blocks"
      :key="block.id"
      class="group relative rounded-lg hover:bg-muted/30 transition-colors -mx-2 px-2"
    >
      <!-- Delete Button -->
      <div
        class="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <UButton
          icon="i-lucide-grip-vertical"
          variant="ghost"
          size="xs"
          color="neutral"
          class="cursor-grab"
        />
      </div>
      <div
        class="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <UButton
          icon="i-lucide-trash-2"
          variant="ghost"
          size="xs"
          color="error"
          @click="deleteBlock(block.id)"
        />
      </div>

      <!-- Text Block -->
      <div v-if="block.type === 'text'" class="py-2">
        <textarea
          :value="(block.content as any).text"
          class="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed placeholder-muted focus:ring-0"
          placeholder="Ketik sesuatu..."
          rows="1"
          @input="
            (e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
              updateBlock(block.id, { text: target.value });
            }
          "
        />
      </div>

      <!-- Heading Block -->
      <div v-else-if="block.type === 'heading'" class="py-3">
        <input
          :value="(block.content as any).text"
          class="w-full bg-transparent border-none outline-none font-bold text-2xl placeholder-muted focus:ring-0"
          placeholder="Judul"
          @input="
            (e) =>
              updateBlock(block.id, {
                text: (e.target as HTMLInputElement).value,
                level: 1,
              })
          "
        />
      </div>

      <!-- Bullet List Block -->
      <div
        v-else-if="block.type === 'bullet'"
        class="flex items-start gap-3 py-2"
      >
        <span class="text-primary text-lg mt-0.5">•</span>
        <input
          :value="(block.content as any).text"
          class="flex-1 bg-transparent border-none outline-none text-base placeholder-muted focus:ring-0"
          placeholder="Item daftar"
          @input="
            (e) =>
              updateBlock(block.id, {
                text: (e.target as HTMLInputElement).value,
              })
          "
        />
      </div>

      <!-- Todo Block -->
      <div
        v-else-if="block.type === 'todo'"
        class="flex items-start gap-3 py-2"
      >
        <UCheckbox
          :model-value="(block.content as any).checked"
          class="mt-0.5"
          @update:model-value="
            (val) =>
              updateBlock(block.id, {
                text: (block.content as any).text,
                checked: val,
              })
          "
        />
        <input
          :value="(block.content as any).text"
          :class="[
            'flex-1 bg-transparent border-none outline-none text-base placeholder-muted focus:ring-0 transition-all',
            (block.content as any).checked ? 'line-through text-muted' : '',
          ]"
          placeholder="Tugas"
          @input="
            (e) =>
              updateBlock(block.id, {
                text: (e.target as HTMLInputElement).value,
                checked: (block.content as any).checked,
              })
          "
        />
      </div>

      <!-- Quote Block -->
      <div
        v-else-if="block.type === 'quote'"
        class="border-l-4 border-primary/50 bg-primary/5 pl-4 py-3 rounded-r-lg my-1"
      >
        <textarea
          :value="(block.content as any).text"
          class="w-full bg-transparent border-none outline-none resize-none text-base italic leading-relaxed placeholder-muted focus:ring-0"
          placeholder="Kutipan..."
          rows="1"
          @input="
            (e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
              updateBlock(block.id, { text: target.value });
            }
          "
        />
      </div>

      <!-- Code Block -->
      <div v-else-if="block.type === 'code'" class="py-2">
        <textarea
          :value="(block.content as any).code"
          class="w-full bg-elevated border border-default rounded-xl p-4 font-mono text-sm resize-none placeholder-muted focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          placeholder="// Kode di sini..."
          rows="3"
          @input="
            (e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
              updateBlock(block.id, { code: target.value });
            }
          "
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="blocks.length === 0" class="text-center py-16">
      <div
        class="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4"
      >
        <UIcon name="i-lucide-file-text" class="size-8 text-muted" />
      </div>
      <p class="text-foreground font-medium mb-1">Belum ada konten</p>
      <p class="text-muted text-sm">Mulai dengan menambahkan blok di bawah</p>
    </div>

    <!-- Add Block Buttons -->
    <div class="mt-8 pt-6 border-t border-default/50">
      <p class="text-xs font-medium text-muted uppercase tracking-wider mb-3">
        Tambah Blok
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-type"
          size="xs"
          @click="addBlock('text')"
        >
          Teks
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-heading"
          size="xs"
          @click="addBlock('heading')"
        >
          Judul
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-list"
          size="xs"
          @click="addBlock('bullet')"
        >
          Daftar
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-check-square"
          size="xs"
          @click="addBlock('todo')"
        >
          To-do
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-quote"
          size="xs"
          @click="addBlock('quote')"
        >
          Kutipan
        </UButton>
        <UButton
          variant="soft"
          color="neutral"
          icon="i-lucide-code"
          size="xs"
          @click="addBlock('code')"
        >
          Kode
        </UButton>
      </div>
    </div>
  </div>
</template>
