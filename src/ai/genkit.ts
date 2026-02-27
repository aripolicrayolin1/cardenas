import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

/**
 * Configuración de Genkit con soporte para rotación de llaves.
 * Usamos Gemini 1.5 Flash por ser el modelo con mayor cuota en el plan gratuito.
 */

const keys = [
  "AIzaSyAN_DszwX0FLg_25hacO8HJHSbqIn2L59s",
  "AIzaSyCvEPqyhH2lWBWZrhpZy_vWalAH9Yhc4Zc",
  "AIzaSyAruza-Wafz78L5YeLtvF5ATBB1P5uMKCo"
];

const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter(Boolean) as string[];

const finalKeys = envKeys.length > 0 ? envKeys : keys;

// Creamos 3 instancias distintas de Genkit, una por cada llave
export const aiInstances = finalKeys.map(key => genkit({
  plugins: [googleAI({apiKey: key})],
  model: 'googleai/gemini-1.5-flash',
}));

// Instancia por defecto
export const ai = aiInstances[0];

/**
 * Helper para obtener una instancia específica para la rotación.
 */
export function getAIInstance(index: number) {
  return aiInstances[index % aiInstances.length];
}
