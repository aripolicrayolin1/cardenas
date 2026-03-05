import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit.
 * - Utiliza identificadores de cadena para los modelos para evitar errores de importación.
 * - Soporta múltiples llaves de API para rotación de cuotas.
 */

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5
].filter(Boolean) as string[];

const finalKeys = envKeys.length > 0 ? envKeys : [];

/**
 * Instancias de Genkit con rotación de llaves.
 */
export const aiInstances = finalKeys.map(key => genkit({
  plugins: [googleAI({ apiKey: key })],
  model: 'googleAI/gemini-1.5-flash',
}));

// Instancia por defecto
export const ai = aiInstances.length > 0 ? aiInstances[0] : genkit({
  plugins: [googleAI()],
  model: 'googleAI/gemini-1.5-flash',
});

export function getAIInstance(index: number) {
  if (aiInstances.length === 0) return ai;
  return aiInstances[index % aiInstances.length];
}
