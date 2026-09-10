'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

const LoungeTranslationInputSchema = z.object({
  text: z.string().describe('Korean source text to translate'),
});
export type LoungeTranslationInput = z.infer<typeof LoungeTranslationInputSchema>;

const LoungeTranslationOutputSchema = z.object({
  en: z.string().describe('Natural 2030 social dating translation in English'),
  ja: z.string().describe('Natural 2030 social dating translation in Japanese (日本語)'),
  es: z.string().describe('Natural 2030 social dating translation in Spanish (Español)'),
});
export type LoungeTranslationOutput = z.infer<typeof LoungeTranslationOutputSchema>;

export async function translateLoungeText(
  input: LoungeTranslationInput
): Promise<LoungeTranslationOutput> {
  const cleanText = input.text?.trim();
  if (!cleanText) {
    return { en: '', ja: '', es: '' };
  }

  try {
    const prompt = `You are a professional multilingual translator for the premium social dating app AURA.
Translate the following Korean dating lounge feed post into English, Japanese, and Spanish simultaneously.
Keep the 2030 youthful, friendly, and emotional nuances intact.
Do NOT output markdown or conversational filler. Return only valid JSON matching the schema.

Korean post content:
"""
${cleanText}
"""`;

    const { output } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash'),
      prompt,
      output: { schema: LoungeTranslationOutputSchema },
    });

    if (output && output.en && output.ja && output.es) {
      return output;
    }
  } catch (error) {
    console.warn('Gemini Lounge translation failed, falling back:', error);
  }

  // Graceful fallback
  return {
    en: cleanText,
    ja: cleanText,
    es: cleanText,
  };
}
