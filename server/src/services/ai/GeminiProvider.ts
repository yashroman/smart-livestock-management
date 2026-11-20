import {
  IAIProvider,
  AIMessageInput,
  AIProviderResponse,
} from './AIProvider';

import { env } from '../../config/env';
import { GoogleGenAI } from '@google/genai';

export class GeminiProvider implements IAIProvider {
  public name = 'Google Gemini';

  public isConfigured(): boolean {
    return Boolean(env.aiApiKey && env.aiApiKey.trim());
  }

  private async generateWithRetry(
    ai: GoogleGenAI,
    model: string,
    prompt: string
  ): Promise<any> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(
          `[AI] Gemini request attempt ${attempt}/${maxAttempts} using ${model}`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        return response;
      } catch (error: any) {
        const status = error?.status;

        console.error(
          `[AI] Gemini attempt ${attempt} failed:`,
          status || '',
          error?.message || error
        );

        // Retry temporary Google server overload
        if (status === 503 && attempt < maxAttempts) {
          const delay = attempt * 3000;

          console.log(
            `[AI] Gemini overloaded. Retrying in ${delay / 1000} seconds...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );

          continue;
        }

        throw error;
      }
    }

    throw new Error('AI_PROVIDER_ERROR');
  }

  public async generateResponse(
    systemPrompt: string,
    messages: AIMessageInput[],
    language: string
  ): Promise<AIProviderResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI_NOT_CONFIGURED');
    }

    const apiKey = env.aiApiKey.trim();

    const ai = new GoogleGenAI({
      apiKey,
    });

    const userMessages = messages.filter(
      (m) => m.role === 'user'
    );

    const question =
      userMessages.length > 0
        ? userMessages[userMessages.length - 1].content
        : 'Hello';

    const prompt = `
${systemPrompt}

Answer the farmer in ${language}.

Farmer's question:
${question}

Rules:
- Use only the farm information provided above.
- Never invent farm records.
- If information is unavailable, clearly say so.
- Keep the answer clear and useful.
- Give a concise answer suitable for a farmer.
`;

    try {
      const model =
        env.aiModel || 'gemini-3.5-flash';

      const response = await this.generateWithRetry(
        ai,
        model,
        prompt
      );

      const reply = response.text?.trim();

      if (!reply) {
        throw new Error(
          'AI_EMPTY_RESPONSE: Gemini returned no text.'
        );
      }

      console.log(
        `[AI] Gemini response received successfully using ${model}`
      );

      return {
        reply,
        modelUsed: model,
      };

    } catch (err: any) {
      console.error(
        '[AI Farm Assistant] Gemini FINAL ERROR:',
        err?.status || '',
        err?.message || err
      );

      if (err?.status === 503) {
        throw new Error(
          'AI_PROVIDER_OVERLOADED: Gemini is temporarily overloaded.'
        );
      }

      throw err;
    }
  }
}

export const geminiProvider = new GeminiProvider();