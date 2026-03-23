import type { ChatMessage } from "~/types/chatbot";

export interface ChatbotState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  conversationHistory: ChatMessage[];
}

export const useChatbot = () => {
  const api = useApi();
  const toast = useToast();

  const state = ref<ChatbotState>({
    messages: [],
    loading: false,
    error: null,
    conversationHistory: [],
  });

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: content.trim(),
    };

    state.value.messages.push(userMessage);
    state.value.loading = true;
    state.value.error = null;

    try {
      const response = await api.post<{
        response: string;
        conversationHistory: ChatMessage[];
      }>("/chatbot/chat", {
        message: content.trim(),
        conversationHistory: state.value.conversationHistory,
      });

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
      };

      state.value.messages.push(assistantMessage);
      state.value.conversationHistory = response.conversationHistory;
    } catch (error) {
      console.error("Chatbot error:", error);
      state.value.error =
        "Gagal mengirim pesan. Pastikan Ollama sudah running.";

      toast.add({
        title: "Error",
        description: "Gagal mengirim pesan ke chatbot",
        color: "error",
      });
    } finally {
      state.value.loading = false;
    }
  };

  const clearHistory = () => {
    state.value.messages = [];
    state.value.conversationHistory = [];
    state.value.error = null;
  };

  const removeLastMessage = () => {
    if (state.value.messages.length > 0) {
      state.value.messages.pop();
    }
  };

  return {
    messages: computed(() => state.value.messages),
    loading: computed(() => state.value.loading),
    error: computed(() => state.value.error),
    conversationHistory: computed(() => state.value.conversationHistory),
    sendMessage,
    clearHistory,
    removeLastMessage,
  };
};
