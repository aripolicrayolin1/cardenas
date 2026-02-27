import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Retorna una instancia de Genkit configurada con una de las 3 llaves disponibles.
 * Esto permite rotar llaves cuando una alcanza su límite (Error 429).
 */
export function getAIInstance(keyIndex: number = 0) {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  // Si no hay llaves extras, usamos la principal por defecto
  const apiKey = keys[keyIndex % (keys.length || 1)] || process.env.GEMINI_API_KEY;

  return genkit({
    plugins: [googleAI({apiKey})],
    model: 'googleai/gemini-1.5-flash',
  });
}

// Instancia por defecto
export const ai = getAIInstance(0);
