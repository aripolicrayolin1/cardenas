import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit.
 */

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

/**
 * Instancias de Genkit con rotación de llaves para evitar límites de cuota.
 */
export const aiInstances = envKeys.map((key) => {
  return genkit({
    plugins: [googleAI({ apiKey: key })],
  });
});

// Instancia por defecto
export const ai = aiInstances.length > 0 ? aiInstances[0] : genkit({
  plugins: [googleAI()],
});

export function getAIInstance(index: number) {
  if (aiInstances.length === 0) return ai;
  return aiInstances[index % aiInstances.length];
}
