<script setup lang="ts">
import MarkdownEditor from "./MarkdownEditor.vue";
import { marked } from "marked";

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Props {
  title: string;
  loading?: boolean;
  markdown?: string;
  isEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  markdown: "",
  isEditing: false,
});

const emit = defineEmits<{
  "update:title": [title: string];
  "update:markdown": [content: string];
}>();

const markdownContent = ref("");

// Watch isEditing to load content when entering edit mode
watch(
  () => props.isEditing,
  (editing) => {
    if (editing) {
      markdownContent.value = props.markdown || "";
    }
  },
);

// Auto-save markdown content
watch(
  markdownContent,
  (newContent, oldContent) => {
    if (
      props.isEditing &&
      oldContent !== undefined &&
      newContent !== oldContent
    ) {
      emit("update:markdown", newContent);
    }
  },
  { flush: "post" },
);

// Initialize on mount
onMounted(() => {
  markdownContent.value = props.markdown || "";
});

const markdownPreviewHtml = computed(() => {
  try {
    const content =
      markdownContent.value || props.markdown || "# Mulai menulis...";
    return marked(content);
  } catch {
    return "<p>Error rendering markdown</p>";
  }
});
</script>

<template>
  <div class="h-full w-full overflow-hidden flex flex-col">
    <!-- Loading State -->
    <div v-if="loading" class="p-6 space-y-4">
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-3/4" />
    </div>

    <!-- View Mode (Read-only) -->
    <div v-else-if="!isEditing" class="overflow-y-auto flex-1 py-12 px-8">
      <div class="max-w-4xl mx-auto">
        <!-- Document Title -->
        <header class="mb-10 pb-6 border-b border-default/50">
          <h1 class="text-4xl font-bold tracking-tight text-foreground">
            {{ title || "Untitled" }}
          </h1>
        </header>

        <!-- Document Content -->
        <!-- eslint-disable vue/no-v-html -->
        <article
          class="prose prose-lg dark:prose-invert max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-pre:bg-elevated prose-pre:border prose-pre:border-default prose-blockquote:border-l-primary prose-blockquote:bg-muted/20 prose-blockquote:py-1 prose-blockquote:not-italic"
        >
          <div v-html="markdownPreviewHtml" />
        </article>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>

    <!-- Edit Mode -->
    <div v-else class="h-full flex flex-col overflow-hidden">
      <!-- Title Input -->
      <div class="px-6 pt-6 pb-4 border-b border-default/50 flex-shrink-0">
        <input
          :value="title"
          class="text-3xl font-bold bg-transparent border-none outline-none w-full placeholder-muted focus:placeholder-muted/50 transition-colors"
          placeholder="Judul Dokumen"
          @blur="
            (e) => $emit('update:title', (e.target as HTMLInputElement).value)
          "
        />
      </div>

      <!-- Markdown Editor with built-in preview -->
      <div class="flex-1 overflow-hidden min-h-0">
        <MarkdownEditor v-model="markdownContent" />
      </div>
    </div>
  </div>
</template>

<style>
/* Custom scrollbar styling */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgb(100 100 100 / 0.3) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgb(100 100 100 / 0.3);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgb(100 100 100 / 0.5);
}
</style>
