import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * @fileOverview Configuración centralizada de Genkit.
 * - Elimina llaves hardcodeadas por seguridad.
 * - Utiliza variables de entorno (.env).
 * - Corrige los identificadores de modelo para evitar errores 404.
 */

// Extraemos las llaves de las variables de entorno de forma segura
const envKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5
].filter(Boolean) as string[];

// Si no hay llaves en .env, usamos un array vacío para evitar bloqueos, 
// pero el sistema notificará el error al intentar generar.
const finalKeys = envKeys.length > 0 ? envKeys : [];

/**
 * Creamos instancias distintas de Genkit para soportar la rotación de cuotas.
 * Usamos el identificador de modelo estándar 'googleai/gemini-1.5-flash'.
 */
export const aiInstances = finalKeys.map(key => genkit({
  plugins: [googleAI({ apiKey: key })],
  model: 'googleai/gemini-1.5-flash',
}));

// Instancia por defecto (si hay llaves disponibles)
export const ai = aiInstances.length > 0 ? aiInstances[0] : genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-1.5-flash',
});

/**
 * Helper para obtener una instancia específica para la rotación.
 */
export function getAIInstance(index: number) {
  if (aiInstances.length === 0) return ai;
  return aiInstances[index % aiInstances.length];
}
