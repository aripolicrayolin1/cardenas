import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Retorna una instancia de Genkit configurada con una de las 3 llaves disponibles.
 * Esto permite rotar llaves cuando una alcanza su límite (Error 429).
 */
export function getAIInstance(keyIndex: number = 0) {
  const keys = [
    "AIzaSyAN_DszwX0FLg_25hacO8HJHSbqIn2L59s", // Llave 1
    "AIzaSyCvEPqyhH2lWBWZrhpZy_vWalAH9Yhc4Zc", // Llave 2
    "AIzaSyAruza-Wafz78L5YeLtvF5ATBB1P5uMKCo"  // Llave 3
  ];

  const envKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean) as string[];

  const finalKeys = envKeys.length > 0 ? envKeys : keys;
  const apiKey = finalKeys[keyIndex % finalKeys.length];

  return genkit({
    plugins: [googleAI({apiKey})],
    model: 'googleai/gemini-2.0-flash-001',
  });
}

// Instancia por defecto
export const ai = getAIInstance(0);
