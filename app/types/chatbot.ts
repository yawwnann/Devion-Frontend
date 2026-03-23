export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatbotResponse {
  response: string;
  conversationHistory: ChatMessage[];
}

export interface ChatbotRequest {
  message: string;
  conversationHistory?: ChatMessage[];
}
