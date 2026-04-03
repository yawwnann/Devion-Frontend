<script setup lang="ts">
import MarkdownIt from 'markdown-it';

const { messages, loading, error, sendMessage, clearHistory } = useChatbot();

const messageInput = ref("");
const messagesContainer = ref<HTMLElement | null>(null);
const isSidebarOpen = ref(false);

// Initialize markdown parser
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
});

// Auto-scroll to bottom when new message arrives
watch(
  () => messages.value.length,
  () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  },
);

const handleSend = () => {
  if (messageInput.value.trim() && !loading.value) {
    sendMessage(messageInput.value);
    messageInput.value = "";
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

const renderMarkdown = (content: string) => {
  return md.render(content);
};

const suggestedQuestions = [
  "Apa yang harus saya kerjakan hari ini?",
  "Proyek apa yang belum selesai?",
  "Kapan deadline proyek saya?",
  "Bagaimana progress GitHub saya?",
];

const handleSuggestedQuestion = (question: string) => {
  messageInput.value = question;
  handleSend();
};
</script>

<template>
  <UDashboardPanel id="chatbot">
    <template #header>
      <AppNavbar title="Chatbot Assistant">
        <template #leading>
          <UDashboardSidebarCollapse
            v-model="isSidebarOpen"
          />
        </template>
        <template #right>
          <UButton
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-trash-2"
            @click="clearHistory"
          >
            Clear History
          </UButton>
        </template>
      </AppNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full">
        <!-- Messages Container -->
        <div
          ref="messagesContainer"
          class="flex-1 overflow-y-auto p-6 space-y-4"
        >
          <!-- Welcome Message -->
          <div
            v-if="messages.length === 0"
            class="flex flex-col items-center justify-center h-full text-center space-y-6"
          >
            <div
              class="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg"
            >
              <UIcon
                name="i-lucide-message-square"
                class="w-10 h-10 text-white"
              />
            </div>
            <div class="space-y-2 max-w-md">
              <h2 class="text-2xl font-bold text-zinc-900 dark:text-white">
                Devion Chatbot Assistant
              </h2>
              <p class="text-zinc-600 dark:text-zinc-400">
                Halo! 👋 Saya asisten AI pribadi Anda untuk mengelola proyek, tugas, dan jadwal.
              </p>
              <p class="text-sm text-zinc-500 dark:text-zinc-500">
                Tanyakan apa saja tentang <span class="font-medium text-emerald-600 dark:text-emerald-400">proyek</span>, 
                <span class="font-medium text-emerald-600 dark:text-emerald-400">tugas</span>, 
                <span class="font-medium text-emerald-600 dark:text-emerald-400">jadwal</span>, atau 
                <span class="font-medium text-emerald-600 dark:text-emerald-400">GitHub</span> Anda!
              </p>
            </div>

            <!-- Suggested Questions -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              <UButton
                v-for="question in suggestedQuestions"
                :key="question"
                variant="outline"
                color="neutral"
                class="justify-start text-left h-auto py-3 px-4 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                @click="handleSuggestedQuestion(question)"
              >
                <span class="text-sm">{{ question }}</span>
              </UButton>
            </div>
            
            <!-- Quick Stats Info -->
            <div class="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800 rounded-xl max-w-lg">
              <p class="text-xs text-emerald-700 dark:text-emerald-300">
                💡 <span class="font-medium">Tips:</span> Saya bisa menampilkan semua proyek, tugas, dan jadwal Anda secara lengkap. 
                Cukup tanya "Berapa total proyek saya?" atau "Tampilkan semua tugas yang belum selesai"
              </p>
            </div>
          </div>

          <!-- Chat Messages -->
          <template v-else>
            <div
              v-for="(message, index) in messages"
              :key="index"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="flex items-start gap-3 max-w-[80%] lg:max-w-[70%]"
                :class="message.role === 'user' ? 'flex-row-reverse' : 'flex-row'"
              >
                <!-- Avatar -->
                <div
                  class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                  :class="
                    message.role === 'user'
                      ? 'bg-zinc-200 dark:bg-zinc-700'
                      : 'bg-gradient-to-br from-emerald-500 to-emerald-600'
                  "
                >
                  <UIcon
                    v-if="message.role === 'assistant'"
                    name="i-lucide-message-square"
                    class="w-4 h-4 text-white"
                  />
                  <UIcon
                    v-else
                    name="i-lucide-user"
                    class="w-4 h-4 text-zinc-600 dark:text-zinc-300"
                  />
                </div>

                <!-- Message Bubble -->
                <div
                  class="rounded-2xl px-4 py-3 prose prose-sm dark:prose-invert max-w-none"
                  :class="
                    message.role === 'user'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
                  "
                >
                  <div
                    class="message-content text-sm"
                    :class="
                      message.role === 'user' ? 'text-white' : 'text-zinc-900 dark:text-white'
                    "
                    v-html="renderMarkdown(message.content)"
                  />
                </div>
              </div>
            </div>

            <!-- Loading Indicator -->
            <div
              v-if="loading"
              class="flex justify-start"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-message-square"
                    class="w-4 h-4 text-white"
                  />
                </div>
                <div
                  class="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style="animation-delay: 0ms"
                    />
                    <div
                      class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style="animation-delay: 150ms"
                    />
                    <div
                      class="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
                      style="animation-delay: 300ms"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div
              v-if="error"
              class="flex justify-center"
            >
              <div
                class="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-center max-w-md"
              >
                <p class="text-sm text-red-600 dark:text-red-400">
                  {{ error }}
                </p>
              </div>
            </div>
          </template>
        </div>

        <!-- Input Area -->
        <div
          class="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950"
        >
          <div class="max-w-4xl mx-auto">
            <div
              class="flex items-end gap-3 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 border border-zinc-200 dark:border-zinc-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
            >
              <textarea
                v-model="messageInput"
                placeholder="Ketik pesan Anda..."
                rows="1"
                class="flex-1 bg-transparent border-none outline-none resize-none text-sm text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-500 max-h-32"
                style="min-height: 24px"
                @keydown="handleKeydown"
                @input="
                  ($event.target as HTMLTextAreaElement).style.height = 'auto';
                  ($event.target as HTMLTextAreaElement).style.height = ($event.target as HTMLTextAreaElement).scrollHeight + 'px';
                "
              />
              <UButton
                variant="solid"
                color="primary"
                size="sm"
                icon="i-lucide-send"
                :disabled="!messageInput.trim() || loading"
                @click="handleSend"
              />
            </div>
            <p class="text-xs text-zinc-500 dark:text-zinc-500 mt-2 text-center">
              Tekan Enter untuk mengirim, Shift + Enter untuk baris baru
            </p>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.message-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.message-content :deep(li) {
  margin: 0.25rem 0;
}

.message-content :deep(p) {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.message-content :deep(code) {
  background: rgba(128, 128, 128, 0.15);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875em;
}

.message-content :deep(pre) {
  background: rgba(128, 128, 128, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.message-content :deep(pre code) {
  background: transparent;
  padding: 0;
}

.message-content :deep(em) {
  font-style: italic;
}

.message-content :deep(a) {
  color: #10b981;
  text-decoration: underline;
}

.message-content :deep(h1),
.message-content :deep(h2),
.message-content :deep(h3),
.message-content :deep(h4),
.message-content :deep(h5),
.message-content :deep(h6) {
  font-weight: 600;
  margin: 0.75rem 0 0.5rem 0;
  line-height: 1.4;
}

.message-content :deep(h1) { font-size: 1.5rem; }
.message-content :deep(h2) { font-size: 1.25rem; }
.message-content :deep(h3) { font-size: 1.125rem; }
</style>
