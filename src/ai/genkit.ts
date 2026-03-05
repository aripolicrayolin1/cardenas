import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit optimizada para evitar errores 404.
 */

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean) as string[];

/**
 * Instancias de Genkit con rotación de llaves. 
 */
export const aiInstances = envKeys.length > 0 
  ? envKeys.map((key) => genkit({
      plugins: [googleAI({ apiKey: key })],
      model: 'googleai/gemini-1.5-flash'
    }))
  : [genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-1.5-flash'
    })];

export const ai = aiInstances[0];

export function getAIInstance(index: number) {
  return aiInstances[index % aiInstances.length];
}
