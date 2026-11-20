export interface AIMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderResponse {
  reply: string;
  modelUsed: string;
  tokensUsed?: number;
}

export interface IAIProvider {
  name: string;
  isConfigured(): boolean;
  generateResponse(
    systemPrompt: string,
    messages: AIMessageInput[],
    language: string
  ): Promise<AIProviderResponse>;
}
