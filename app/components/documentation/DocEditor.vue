<script setup lang="ts">
import BlockEditor from "./BlockEditor.vue";
import MarkdownEditor from "./MarkdownEditor.vue";
import { marked } from "marked";

// Configure marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Block {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

interface Props {
  title: string;
  blocks: Block[];
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
  "update:block": [blockId: string, content: Record<string, unknown>];
  "delete:block": [blockId: string];
  "add:block": [type: string];
  "update:markdown": [content: string];
}>();

// ========== CORE STATE ==========
const mode = ref<"blocks" | "markdown">("blocks");
const markdownContent = ref("");

// Track document identity for detecting document changes
const documentKey = computed(() => props.title + props.markdown.slice(0, 20));
let lastDocumentKey = "";

// ========== TABS CONFIG ==========
const tabItems = [
  { label: "Blocks", slot: "blocks" },
  { label: "Markdown", slot: "markdown" },
];

// ========== BLOCKS TO MARKDOWN CONVERTER ==========
const blocksToMarkdown = (blocks: Block[]): string => {
  return blocks
    .map((block) => {
      const content = block.content as Record<string, unknown>;
      switch (block.type) {
        case "heading": {
          const level = (content.level as number) || 1;
          return `${"#".repeat(level)} ${(content.text as string) || ""}`;
        }
        case "text":
          return (content.text as string) || "";
        case "bullet":
          return `- ${(content.text as string) || ""}`;
        case "todo":
          return `- [${content.checked ? "x" : " "}] ${(content.text as string) || ""}`;
        case "quote":
          return `> ${(content.text as string) || ""}`;
        case "code":
          return `\`\`\`\n${(content.code as string) || ""}\n\`\`\``;
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n");
};

// ========== TAB SWITCHING LOGIC ==========
const activeTab = computed({
  get: () => tabItems.findIndex((i) => i.slot === mode.value),
  set: (idx) => {
    const newMode = tabItems[idx]?.slot as "blocks" | "markdown";
    if (!newMode || newMode === mode.value) return;

    // Blocks → Markdown: Auto-convert and switch
    if (newMode === "markdown" && mode.value === "blocks") {
      if (props.blocks.length > 0) {
        markdownContent.value = blocksToMarkdown(props.blocks);
      }
      mode.value = "markdown";
    } else if (newMode === "blocks" && mode.value === "markdown") {
      // Markdown → Blocks: Switch langsung tanpa konfirmasi
      mode.value = "blocks";
    }
  },
});

// ========== MODAL HANDLERS ==========
// Removed - tidak ada modal lagi

// ========== INITIALIZATION & DOCUMENT CHANGES ==========
const initializeForDocument = () => {
  const hasMarkdown = props.markdown && props.markdown.length > 0;
  const hasBlocks = props.blocks.length > 0;

  // Set mode based on content
  mode.value = hasMarkdown && !hasBlocks ? "markdown" : "blocks";
  markdownContent.value = props.markdown || "";
  lastDocumentKey = documentKey.value;
};

// Watch for document changes (when navigating via sidebar)
watch(documentKey, (newKey) => {
  if (newKey !== lastDocumentKey) {
    initializeForDocument();
  }
});

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
    // Only save if: editing + in markdown mode + content actually changed
    if (
      props.isEditing &&
      mode.value === "markdown" &&
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
  initializeForDocument();
});

// ========== PREVIEW RENDERERS ==========
const blocksPreviewHtml = computed(() => {
  if (!props.blocks.length) {
    return '<p class="text-muted">Mulai menulis untuk melihat preview...</p>';
  }

  return props.blocks
    .map((block) => {
      const content = block.content as Record<string, unknown>;
      switch (block.type) {
        case "heading":
          return `<h1>${(content.text as string) || ""}</h1>`;
        case "text":
          return `<p>${(content.text as string) || ""}</p>`;
        case "bullet":
          return `<ul><li>${(content.text as string) || ""}</li></ul>`;
        case "todo": {
          const checked = content.checked ? "checked" : "";
          const style = content.checked ? 'class="line-through"' : "";
          return `<div class="flex items-center gap-2"><input type="checkbox" ${checked} disabled /><span ${style}>${(content.text as string) || ""}</span></div>`;
        }
        case "quote":
          return `<blockquote>${(content.text as string) || ""}</blockquote>`;
        case "code":
          return `<pre><code>${(content.code as string) || ""}</code></pre>`;
        default:
          return "";
      }
    })
    .join("");
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
  <div class="h-full w-full">
    <!-- Loading State -->
    <div v-if="loading" class="p-6 space-y-4">
      <USkeleton class="h-6 w-full" />
      <USkeleton class="h-6 w-3/4" />
    </div>

    <!-- View Mode (Read-only) -->
    <div v-else-if="!isEditing" class="overflow-y-auto h-full py-12 px-8">
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
          <div v-if="blocks.length && !markdown" v-html="blocksPreviewHtml" />
          <div v-else v-html="markdownPreviewHtml" />
        </article>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>

    <!-- Edit Mode (Split View) -->
    <div v-else class="h-full flex flex-col">
      <!-- Mode Selector Header -->
      <div
        class="flex items-center justify-between px-6 py-3 border-b border-default bg-elevated/50 backdrop-blur-sm sticky top-0 z-20"
      >
        <span class="text-sm font-medium text-muted">Mode Editor</span>

        <!-- Custom Tabs with Active Indicator -->
        <div class="flex items-center gap-1 bg-muted/30 rounded-lg p-1">
          <button
            v-for="(item, idx) in tabItems"
            :key="item.slot"
            :class="[
              'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
              activeTab === idx
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-muted/50',
            ]"
            @click="activeTab = idx"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <!-- Split View: Editor + Preview -->
      <div class="flex-1 grid grid-cols-2 min-h-0">
        <!-- Left: Editor Panel -->
        <div class="border-r border-default flex flex-col overflow-hidden">
          <!-- Title Input -->
          <div class="px-6 pt-6 pb-4 border-b border-default/50">
            <input
              :value="title"
              class="text-3xl font-bold bg-transparent border-none outline-none w-full placeholder-muted focus:placeholder-muted/50 transition-colors"
              placeholder="Judul Dokumen"
              @blur="
                (e) =>
                  $emit('update:title', (e.target as HTMLInputElement).value)
              "
            />
          </div>

          <!-- Editor Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <div v-if="mode === 'blocks'">
              <!-- Warning for markdown-only docs -->
              <div
                v-if="!blocks.length && markdown"
                class="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3"
              >
                <UIcon
                  name="i-heroicons-information-circle"
                  class="w-5 h-5 text-amber-500 shrink-0 mt-0.5"
                />
                <p class="text-sm text-amber-600 dark:text-amber-400">
                  Dokumen ini menggunakan Markdown. Gunakan tab
                  <strong>Markdown</strong> untuk mengedit.
                </p>
              </div>
              <BlockEditor
                :blocks="blocks"
                @update="(id, content) => $emit('update:block', id, content)"
                @delete="(id) => $emit('delete:block', id)"
                @add="(type) => $emit('add:block', type)"
              />
            </div>

            <MarkdownEditor
              v-else
              v-model="markdownContent"
              :show-preview="false"
            />
          </div>
        </div>

        <!-- Right: Preview Panel -->
        <div class="flex flex-col bg-muted/30 overflow-hidden">
          <!-- Preview Header -->
          <div class="px-6 py-3 border-b border-default/50 bg-muted/50">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-eye" class="w-4 h-4 text-muted" />
              <span
                class="text-xs font-semibold text-muted uppercase tracking-wider"
                >Preview</span
              >
            </div>
          </div>

          <!-- Preview Content -->
          <div class="flex-1 overflow-y-auto p-6">
            <!-- eslint-disable vue/no-v-html -->
            <div
              class="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold"
            >
              <h1
                class="text-3xl font-bold mb-6 pb-4 border-b border-default/30"
              >
                {{ title || "Untitled" }}
              </h1>
              <div v-if="mode === 'blocks'" v-html="blocksPreviewHtml" />
              <div v-else v-html="markdownPreviewHtml" />
            </div>
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>
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
