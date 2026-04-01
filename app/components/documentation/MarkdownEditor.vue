<script setup lang="ts">
import { marked } from "marked";
import mermaid from "mermaid";
import hljs from "highlight.js";

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

const previewHtml = ref("");
const showSplit = ref(true);

// Configure marked with renderer for code highlighting
const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(text, { language: lang }).value;
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } catch (err) {
      console.error("Highlight error:", err);
    }
  }
  // Fallback to plain code block
  const escapedCode = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  return `<pre><code>${escapedCode}</code></pre>`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
});

// Configure mermaid
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    themeVariables: {
      primaryColor: "#10b981",
      primaryTextColor: "#fff",
      primaryBorderColor: "#059669",
      lineColor: "#6b7280",
      secondaryColor: "#1f2937",
      tertiaryColor: "#374151",
    },
  });
});

const handleInput = (e: Event) => {
  const target = e.target as HTMLTextAreaElement;
  emit("update:modelValue", target.value);
};

const renderMarkdown = async () => {
  try {
    let html = await marked.parse(props.modelValue || "");

    // Find and render mermaid diagrams
    const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
    const matches = [...html.matchAll(mermaidRegex)];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      if (!match || !match[1]) continue;

      const mermaidCode = match[1];
      const id = `mermaid-${Date.now()}-${i}`;

      try {
        const { svg } = await mermaid.render(id, mermaidCode);
        html = html.replace(
          match[0],
          `<div class="mermaid-diagram">${svg}</div>`,
        );
      } catch (err) {
        console.error("Mermaid render error:", err);
        html = html.replace(
          match[0],
          `<div class="mermaid-error">
            <p class="text-red-400">Error rendering diagram:</p>
            <pre class="text-sm text-gray-400">${err}</pre>
          </div>`,
        );
      }
    }

    previewHtml.value = html;
  } catch (err) {
    console.error("Markdown parse error:", err);
    previewHtml.value = '<p class="text-red-400">Error parsing markdown</p>';
  }
};

watch(() => props.modelValue, renderMarkdown, { immediate: true });
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Toolbar -->
    <div
      class="flex items-center justify-between px-4 py-2 border-b border-default flex-shrink-0"
    >
      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          variant="ghost"
          icon="i-lucide-eye"
          :color="showSplit ? 'primary' : 'neutral'"
          @click="showSplit = !showSplit"
        >
          {{ showSplit ? "Split View" : "Editor Only" }}
        </UButton>
      </div>
      <div class="text-xs text-muted">Markdown + Mermaid Support</div>
    </div>

    <!-- Editor Area -->
    <div
      class="flex-1 grid min-h-0"
      :class="showSplit ? 'grid-cols-2' : 'grid-cols-1'"
    >
      <!-- Editor -->
      <div class="relative border-r border-default flex flex-col min-h-0">
        <textarea
          :value="modelValue"
          class="w-full h-full p-6 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder-muted font-mono focus:ring-0 overflow-y-auto"
          placeholder="# Tulis Markdown Anda

## Contoh Sintaks

**Bold text** dan *italic text*

- List item 1
- List item 2

```javascript
const hello = 'world';
```

## Mermaid Diagram

```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[OK]
    B -->|No| D[End]
```"
          @input="handleInput"
        />
      </div>

      <!-- Preview -->
      <div
        v-if="showSplit"
        class="overflow-y-auto p-6 prose prose-invert prose-emerald max-w-none min-h-0"
        v-html="previewHtml"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.mermaid-diagram) {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
}

:deep(.mermaid-diagram svg) {
  max-width: 100%;
  height: auto;
}

:deep(.mermaid-error) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: rgb(69 10 10 / 0.2);
  border-width: 1px;
  border-color: rgb(153 27 27);
  border-radius: 0.5rem;
}

:deep(pre code) {
  display: block;
  padding: 1rem;
  background-color: rgb(17 24 39);
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

:deep(code) {
  padding-left: 0.375rem;
  padding-right: 0.375rem;
  padding-top: 0.125rem;
  padding-bottom: 0.125rem;
  background-color: rgb(31 41 55);
  border-radius: 0.25rem;
  color: rgb(52 211 153);
  font-size: 0.875rem;
  line-height: 1.25rem;
}

:deep(h1) {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

:deep(h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
}

:deep(h3) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

:deep(p) {
  margin-bottom: 1rem;
  line-height: 1.625;
}

:deep(ul),
:deep(ol) {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
}

:deep(li) {
  margin-bottom: 0.5rem;
}

:deep(a) {
  color: rgb(52 211 153);
  text-decoration: underline;
}

:deep(a:hover) {
  color: rgb(110 231 183);
}

:deep(blockquote) {
  border-left-width: 4px;
  border-color: rgb(5 150 105);
  padding-left: 1rem;
  font-style: italic;
  color: rgb(156 163 175);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(th) {
  background-color: rgb(31 41 55);
  border-width: 1px;
  border-color: rgb(55 65 81);
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  text-align: left;
  font-weight: 600;
}

:deep(td) {
  border-width: 1px;
  border-color: rgb(55 65 81);
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

:deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
