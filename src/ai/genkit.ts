import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit con logs de depuración.
 */

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5
].filter(Boolean) as string[];

// Log para verificar carga de llaves en la terminal del servidor
console.log(`[AGROTECH-IA] Sistema iniciado. Llaves detectadas: ${envKeys.length}`);

/**
 * Instancias de Genkit con rotación de llaves.
 */
export const aiInstances = envKeys.map((key, index) => {
  return genkit({
    plugins: [googleAI({ apiKey: key })],
    model: 'googleAI/gemini-1.5-flash',
  });
});

// Instancia por defecto (usará GEMINI_API_KEY si existe, o las del entorno)
export const ai = aiInstances.length > 0 ? aiInstances[0] : genkit({
  plugins: [googleAI()],
  model: 'googleAI/gemini-1.5-flash',
});

export function getAIInstance(index: number) {
  if (aiInstances.length === 0) return ai;
  return aiInstances[index % aiInstances.length];
}
