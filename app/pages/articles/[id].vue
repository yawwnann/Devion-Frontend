<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { marked } from "marked";
import mermaid from "mermaid";
import hljs from "highlight.js";

definePageMeta({ layout: false });

const route = useRoute();
const api = useApi();
const { user } = useAuth();

interface Page {
  id: string;
  title: string;
  icon?: string | null;
  cover?: string | null;
  status: string;
  publishedAt?: string;
  user?: {
    id: string;
    name: string | null;
    avatar?: string | null;
  };
  blocks?: Block[];
}

interface Block {
  id: string;
  type: string;
  content: any;
  order: number;
  children?: Block[];
}

const page = ref<Page | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const renderedContent = ref("");

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
  fetchArticle();
});

const fetchArticle = async () => {
  try {
    loading.value = true;
    error.value = null;
    page.value = await api.get<Page>(
      `/documentation/public/${route.params.id}`,
    );

    // Render markdown content
    if (page.value.blocks && page.value.blocks.length > 0) {
      await renderMarkdownContent();
    }
  } catch (err: any) {
    console.error("Failed to fetch article:", err);
    error.value = err.message || "Failed to load article";
  } finally {
    loading.value = false;
  }
};

const renderMarkdownContent = async () => {
  if (!page.value?.blocks) return;

  // Find markdown block
  const markdownBlock = page.value.blocks.find((b) => b.type === "markdown");
  if (!markdownBlock || !markdownBlock.content?.markdown) {
    renderedContent.value = "";
    return;
  }

  try {
    let html = await marked.parse(markdownBlock.content.markdown);

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

    renderedContent.value = html;
  } catch (err) {
    console.error("Markdown parse error:", err);
    renderedContent.value =
      '<p class="text-red-400">Error parsing markdown</p>';
  }
};

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Navbar -->
    <nav
      class="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md"
    >
      <div
        class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between"
      >
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/logo.png" alt="Devion" class="h-8 w-auto" />
        </NuxtLink>

        <div class="flex items-center gap-4">
          <NuxtLink
            v-if="!user"
            to="/login"
            class="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            v-if="!user"
            to="/register"
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
          >
            Get Started
          </NuxtLink>
          <NuxtLink
            v-else
            to="/dashboard"
            class="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
          >
            Dashboard
          </NuxtLink>
        </div>
      </div>
    </nav>

    <!-- Article Content -->
    <main class="pt-24 pb-20 px-6">
      <div class="max-w-4xl mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-4">
          <div class="h-12 bg-gray-800 rounded animate-pulse" />
          <div class="h-6 bg-gray-800 rounded w-1/3 animate-pulse" />
          <div class="h-64 bg-gray-800 rounded animate-pulse" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-20">
          <Icon
            name="lucide:alert-circle"
            class="w-16 h-16 text-red-500 mx-auto mb-4"
          />
          <h2 class="text-2xl font-bold mb-2">Failed to load article</h2>
          <p class="text-gray-400 mb-6">{{ error }}</p>
          <NuxtLink
            to="/"
            class="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all"
          >
            <Icon name="lucide:arrow-left" class="w-5 h-5" />
            Back to Home
          </NuxtLink>
        </div>

        <!-- Article -->
        <article v-else-if="page">
          <!-- Cover Image -->
          <div
            v-if="page.cover"
            class="mb-8 rounded-xl overflow-hidden border border-gray-800"
          >
            <img
              :src="page.cover"
              :alt="page.title"
              class="w-full h-64 object-cover"
            />
          </div>

          <!-- Header -->
          <header class="mb-8">
            <!-- Icon & Title -->
            <div class="flex items-start gap-4 mb-4">
              <div v-if="page.icon" class="text-4xl flex-shrink-0">
                {{ page.icon }}
              </div>
              <h1 class="text-4xl md:text-5xl font-bold flex-1">
                {{ page.title }}
              </h1>
            </div>

            <!-- Meta -->
            <div class="flex items-center gap-4 text-sm text-gray-400">
              <!-- Author -->
              <div v-if="page.user" class="flex items-center gap-2">
                <img
                  v-if="page.user.avatar"
                  :src="page.user.avatar"
                  :alt="page.user.name || 'Author'"
                  class="w-8 h-8 rounded-full"
                />
                <div
                  v-else
                  class="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-medium"
                >
                  {{ page.user.name?.[0]?.toUpperCase() || "A" }}
                </div>
                <span>{{ page.user.name || "Anonymous" }}</span>
              </div>

              <!-- Date -->
              <div v-if="page.publishedAt" class="flex items-center gap-2">
                <Icon name="lucide:calendar" class="w-4 h-4" />
                <span>{{ formatDate(page.publishedAt) }}</span>
              </div>
            </div>
          </header>

          <!-- Content -->
          <div
            class="prose prose-invert prose-emerald max-w-none article-content"
          >
            <div
              v-if="!renderedContent"
              class="text-gray-400 text-center py-12"
            >
              <Icon
                name="lucide:file-text"
                class="w-12 h-12 mx-auto mb-4 opacity-50"
              />
              <p>No content available</p>
            </div>

            <div v-else v-html="renderedContent" />
          </div>

          <!-- Back Button -->
          <div class="mt-12 pt-8 border-t border-gray-800">
            <NuxtLink
              to="/articles"
              class="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Icon name="lucide:arrow-left" class="w-5 h-5" />
              Back to Articles
            </NuxtLink>
          </div>
        </article>
      </div>
    </main>

    <!-- Footer -->
    <footer class="px-6 py-8 border-t border-gray-800/50">
      <div
        class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2">
          <img src="/logo.png" alt="Devion" class="h-6 w-auto" />
          <span class="text-gray-500 text-sm"
            >© 2026 Devion. All rights reserved.</span
          >
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
:deep(.article-content .mermaid-diagram) {
  margin-top: 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
  background-color: rgb(17 24 39 / 0.5);
  padding: 1.5rem;
  border-radius: 0.75rem;
  border-width: 1px;
  border-color: rgb(31 41 55);
}

:deep(.article-content .mermaid-diagram svg) {
  max-width: 100%;
  height: auto;
}

:deep(.article-content .mermaid-error) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background-color: rgb(69 10 10 / 0.2);
  border-width: 1px;
  border-color: rgb(153 27 27);
  border-radius: 0.5rem;
}

:deep(.article-content pre code) {
  display: block;
  padding: 1rem;
  background-color: rgb(17 24 39);
  border-radius: 0.5rem;
  overflow-x: auto;
  font-size: 0.875rem;
  line-height: 1.25rem;
}

:deep(.article-content code) {
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

:deep(.article-content h1) {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

:deep(.article-content h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  margin-top: 1.5rem;
}

:deep(.article-content h3) {
  font-size: 1.25rem;
  line-height: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

:deep(.article-content p) {
  margin-bottom: 1rem;
  line-height: 1.625;
  color: rgb(209 213 219);
}

:deep(.article-content ul),
:deep(.article-content ol) {
  margin-bottom: 1rem;
  margin-left: 1.5rem;
}

:deep(.article-content li) {
  margin-bottom: 0.5rem;
  color: rgb(209 213 219);
}

:deep(.article-content a) {
  color: rgb(52 211 153);
  text-decoration: underline;
}

:deep(.article-content a:hover) {
  color: rgb(110 231 183);
}

:deep(.article-content blockquote) {
  border-left-width: 4px;
  border-color: rgb(5 150 105);
  padding-left: 1rem;
  font-style: italic;
  color: rgb(156 163 175);
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.article-content table) {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

:deep(.article-content th) {
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

:deep(.article-content td) {
  border-width: 1px;
  border-color: rgb(55 65 81);
  padding-left: 1rem;
  padding-right: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

:deep(.article-content img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}
</style>
